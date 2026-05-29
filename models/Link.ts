import { Schema, model, models } from "mongoose";

const LinkSchema = new Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },

    shortCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    customAlias: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    linkType: {
      type: String,
      enum: ["short", "custom"],
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    password: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },

    totalClicks: {
      type: Number,
      default: 0,
    },

    lastClickedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

LinkSchema.index({ shortCode: 1 }, { unique: true, sparse: true });

LinkSchema.index(
  { username: 1, customAlias: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      username: { $type: "string" },
      customAlias: { $type: "string" },
    },
  }
);

LinkSchema.index({ userId: 1, createdAt: -1 });

export const Link = models.Link || model("Link", LinkSchema);