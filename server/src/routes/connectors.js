import { Router } from "express";
import { Connector } from "../models/Connector.js";
import { DataSource } from "../models/DataSource.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    let connectors = await Connector.find({ account: "demo-account" }).sort({ sourceType: 1 });

    if (connectors.length === 0) {
      const defaults = [
        { name: "Microsoft Outlook", sourceType: "email", platform: "outlook", status: "connected", icon: "mail", config: { authType: "oauth", syncInterval: "5m" } },
        { name: "Microsoft Teams", sourceType: "chat", platform: "teams", status: "connected", icon: "message-square", config: { authType: "oauth", syncInterval: "5m" } },
        { name: "Jira", sourceType: "ticket", platform: "jira", status: "connected", icon: "ticket", config: { authType: "api_key", syncInterval: "10m" } },
        { name: "Confluence", sourceType: "document", platform: "confluence", status: "connected", icon: "file-text", config: { authType: "api_key", syncInterval: "30m" } },
        { name: "Teams Meetings", sourceType: "meeting", platform: "teams-meetings", status: "connected", icon: "video", config: { authType: "oauth", syncInterval: "manual" } },
        { name: "Outlook Calendar", sourceType: "calendar", platform: "outlook-calendar", status: "connected", icon: "calendar", config: { authType: "oauth", syncInterval: "5m" } },
      ];
      connectors = await Connector.insertMany(defaults.map((d) => ({ ...d, account: "demo-account" })));
    }

    const stats = await DataSource.aggregate([
      { $match: { account: "demo-account" } },
      { $group: { _id: "$sourceType", count: { $sum: 1 }, latest: { $max: "$timestamp" } } },
    ]);

    const statsMap = {};
    for (const s of stats) statsMap[s._id] = { count: s.count, latest: s.latest };

    const enriched = connectors.map((c) => {
      const obj = c.toObject ? c.toObject() : c;
      return { ...obj, stats: statsMap[obj.sourceType] || { count: 0, latest: null } };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/toggle", async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id);
    if (!connector) return res.status(404).json({ error: "Connector not found" });

    connector.status = connector.status === "connected" ? "disconnected" : "connected";
    if (connector.status === "connected") {
      connector.config.lastSyncAt = new Date();
    }
    await connector.save();
    res.json(connector);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/sync", async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id);
    if (!connector) return res.status(404).json({ error: "Connector not found" });

    connector.status = "syncing";
    await connector.save();

    setTimeout(async () => {
      const count = await DataSource.countDocuments({ account: "demo-account", sourceType: connector.sourceType });
      connector.status = "connected";
      connector.config.lastSyncAt = new Date();
      connector.config.itemCount = count;
      await connector.save();
    }, 1500);

    res.json({ message: "Sync started", connector });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const connector = await Connector.create({ ...req.body, account: "demo-account" });
    res.json(connector);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/data", async (req, res) => {
  try {
    const data = req.body;
    if (!data.sourceType || !data.body) {
      return res.status(400).json({ error: "sourceType and body are required" });
    }

    const entry = await DataSource.create({
      ...data,
      account: "demo-account",
      sourceId: data.sourceId || `${data.sourceType}-${Date.now()}`,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/data/bulk", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    const entries = await DataSource.insertMany(
      items.map((item) => ({
        ...item,
        account: "demo-account",
        sourceId: item.sourceId || `${item.sourceType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      }))
    );

    res.json({ inserted: entries.length, entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/data", async (req, res) => {
  try {
    const { sourceType, limit = 50 } = req.query;
    const filter = { account: "demo-account" };
    if (sourceType) filter.sourceType = sourceType;

    const items = await DataSource.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/data/:id", async (req, res) => {
  try {
    await DataSource.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
