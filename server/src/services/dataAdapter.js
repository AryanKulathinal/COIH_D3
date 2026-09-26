import { DataSource } from "../models/DataSource.js";
import { KnowledgeEntry } from "../models/KnowledgeEntry.js";

export async function queryDataSources({ sourceType, startDate, endDate, account, mentionsUser, requiresAction, tags, thread }) {
  const filter = { account: account || "demo-account" };

  if (sourceType) filter.sourceType = sourceType;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  if (mentionsUser !== undefined) filter.mentionsUser = mentionsUser;
  if (requiresAction !== undefined) filter.requiresAction = requiresAction;
  if (tags?.length) filter.tags = { $in: tags };
  if (thread) filter.thread = thread;

  const docs = await DataSource.find(filter).sort({ timestamp: 1 }).lean();
  return docs.map((d) => ({
    sourceId: d.sourceId,
    sourceType: d.sourceType,
    timestamp: d.timestamp.toISOString(),
    from: d.from,
    to: d.to,
    subject: d.subject,
    channel: d.channel,
    body: d.body,
    thread: d.thread,
    tags: d.tags,
    priority: d.priority,
    status: d.status,
    mentionsUser: d.mentionsUser,
    requiresAction: d.requiresAction,
    metadata: d.metadata,
  }));
}

export async function searchKnowledge({ query, tags, account }) {
  const filter = { account: account || "demo-account" };
  if (tags?.length) filter.tags = { $in: tags };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ];
  }
  return KnowledgeEntry.find(filter).lean();
}

export async function getThreadMessages({ thread, account }) {
  return DataSource.find({
    thread,
    account: account || "demo-account",
  }).sort({ timestamp: 1 }).lean();
}

export async function getStats({ startDate, endDate, account }) {
  const filter = { account: account || "demo-account" };
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const pipeline = [
    { $match: filter },
    { $group: { _id: "$sourceType", count: { $sum: 1 } } },
  ];

  const results = await DataSource.aggregate(pipeline);
  const stats = {};
  for (const r of results) {
    stats[r._id] = r.count;
  }

  const actionItems = await DataSource.countDocuments({ ...filter, requiresAction: true });
  const mentionsUser = await DataSource.countDocuments({ ...filter, mentionsUser: true });

  return { ...stats, actionItems, mentionsUser };
}
