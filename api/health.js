export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
