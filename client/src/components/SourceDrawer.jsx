// Every citation in the app opens here: the original record (or knowledge entry) behind a claim.
import { createContext, useContext, useState, useCallback } from "react";
import { X, ExternalLink, BookOpen } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";
import { findSource, SOURCE_TYPES } from "../data.js";

const DrawerContext = createContext(() => {});
export const useSourceDrawer = () => useContext(DrawerContext);

const fmt = (ts) => (ts ? new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "");

function Field({ label, children }) {
  if (!children || (Array.isArray(children) && !children.length)) return null;
  return (
    <div style={{ marginBottom: "0.625rem" }}>
      <div style={{ fontSize: "0.563rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.125rem" }}>{label}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--grey-800)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{children}</div>
    </div>
  );
}

export function KnowledgeBody({ entry }) {
  return (
    <>
      <Field label="Symptom">{entry.symptom}</Field>
      <Field label="Root cause">{entry.rootCause}</Field>
      <Field label="Resolution">{entry.resolution}</Field>
      <Field label="Prevention">{entry.prevention}</Field>
      <Field label="Misleading hypotheses (don't repeat)">{entry.misleadingHypotheses?.join("\n")}</Field>
      <Field label="Components">{entry.components?.join(", ")}</Field>
      <Field label="Evidence">{entry.evidence?.map((e) => `${e.sourceId} — ${e.title}`).join("\n")}</Field>
      <Field label="Contradicts older records">{entry.contradicts?.map((c) => `${c.sourceId}: ${c.note}`).join("\n")}</Field>
      <Field label="Provenance">
        Captured from {entry.capturedFrom} by {entry.capturedBy} on {fmt(entry.capturedAt)}
        {entry.confirmedBy ? ` · confirmed by ${entry.confirmedBy}` : ""}
      </Field>
    </>
  );
}

export function SourceDrawerProvider({ children }) {
  const { accountId, knowledge, markStep } = useSession();
  const [openId, setOpenId] = useState(null);

  const open = useCallback((id) => {
    setOpenId(id);
    markStep("source");
  }, [markStep]);

  const kb = openId?.startsWith("KB-") ? knowledge.find((k) => k.id === openId) : null;
  const record = !kb && openId ? findSource(accountId, openId) : null;
  const type = kb ? SOURCE_TYPES.knowledge : record ? SOURCE_TYPES[record.sourceType] : null;

  return (
    <DrawerContext.Provider value={open}>
      {children}
      {openId && (
        <div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(22,22,23,0.25)", zIndex: 60 }}>
          <aside onClick={(e) => e.stopPropagation()} className="fade-in"
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(30rem, 100%)", background: "var(--white)", borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", padding: "1rem 1.25rem", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {type && <span className="badge" style={{ background: "var(--grey-300)", color: type.color, fontWeight: 600 }}>{type.label}</span>}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>{openId}</span>
              <button aria-label="Close" onClick={() => setOpenId(null)} style={{ marginLeft: "auto", background: "none", padding: "0.25rem" }}><X size={16} /></button>
            </div>

            {!kb && !record && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                This record is not in the current account's index. Citations are account-scoped — records from other accounts can never be opened here.
              </p>
            )}

            {kb && (
              <>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem", display: "flex", gap: "0.375rem" }}>
                  <BookOpen size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />{kb.title}
                </h3>
                <KnowledgeBody entry={kb} />
              </>
            )}

            {record && (
              <>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--grey-900)", marginBottom: "0.75rem" }}>{record.subject || record.channel}</h3>
                <Field label="When">{fmt(record.timestamp)}</Field>
                <Field label="From">{record.from}</Field>
                <Field label="To">{record.to?.join(", ")}</Field>
                <Field label="Channel">{record.channel}</Field>
                <Field label="Status / priority">{[record.status, record.priority].filter(Boolean).join(" · ")}</Field>
                <Field label="Component">{record.component}</Field>
                <Field label="Content">{record.body}</Field>
                <Field label="Tags">{record.tags?.join(", ")}</Field>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "1rem" }}>
                  <ExternalLink size={11} /> Mocked source system: {type?.system}. In production this links to the original thread.
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </DrawerContext.Provider>
  );
}

export function SourceChip({ id, label }) {
  const open = useSourceDrawer();
  const isKb = id?.startsWith("KB-");
  return (
    <button onClick={() => open(id)} title={label || id}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.188rem", padding: "0.063rem 0.375rem", borderRadius: "var(--radius-sm)", fontSize: "0.625rem", fontWeight: 500, background: isKb ? "var(--success-light)" : "var(--primary-light)", color: isKb ? "var(--success)" : "var(--primary)" }}>
      {isKb ? <BookOpen size={9} /> : <ExternalLink size={9} />}{id}
    </button>
  );
}

// Renders text with [sourceId] / [KB-id] citations turned into clickable chips.
export function CitedText({ text, style }) {
  if (!text) return null;
  const parts = String(text).split(/\[([A-Za-z]+-[A-Za-z0-9-]+(?:\s*,\s*[A-Za-z]+-[A-Za-z0-9-]+)*)\]/g);
  return (
    <div style={{ whiteSpace: "pre-wrap", ...style }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? part.split(/\s*,\s*/).map((id) => <span key={`${i}-${id}`} style={{ margin: "0 0.125rem" }}><SourceChip id={id} /></span>)
          : <span key={i}>{part}</span>
      )}
    </div>
  );
}
