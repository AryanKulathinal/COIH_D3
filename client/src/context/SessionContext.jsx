// Demo session: who the judge is acting as, plus everything they changed
// (captured KB entries, resolved incidents, checklist progress) persisted in localStorage.
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { getPersona, getAccount, getAccountData } from "../data.js";

const KEY = { persona: "coih:persona", kb: (a) => `coih:kb:${a}`, incidents: (a) => `coih:incidents:${a}`, progress: "coih:progress", cache: "coih:cache" };

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [personaId, setPersonaId] = useState(() => read(KEY.persona, null));
  const [version, setVersion] = useState(0); // bump to re-read localStorage-backed state
  const bump = () => setVersion((v) => v + 1);

  const persona = personaId ? getPersona(personaId) : null;
  const accountId = persona?.account || null;
  const account = accountId ? getAccount(accountId) : null;

  const captured = useMemo(() => (accountId ? read(KEY.kb(accountId), []) : []), [accountId, version]);
  const incidentState = useMemo(() => (accountId ? read(KEY.incidents(accountId), {}) : {}), [accountId, version]);
  const progress = useMemo(() => read(KEY.progress, {}), [version]);

  const selectPersona = useCallback((id) => {
    write(KEY.persona, id);
    setPersonaId(id);
  }, []);

  const clearPersona = useCallback(() => {
    localStorage.removeItem(KEY.persona);
    setPersonaId(null);
  }, []);

  const publishEntry = useCallback((entry) => {
    const list = read(KEY.kb(entry.account), []).filter((e) => e.id !== entry.id);
    write(KEY.kb(entry.account), [...list, entry]);
    bump();
  }, []);

  const setIncident = useCallback((incidentId, patch) => {
    if (!accountId) return;
    const all = read(KEY.incidents(accountId), {});
    write(KEY.incidents(accountId), { ...all, [incidentId]: { ...all[incidentId], ...patch } });
    bump();
  }, [accountId]);

  const markStep = useCallback((stepId) => {
    if (!personaId) return;
    const all = read(KEY.progress, {});
    if (all[personaId]?.[stepId]) return;
    write(KEY.progress, { ...all, [personaId]: { ...all[personaId], [stepId]: true } });
    bump();
  }, [personaId]);

  // Per-persona cache of generated results (brief, onboarding) so navigation doesn't re-run Claude.
  const getCached = useCallback((key) => read(KEY.cache, {})[`${personaId}:${key}`], [personaId, version]);
  const setCached = useCallback((key, value) => {
    const all = read(KEY.cache, {});
    write(KEY.cache, { ...all, [`${personaId}:${key}`]: value });
    bump();
  }, [personaId]);

  const resetDemo = useCallback(() => {
    Object.keys(localStorage).filter((k) => k.startsWith("coih:")).forEach((k) => localStorage.removeItem(k));
    setPersonaId(null);
    bump();
  }, []);

  const seed = accountId ? getAccountData(accountId) : { sources: [], knowledge: [], people: [] };
  const knowledge = [...seed.knowledge, ...captured];

  const value = {
    persona, account, accountId, seed, knowledge, captured, incidentState, progress: progress[personaId] || {},
    selectPersona, clearPersona, publishEntry, setIncident, markStep, getCached, setCached, resetDemo,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
