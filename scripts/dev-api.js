// Local stand-in for Vercel: mounts every api/<name>.js handler at /api/<name>.
// Production runs the same files as Vercel serverless functions.
import express from "express";
import { existsSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.all("/api/:name", async (req, res) => {
  const file = path.resolve("api", `${req.params.name}.js`);
  if (!existsSync(file)) return res.status(404).json({ error: "Not found" });
  try {
    const { default: handler } = await import(pathToFileURL(file).href);
    await handler(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`COIH dev API on http://localhost:${PORT}`));
