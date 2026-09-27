// Runs every demo path once against the live model (OpenRouter) and saves the responses to
// data/<account>/fallbacks/, so the hosted demo still works if the model is unreachable.
// Usage: OPENROUTER_API_KEY in .env.local, then `npm run record` (a few cents on gpt-oss-120b).
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

for (const file of [".env.local", ".env"]) if (existsSync(file)) process.loadEnvFile(file);

const { getConfig, getPersona } = await import("../lib/store.js");
const { fallbackKey } = await import("../lib/guard.js");
const { answerQuestion } = await import("../lib/agents/qa.js");
const { generateBrief } = await import("../lib/agents/brief.js");
const { captureFromIncident } = await import("../lib/agents/capture.js");
const { generateOnboarding } = await import("../lib/agents/onboarding.js");

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const only = process.argv[2]; // optional filter, e.g. "ask" or "brief"

function save(account, key, value) {
  const dir = path.join(DATA, account, "fallbacks");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(value, null, 2) + "\n");
  console.log(`  saved ${account}/fallbacks/${key}.json`);
}

async function step(label, key, fn) {
  if (only && !key.startsWith(only)) return null;
  process.stdout.write(`${label}…\n`);
  try {
    return await fn();
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    return null;
  }
}

const { personas, demo } = getConfig();

for (const p of personas.filter((x) => x.leave)) {
  const key = fallbackKey("brief", p.id);
  const r = await step(`Brief for ${p.name}`, key, () => generateBrief({ account: p.account, persona: p }));
  if (r) save(p.account, key, r);
}

for (const p of personas.filter((x) => x.scenario === "newjoiner")) {
  const key = fallbackKey("onboarding", p.id);
  const r = await step(`Onboarding for ${p.name}`, key, () => generateOnboarding({ account: p.account, persona: p }));
  if (r) save(p.account, key, r);
}

const capturedByAccount = {};
for (const [incidentId, prefill] of Object.entries(demo.resolutionPrefill)) {
  const p = personas.find((x) => x.userId === prefill.resolvedBy);
  const key = fallbackKey("capture", incidentId);
  const r = await step(`Capture ${incidentId}`, key, () => captureFromIncident({ account: p.account, incidentId, resolutionNote: prefill.note, resolvedBy: prefill.resolvedBy }));
  if (r) {
    save(p.account, key, r);
    (capturedByAccount[p.account] ??= []).push({ ...r.entry, status: "confirmed", confirmedBy: prefill.resolvedBy });
  }
}

for (const p of personas) {
  const persona = getPersona(p.id);
  const variants = [["seed", []]];
  if (capturedByAccount[p.account]) variants.push(["captured", capturedByAccount[p.account]]);
  for (const q of p.questions) {
    for (const kbMode of ["connected", "disconnected"]) {
      for (const [state, entries] of variants) {
        const key = fallbackKey("ask", kbMode, state, q);
        const r = await step(`Ask (${p.name}, ${kbMode}, ${state}): ${q}`, key, () =>
          answerQuestion({ account: p.account, persona, question: q, kbMode, capturedEntries: entries }));
        if (r) save(p.account, key, r);
      }
    }
  }
}
console.log("Done.");
