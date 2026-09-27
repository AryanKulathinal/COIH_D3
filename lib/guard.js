// Request hygiene for the public demo: POST-only, account whitelist, input caps,
// best-effort per-IP rate limit, and recorded fallbacks so a failed Claude call never breaks the demo.
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isValidAccount } from "./store.js";

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;
const hits = new Map();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function rateLimit(req) {
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) throw new HttpError(429, "Demo rate limit reached — please wait a few minutes.");
  recent.push(now);
  hits.set(ip, recent);
}

export function requireString(value, name, max = 1000) {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `Missing ${name}`);
  if (value.length > max) throw new HttpError(400, `${name} is too long (max ${max} characters)`);
  return value.trim();
}

export function loadFallback(account, key) {
  const file = path.join(DATA_DIR, account, "fallbacks", `${key}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

export function fallbackKey(...parts) {
  return parts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

// Wraps a POST handler: validates the account, applies the rate limit, and maps errors to JSON.
export function apiHandler(fn) {
  return async (req, res) => {
    try {
      if (req.method !== "POST") throw new HttpError(405, "Use POST");
      const body = req.body || {};
      if (!isValidAccount(body.accountId)) throw new HttpError(400, "Unknown or missing accountId");
      rateLimit(req);
      await fn(body, req, res);
    } catch (err) {
      if (!err.status || err.status >= 500) console.error(err);
      if (res.headersSent) return res.end();
      res.status(err.status || 500).json({ error: err.status ? err.message : "The hub could not complete this request. Please try again." });
    }
  };
}

// Runs a Claude-backed task; on failure returns a recorded response (if one exists) flagged as fallback.
export async function withFallback(account, key, task) {
  try {
    return await task();
  } catch (err) {
    const recorded = loadFallback(account, key);
    if (!recorded) throw err;
    console.warn(`Serving recorded fallback ${account}/${key}: ${err.message}`);
    return { ...recorded, fallback: true };
  }
}
