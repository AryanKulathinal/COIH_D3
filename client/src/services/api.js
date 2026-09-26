const BASE = "/api";

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  getMode: () => request("/mode"),
  generateBrief: (data) => request("/brief/generate", { method: "POST", body: JSON.stringify(data) }),
  getBrief: (id) => request(`/brief/${id}`),
  getBriefs: () => request("/briefs"),
  askQuestion: (data) => request("/qa/ask", { method: "POST", body: JSON.stringify(data) }),
  captureIncident: (incidentId) => request("/capture/incident", { method: "POST", body: JSON.stringify({ incidentId }) }),
  confirmEntry: (data) => request("/capture/confirm", { method: "POST", body: JSON.stringify(data) }),
  getKnowledge: () => request("/knowledge"),
  getStats: () => request("/data-sources/stats"),
  getIncidents: () => request("/data-sources/incidents"),

  getConnectors: () => request("/connectors"),
  toggleConnector: (id) => request(`/connectors/${id}/toggle`, { method: "PUT" }),
  syncConnector: (id) => request(`/connectors/${id}/sync`, { method: "POST" }),
  addConnector: (data) => request("/connectors", { method: "POST", body: JSON.stringify(data) }),
  addDataEntry: (data) => request("/connectors/data", { method: "POST", body: JSON.stringify(data) }),
  addDataBulk: (items) => request("/connectors/data/bulk", { method: "POST", body: JSON.stringify({ items }) }),
  getDataEntries: (sourceType, limit) => request(`/connectors/data?sourceType=${sourceType || ""}&limit=${limit || 50}`),
  deleteDataEntry: (id) => request(`/connectors/data/${id}`, { method: "DELETE" }),

  getFlashcards: (data) => request("/insights/flashcards", { method: "POST", body: JSON.stringify(data) }),
  getQuiz: (data) => request("/insights/quiz", { method: "POST", body: JSON.stringify(data) }),
  getAudioScript: (data) => request("/insights/audio", { method: "POST", body: JSON.stringify(data) }),
  getInfographic: (data) => request("/insights/infographic", { method: "POST", body: JSON.stringify(data) }),
};
