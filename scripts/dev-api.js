// Local stand-in for Vercel: mounts every api/<name>.js handler at /api/<name>.
// Production runs the same files as Vercel serverless functions.
import express from "express";
import { existsSync, readdirSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

// Load every handler once at startup (like a warm serverless instance) so requests never
// trigger module loading mid-call.
const handlers = {};
for (const file of readdirSync("api").filter((f) => f.endsWith(".js"))) {
  handlers[path.basename(file, ".js")] = (await import(pathToFileURL(path.resolve("api", file)).href)).default;
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.all("/api/:name", async (req, res) => {
  const handler = handlers[req.params.name];
  if (!handler) return res.status(404).json({ error: "Not found" });
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`COIH dev API on http://localhost:${PORT} (${Object.keys(handlers).join(", ")})`));
