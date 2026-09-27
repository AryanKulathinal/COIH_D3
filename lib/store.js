// JSON-backed data adapter. Same query surface the MongoDB adapter had, but every
// call is scoped to one account's folder under data/ — no path crosses accounts.
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildSourceIndex, buildKnowledgeIndex, search } from "./search.js";

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const SOURCE_FILES = ["emails", "chats", "tickets", "incidents", "documents", "meetings", "calendar"];

const readJson = (...parts) => JSON.parse(readFileSync(path.join(DATA_DIR, ...parts), "utf8"));

const config = readJson("accounts.json");
const cache = new Map();

export const getConfig = () => config;
export const isValidAccount = (id) => config.accounts.some((a) => a.id === id);
export const getAccount = (id) => config.accounts.find((a) => a.id === id);
export const getPersona = (id) => config.personas.find((p) => p.id === id);

function loadAccount(account) {
  if (!isValidAccount(account)) throw new Error(`Unknown account: ${account}`);
  if (!cache.has(account)) {
    const sources = SOURCE_FILES.flatMap((f) => readJson(account, `${f}.json`))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const knowledge = readJson(account, "knowledge.json");
    const people = readJson(account, "people.json");
    cache.set(account, { sources, knowledge, people, sourceIndex: buildSourceIndex(sources) });
  }
  return cache.get(account);
}

const inWindow = (ts, startDate, endDate) =>
  (!startDate || ts >= new Date(startDate).toISOString()) &&
  (!endDate || ts <= new Date(`${endDate}${endDate.length === 10 ? "T23:59:59Z" : ""}`).toISOString());

const snippet = (text, max = 220) => (text.length > max ? `${text.slice(0, max)}…` : text);

export function queryDataSources({ account, sourceType, startDate, endDate, mentionsUser, requiresAction, tags, thread }) {
  return loadAccount(account).sources.filter((d) =>
    (!sourceType || d.sourceType === sourceType) &&
    inWindow(d.timestamp, startDate, endDate) &&
    (mentionsUser === undefined || Boolean(d.mentionsUser) === mentionsUser) &&
    (requiresAction === undefined || Boolean(d.requiresAction) === requiresAction) &&
    (!tags?.length || d.tags?.some((t) => tags.includes(t))) &&
    (!thread || d.thread === thread)
  );
}

export function searchSources({ account, query, sourceTypes, startDate, endDate, limit = 8 }) {
  const { sourceIndex, sources } = loadAccount(account);
  const byId = new Map(sources.map((s) => [s.sourceId, s]));
  const hits = search(sourceIndex, query, {
    limit,
    filter: (r) => {
      const d = byId.get(r.id);
      return (!sourceTypes?.length || sourceTypes.includes(d.sourceType)) && inWindow(d.timestamp, startDate, endDate);
    },
  });
  return hits.map((h) => {
    const d = byId.get(h.id);
    return {
      sourceId: d.sourceId, sourceType: d.sourceType, timestamp: d.timestamp, from: d.from,
      subject: d.subject || d.channel, status: d.status, component: d.component,
      snippet: snippet(d.body), score: Number(h.score.toFixed(2)),
    };
  });
}

export function getSource({ account, sourceId }) {
  return loadAccount(account).sources.find((s) => s.sourceId === sourceId) || null;
}

// Captured entries live in the browser (localStorage) and arrive with each request.
// Only accept well-formed entries that belong to the requesting account.
const KB_STRING_FIELDS = ["id", "title", "category", "symptom", "rootCause", "resolution", "prevention", "capturedFrom", "capturedBy", "confirmedBy", "capturedAt"];

export function sanitizeEntries(account, entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e && e.account === account && e.status === "confirmed" && typeof e.id === "string")
    .slice(0, 50)
    .map((e) => {
      const clean = { account, status: "confirmed" };
      for (const f of KB_STRING_FIELDS) {
        const v = Array.isArray(e[f]) ? e[f].filter((x) => typeof x === "string").join("\n") : e[f];
        if (typeof v === "string") clean[f] = v.slice(0, 3000);
      }
      for (const f of ["tags", "components"]) clean[f] = Array.isArray(e[f]) ? e[f].filter((x) => typeof x === "string").slice(0, 20) : [];
      clean.evidence = Array.isArray(e.evidence)
        ? e.evidence.slice(0, 20).map((s) => ({ sourceId: String(s.sourceId || ""), sourceType: String(s.sourceType || ""), title: String(s.title || "") }))
        : [];
      return clean;
    });
}

export function getKnowledge({ account, extraEntries = [] }) {
  const seed = loadAccount(account).knowledge;
  const seen = new Set(seed.map((e) => e.id));
  return [...seed, ...sanitizeEntries(account, extraEntries).filter((e) => !seen.has(e.id))];
}

export function searchKnowledge({ account, query, extraEntries = [], limit = 5 }) {
  const entries = getKnowledge({ account, extraEntries });
  const index = buildKnowledgeIndex(entries);
  const byId = new Map(entries.map((e) => [e.id, e]));
  return search(index, query, { limit }).map((h) => ({ ...byId.get(h.id), score: Number(h.score.toFixed(2)) }));
}

export function getIncidentContext({ account, incidentId }) {
  const { sources } = loadAccount(account);
  const incident = sources.find((s) => s.sourceId === incidentId && s.sourceType === "incident");
  if (!incident) return null;
  const related = sources.filter((s) => s.sourceId !== incidentId && (
    (incident.thread && s.thread === incident.thread) ||
    s.body.includes(incidentId) ||
    (s.sourceType === "document" && s.component && s.component === incident.component)
  ));
  return { incident, related };
}

export function listPeople({ account }) {
  return loadAccount(account).people;
}

export function getStats({ account, startDate, endDate }) {
  const rows = loadAccount(account).sources.filter((d) => inWindow(d.timestamp, startDate, endDate));
  const stats = {};
  for (const r of rows) stats[r.sourceType] = (stats[r.sourceType] || 0) + 1;
  return {
    ...stats,
    total: rows.length,
    actionItems: rows.filter((r) => r.requiresAction).length,
    mentionsUser: rows.filter((r) => r.mentionsUser).length,
  };
}
