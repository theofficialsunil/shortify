import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { getExpirationDate } from "@/lib/expiration";
import { getCurrentUser } from "@/lib/session";
import { generateShortCode, normalizeAlias } from "@/lib/short-code";
import { formatZodError } from "@/lib/validation-error";
import { Link } from "@/models/Link";
import { createLinkSchema } from "@/validations/link";

const RESERVED_USER_ALIASES = [
    "new",
    "edit",
    "settings",
    "admin",
];

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();

        if (!user?.id) {
            return Response.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        if (!user.usernameSetupCompleted) {
            return Response.json(
                {
                    success: false,
                    message: "Please complete username setup first",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const parsedBody = createLinkSchema.safeParse(body);

        if (!parsedBody.success) {
            return Response.json(
                {
                    success: false,
                    errors: formatZodError(parsedBody.error),
                },
                { status: 400 }
            );
        }

        const {
            originalUrl,
            customAlias,
            description,
            expiration,
            passwordProtected,
            password,
        } = parsedBody.data;

        await connectDB();

        const normalizedAlias = normalizeAlias(customAlias);

        if (normalizedAlias && RESERVED_USER_ALIASES.includes(normalizedAlias)) {
            return Response.json(
                {
                    success: false,
                    message: "This alias is reserved",
                },
                { status: 400 }
            );
        }

        let shortCode = "";
        let linkType: "short" | "custom" = "short";

        if (normalizedAlias) {
            linkType = "custom";

            const existingAlias = await Link.findOne({
                username: user.username,
                customAlias: normalizedAlias,
            });

            if (existingAlias) {
                return Response.json(
                    {
                        success: false,
                        message: "You already used this alias",
                    },
                    { status: 409 }
                );
            }
        } else {
            shortCode = generateShortCode();

            while (await Link.findOne({ shortCode })) {
                shortCode = generateShortCode();
            }
        }

        const expiresAt = getExpirationDate(expiration);

        const hashedPassword =
            passwordProtected && password ? await bcrypt.hash(password, 10) : null;

        const linkPayload = normalizedAlias
            ? {
                originalUrl,
                customAlias: normalizedAlias,
                username: user.username,
                linkType,
                userId: user.id,
                description: description || "",
                expiresAt,
                password: hashedPassword,
                status: "active",
            }
            : {
                originalUrl,
                shortCode,
                linkType,
                userId: user.id,
                description: description || "",
                expiresAt,
                password: hashedPassword,
                status: "active",
            };

        const link = await Link.create(linkPayload);

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

        const shortUrl = normalizedAlias
            ? `${baseUrl}/s/${user.username}/${normalizedAlias}`
            : `${baseUrl}/s/${link.shortCode}`;

        return Response.json(
            {
                success: true,
                message: "Link created successfully",
                data: {
                    id: link._id.toString(),
                    originalUrl: link.originalUrl,
                    shortCode: link.shortCode,
                    customAlias: link.customAlias,
                    username: link.username,
                    linkType: link.linkType,
                    shortUrl,
                    description: link.description,
                    expiresAt: link.expiresAt,
                    status: link.status,
                    totalClicks: link.totalClicks,
                    createdAt: link.createdAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_LINK_ERROR:", error);

        return Response.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}