import mongoose from "mongoose";

const connectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sourceType: {
    type: String,
    enum: ["email", "chat", "ticket", "document", "calendar", "meeting"],
    required: true,
  },
  platform: { type: String, required: true },
  account: { type: String, default: "demo-account" },
  status: {
    type: String,
    enum: ["connected", "disconnected", "syncing", "error"],
    default: "disconnected",
  },
  config: {
    apiEndpoint: String,
    authType: { type: String, enum: ["oauth", "api_key", "webhook", "manual"], default: "manual" },
    lastSyncAt: Date,
    syncInterval: { type: String, default: "manual" },
    itemCount: { type: Number, default: 0 },
  },
  icon: String,
}, { timestamps: true });

export const Connector = mongoose.model("Connector", connectorSchema);
