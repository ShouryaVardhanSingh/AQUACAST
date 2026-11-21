/** All figures are illustrative demo values — not live satellite data. */
export type Severity = "severe" | "moderate" | "low";

export const STATE_DATA: Record<string, { severity: Severity; area: number; forecast: Severity }> = {
  Assam: { severity: "severe", area: 3240, forecast: "severe" },
  Meghalaya: { severity: "severe", area: 860, forecast: "severe" },
  Bihar: { severity: "severe", area: 2870, forecast: "severe" },
  "Uttar Pradesh": { severity: "moderate", area: 1920, forecast: "severe" },
  "West Bengal": { severity: "moderate", area: 1340, forecast: "moderate" },
  Orissa: { severity: "moderate", area: 980, forecast: "moderate" },
  Maharashtra: { severity: "moderate", area: 820, forecast: "low" },
  Gujarat: { severity: "moderate", area: 410, forecast: "low" },
  "Arunachal Pradesh": { severity: "moderate", area: 520, forecast: "severe" },
  Kerala: { severity: "moderate", area: 360, forecast: "moderate" },
  Uttaranchal: { severity: "moderate", area: 290, forecast: "moderate" },
  Jharkhand: { severity: "moderate", area: 240, forecast: "low" },
};

export const getState = (name: string) =>
  STATE_DATA[name] ?? { severity: "low" as Severity, area: 0, forecast: "low" as Severity };

export const AFFECTED = Object.entries(STATE_DATA)
  .map(([name, d]) => ({ name, ...d }))
  .sort((a, b) => b.area - a.area);

export const TREND = [
  { day: "Nov 15", area: 6.1 },
  { day: "Nov 16", area: 6.8 },
  { day: "Nov 17", area: 7.4 },
  { day: "Nov 18", area: 8.9 },
  { day: "Nov 19", area: 9.6 },
  { day: "Nov 20", area: 11.2 },
  { day: "Nov 21", area: 12.4 },
];

export const FORECAST = [
  { region: "Assam & Meghalaya", level: "Very high" as const, sev: "severe" as Severity },
  { region: "Bihar", level: "High" as const, sev: "severe" as Severity },
  { region: "Uttar Pradesh", level: "Moderate" as const, sev: "moderate" as Severity },
];

export const SEV_COLOR: Record<Severity, string> = {
  severe: "var(--severe)",
  moderate: "var(--moderate)",
  low: "var(--low)",
};
export const SEV_LABEL: Record<Severity, string> = {
  severe: "Severe impact",
  moderate: "Moderate impact",
  low: "Low / no significant impact",
};

/** Simulated SATO replies — no real AI is connected. */
export function demoReply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("compare"))
    return "In this demo dataset, Assam leads with ~3,240 km² of illustrative flooded area, followed by Bihar (~2,870 km²) and Uttar Pradesh (~1,920 km²). Assam's share is roughly 13% higher than Bihar's.";
  if (s.includes("severity") || s.includes("level") || s.includes("explain"))
    return "TERRA uses three levels:\n• Red — severe flood impact\n• Yellow — moderate impact\n• Green — low or no significant impact detected\nLevels in this prototype are illustrative.";
  if (s.includes("forecast") || s.includes("predict"))
    return "The simulated 72-hour forecast flags Assam & Meghalaya as very high risk, Bihar as high and Uttar Pradesh as moderate. These are demo values, not real predictions.";
  if (s.includes("affected") || s.includes("most"))
    return "Based on the illustrative demo data, the most affected regions are:\n1. Assam & Meghalaya\n2. Bihar\n3. Uttar Pradesh\nThese show severe flooding with significant potential population exposure.";
  return "I'm a demo version of SATO with pre-written answers. Try asking about the most affected regions, the forecast, or what the severity levels mean.";
}
