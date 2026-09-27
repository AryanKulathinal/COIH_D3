const BASE = "/api";

async function request(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Reads the NDJSON progress stream from /api/brief, calling onEvent for each line.
async function streamBrief(body, onEvent) {
  const res = await fetch(`${BASE}/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines.filter(Boolean)) {
      const event = JSON.parse(line);
      onEvent?.(event);
      if (event.type === "done") final = event;
      if (event.type === "error") throw new Error(event.error);
    }
  }
  if (!final) throw new Error("Brief stream ended unexpectedly");
  return final;
}

export const api = {
  ask: (body) => request("/ask", body),
  capture: (body) => request("/capture", body),
  onboarding: (body) => request("/onboarding", body),
  streamBrief,
};
