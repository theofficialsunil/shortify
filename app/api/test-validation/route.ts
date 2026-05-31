import { createLinkSchema } from "@/validations/link";
import { formatZodError } from "@/lib/validation-error";

export async function GET() {
  const result = createLinkSchema.safeParse({
    originalUrl: "javascript:alert(1)",
    customAlias: "my link",
    expiration: "7days",
    passwordProtected: false,
    password: "",
  });

  if (!result.success) {
    return Response.json({
      success: false,
      errors: formatZodError(result.error),
    });
  }

  return Response.json({
    success: true,
    data: result.data,
  });
}