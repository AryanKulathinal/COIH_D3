// Lexical (BM25-style) retrieval over account records via MiniSearch.
// Swap this module for a vector / hybrid index at scale — callers only use search().
import MiniSearch from "minisearch";

const SOURCE_FIELDS = ["subject", "body", "tags", "from", "channel", "component", "sourceId"];
const KB_FIELDS = ["title", "symptom", "rootCause", "resolution", "prevention", "tags", "components", "capturedFrom"];

const asText = (v) => (Array.isArray(v) ? v.join(" ") : v == null ? "" : String(v));

function build(docs, fields, idField) {
  const index = new MiniSearch({
    idField,
    fields,
    extractField: (doc, field) => asText(doc[field]),
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: "OR", boost: { subject: 2, title: 3, tags: 2, sourceId: 3 } },
  });
  index.addAll(docs);
  return index;
}

export function buildSourceIndex(sources) {
  return build(sources, SOURCE_FIELDS, "sourceId");
}

export function buildKnowledgeIndex(entries) {
  return build(entries, KB_FIELDS, "id");
}

export function search(index, query, { limit = 8, filter } = {}) {
  if (!query?.trim()) return [];
  return index.search(query, filter ? { filter } : undefined).slice(0, limit);
}
