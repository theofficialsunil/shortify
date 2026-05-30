import { Schema, model, models } from "mongoose";

const ClickSchema = new Schema(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: "Link",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    referrer: {
      type: String,
      default: "Direct",
    },

    refererDomain: {
      type: String,
      default: "Direct",
    },

    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    ipHash: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "Unknown",
    },

    region: {
      type: String,
      default: "Unknown",
    },

    city: {
      type: String,
      default: "Unknown",
    },

    deviceType: {
      type: String,
      default: "desktop",
    },

    browser: {
      type: String,
      default: "Unknown",
    },

    os: {
      type: String,
      default: "Unknown",
    },

    language: {
      type: String,
      default: "Unknown",
    },

    utmSource: {
      type: String,
      default: "",
    },

    utmMedium: {
      type: String,
      default: "",
    },

    utmCampaign: {
      type: String,
      default: "",
    },

    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

ClickSchema.index({ linkId: 1, clickedAt: -1 });
ClickSchema.index({ userId: 1, clickedAt: -1 });
ClickSchema.index({ linkId: 1, visitorId: 1 });
ClickSchema.index({ linkId: 1, sessionId: 1 });
ClickSchema.index({ country: 1 });
ClickSchema.index({ deviceType: 1 });
ClickSchema.index({ browser: 1 });
ClickSchema.index({ os: 1 });

export const Click = models.Click || model("Click", ClickSchema);