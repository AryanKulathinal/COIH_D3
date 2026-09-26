import mongoose from "mongoose";

const knowledgeEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  account: { type: String, default: "demo-account" },
  category: {
    type: String,
    enum: ["incident", "decision", "process", "troubleshooting", "onboarding"],
  },
  sources: [{
    sourceId: String,
    sourceType: String,
    title: String,
    url: String,
  }],
  tags: [String],
  createdBy: { type: String },
  confirmedBy: { type: String },
  status: {
    type: String,
    enum: ["draft", "confirmed", "archived"],
    default: "draft",
  },
  provenance: {
    capturedFrom: String,
    capturedAt: Date,
    lastVerified: Date,
  },
}, { timestamps: true });

knowledgeEntrySchema.index({ account: 1, category: 1 });
knowledgeEntrySchema.index({ tags: 1 });

export const KnowledgeEntry = mongoose.model("KnowledgeEntry", knowledgeEntrySchema);
