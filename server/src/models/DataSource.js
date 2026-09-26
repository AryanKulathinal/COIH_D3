import mongoose from "mongoose";

const dataSourceSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ["email", "chat", "ticket", "document", "calendar", "meeting"],
    required: true,
  },
  sourceId: { type: String, required: true },
  account: { type: String, default: "demo-account" },
  timestamp: { type: Date, required: true },
  from: { type: String },
  to: [String],
  subject: { type: String },
  channel: { type: String },
  body: { type: String, required: true },
  thread: { type: String },
  tags: [String],
  priority: { type: String, enum: ["low", "medium", "high", "critical"] },
  status: { type: String, enum: ["open", "resolved", "pending", "closed"] },
  mentionsUser: { type: Boolean, default: false },
  requiresAction: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

dataSourceSchema.index({ account: 1, timestamp: 1 });
dataSourceSchema.index({ sourceType: 1, timestamp: 1 });
dataSourceSchema.index({ thread: 1 });

export const DataSource = mongoose.model("DataSource", dataSourceSchema);
