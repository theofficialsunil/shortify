import mongoose, { Schema, model, models } from "mongoose";

const AnalyticsSchema = new Schema({
  linkId: {
    type: Schema.Types.ObjectId,
    ref: "Link",
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },

  country: String,
  city: String,

  device: String,
  browser: String,
  os: String,

  referrer: String,
  ipHash: String,
});

export const Analytics =
  models.Analytics || model("Analytics", AnalyticsSchema);