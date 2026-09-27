// Server-side citation verification: a model may only cite records it actually retrieved in
// this request. Open models occasionally invent plausible IDs (e.g. "doc-007"); prompts alone
// don't stop that, so every agent output is checked against the retrieval log before it is returned.

const ID_KEYS = ["sourceId", "id"];

// Wraps an agent's executeTool so every record ID returned by any tool is recorded.
export function trackRetrieval(executeTool) {
  const ids = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === "object") {
      for (const k of ID_KEYS) if (typeof value[k] === "string") ids.add(value[k]);
      Object.values(value).forEach(visit);
    }
  };
  const tracked = async (name, input) => {
    const output = await executeTool(name, input);
    visit(output);
    return output;
  };
  return { executeTool: tracked, ids };
}

const CITATION = /\[([A-Za-z]+-[A-Za-z0-9-]+(?:\s*,\s*[A-Za-z]+-[A-Za-z0-9-]+)*)\]|【([A-Za-z]+-[A-Za-z0-9-]+)】/g;

// Removes inline [id] / 【id】 citations that are not in `valid`; returns cleaned text + counts.
export function cleanInline(text, valid) {
  if (typeof text !== "string") return { text, kept: 0, removed: [] };
  const removed = [];
  let kept = 0;
  const cleaned = text.replace(CITATION, (match, list, single) => {
    const ids = (list || single).split(/\s*,\s*/);
    const good = ids.filter((id) => valid.has(id));
    ids.filter((id) => !valid.has(id)).forEach((id) => removed.push(id));
    kept += good.length;
    return good.length ? `[${good.join(", ")}]` : "";
  });
  return { text: cleaned.replace(/[ \t]+([.,;:])/g, "$1"), kept, removed };
}

const filterSources = (sources, valid, removed) =>
  (Array.isArray(sources) ? sources : []).filter((s) => {
    const ok = s && valid.has(s.sourceId);
    if (!ok && s?.sourceId) removed.push(s.sourceId);
    return ok;
  });

// Q&A answer: drop unverifiable citations; an answer with no verifiable citation becomes a refusal.
export function verifyAnswer(result, valid) {
  if (!result?.answer) {
    return { ...result, sources: filterSources(result?.sources, valid, []), verification: { cited: 0, removed: [] } };
  }
  const removed = [];
  const sources = filterSources(result.sources, valid, removed);
  const inline = cleanInline(result.answer, valid);
  removed.push(...inline.removed);
  const verification = { cited: inline.kept + sources.length, removed: [...new Set(removed)] };

  if (inline.kept === 0 && sources.length === 0) {
    return {
      ...result,
      answer: null,
      confidence: "none",
      sources: [],
      refusal: `The draft answer could not be verified: none of its citations match a record retrieved from this account${verification.removed.length ? ` (unverifiable: ${verification.removed.join(", ")})` : ""}. The hub does not show unverified answers.`,
      verification,
    };
  }
  const downgrade = verification.removed.length && result.confidence === "high" ? "medium" : result.confidence;
  return {
    ...result,
    answer: inline.text,
    sources,
    confidence: downgrade,
    gaps: verification.removed.length ? [...(result.gaps || []), `Removed unverifiable citations: ${verification.removed.join(", ")}`] : result.gaps,
    verification,
  };
}

// Brief / onboarding style lists: drop invalid sources, then drop items left with none.
export function verifyItems(items, valid, sourcesKey = "sources", removed = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({ ...item, [sourcesKey]: filterSources(item?.[sourcesKey], valid, removed) }))
    .filter((item) => item[sourcesKey].length > 0);
}
