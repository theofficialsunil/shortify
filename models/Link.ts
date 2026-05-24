import mongoose, { Schema, model, models } from "mongoose";
const LinkSchema = new Schema(
    {
        originalUrl: { type: String, required: true },
        shortCode: { type: String, required: true, unique: true },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        description: String,
        expiresAt: Date,
        password: String,
        status: {
            type: String,
            enum: ["active", "disabled"],
            default: "active",
        },

        totalClicks: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Link = models.Link || model("Link", LinkSchema);