// Read-only view of the synthetic seed data for browsing screens (lists, source drawer).
// Claude never runs in the browser — agents read the same files server-side.
import config from "@data/accounts.json";

const files = import.meta.glob("@data/*/*.json", { eager: true, import: "default" });
const SOURCE_FILES = ["emails", "chats", "tickets", "incidents", "documents", "meetings", "calendar"];

const byAccount = {};
for (const [path, rows] of Object.entries(files)) {
  const [, account, name] = path.match(/\/data\/([^/]+)\/([^/]+)\.json$/) || [];
  if (!account) continue;
  byAccount[account] ??= { sources: [], knowledge: [], people: [] };
  if (SOURCE_FILES.includes(name)) byAccount[account].sources.push(...rows);
  else if (name === "knowledge") byAccount[account].knowledge = rows;
  else if (name === "people") byAccount[account].people = rows;
}
for (const a of Object.values(byAccount)) a.sources.sort((x, y) => x.timestamp.localeCompare(y.timestamp));

export { config };
export const getAccount = (id) => config.accounts.find((a) => a.id === id);
export const getPersona = (id) => config.personas.find((p) => p.id === id);
export const getAccountData = (id) => byAccount[id] || { sources: [], knowledge: [], people: [] };
export const findSource = (accountId, sourceId) => getAccountData(accountId).sources.find((s) => s.sourceId === sourceId);

export const SOURCE_TYPES = {
  email: { label: "Email", color: "var(--primary)", system: "Microsoft Outlook (Graph API)" },
  chat: { label: "Chat", color: "var(--bondi-blue)", system: "Microsoft Teams / Slack" },
  ticket: { label: "Ticket", color: "var(--warning-dark)", system: "Jira" },
  incident: { label: "Incident", color: "var(--error)", system: "PagerDuty / ServiceNow" },
  document: { label: "Document", color: "var(--purple)", system: "Confluence / SharePoint" },
  meeting: { label: "Meeting", color: "var(--primary-450)", system: "Teams meeting transcripts" },
  calendar: { label: "Calendar", color: "var(--grey-600)", system: "Outlook Calendar" },
  knowledge: { label: "Knowledge", color: "var(--success)", system: "COIH knowledge layer" },
};
