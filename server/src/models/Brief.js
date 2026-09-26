import mongoose from "mongoose";

const briefSectionSchema = new mongoose.Schema({
  title: String,
  items: [{
    summary: String,
    detail: String,
    priority: { type: String, enum: ["low", "medium", "high", "critical"] },
    status: { type: String, enum: ["resolved", "open", "needs_action", "fyi"] },
    sources: [{
      sourceId: String,
      sourceType: String,
      title: String,
      snippet: String,
    }],
  }],
}, { _id: false });

const briefSchema = new mongoose.Schema({
  account: { type: String, default: "demo-account" },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  leaveStart: { type: Date, required: true },
  leaveEnd: { type: Date, required: true },
  generatedAt: { type: Date, default: Date.now },
  overview: { type: String },
  sections: {
    decisions: briefSectionSchema,
    workItems: briefSectionSchema,
    openQuestions: briefSectionSchema,
    incidents: briefSectionSchema,
    blockedItems: briefSectionSchema,
  },
  stats: {
    totalEmails: Number,
    totalChats: Number,
    totalTickets: Number,
    keyDecisions: Number,
    actionItems: Number,
  },
  tokenUsage: {
    inputTokens: Number,
    outputTokens: Number,
    cacheReadTokens: Number,
    cacheCreationTokens: Number,
    estimatedCost: Number,
  },
}, { timestamps: true });

export const Brief = mongoose.model("Brief", briefSchema);
