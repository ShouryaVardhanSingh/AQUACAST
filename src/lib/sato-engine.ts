import { snapshotManager, type FloodSnapshot, type StateFloodInfo } from "./flood";

export interface SatoResponse {
  text: string;
  showMap: boolean;
  mapLayer: "risk" | "impact" | "forecast";
  selectedState?: string | null;
  suggestedFollowUps: string[];
}

/**
 * Standard suggested follow-up chips
 */
const DEFAULT_CHIPS = [
  "Which state is most affected?",
  "Which state is least affected?",
  "Compare Assam and Bihar.",
  "What does the 72-hour forecast indicate?",
];

/**
 * Unambiguous aliases mapping to canonical state names in src/data/india.json
 * Short common words (like bare "up" or "wb") are deliberately excluded
 * to prevent false positives with phrases like "What's up?".
 */
const UNAMBIGUOUS_ALIASES: { pattern: RegExp; canonical: string }[] = [
  { pattern: /(?:^|\s|\b)u\.p\.(?=\s|$|[?!.,])/i, canonical: "Uttar Pradesh" },
  { pattern: /\b(u\. p\.|uttar\s+pradesh)\b/i, canonical: "Uttar Pradesh" },
  { pattern: /(?:^|\s|\b)w\.b\.(?=\s|$|[?!.,])/i, canonical: "West Bengal" },
  { pattern: /\b(w\. b\.|west\s+bengal|bengal)\b/i, canonical: "West Bengal" },
  { pattern: /(?:^|\s|\b)j\s*&\s*k(?=\s|$|[?!.,]|\b)/i, canonical: "Jammu and Kashmir" },
  { pattern: /\b(j\s+and\s+k|jammu\s+(?:and|&)\s+kashmir)\b/i, canonical: "Jammu and Kashmir" },
  { pattern: /\b(odisha)\b/i, canonical: "Orissa" },
  { pattern: /\b(uttarakhand)\b/i, canonical: "Uttaranchal" },
  { pattern: /\b(andaman\s*(?:and|&)?\s*nicobar(?:\s+islands)?)\b/i, canonical: "Andaman and Nicobar" },
  { pattern: /\b(dadra\s*(?:and|&)?\s*nagar\s+haveli)\b/i, canonical: "Dadra and Nagar Haveli" },
  { pattern: /\b(daman\s*(?:and|&)?\s*diu)\b/i, canonical: "Daman and Diu" },
];

/**
 * Detects all Indian states mentioned in user query while strictly preserving mention order.
 * Avoids substring or incidental word matches.
 */
export function detectMentionedStates(query: string, snapshot: FloodSnapshot): StateFloodInfo[] {
  const matches: { index: number; state: StateFloodInfo }[] = [];
  const stateNames = Object.keys(snapshot.states);

  // 1. Check canonical state names
  for (const name of stateNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    const m = regex.exec(query);
    if (m && m.index !== undefined) {
      matches.push({ index: m.index, state: snapshot.states[name]! });
    }
  }

  // 2. Check unambiguous aliases
  for (const { pattern, canonical } of UNAMBIGUOUS_ALIASES) {
    const m = pattern.exec(query);
    if (m && m.index !== undefined && snapshot.states[canonical]) {
      const stateObj = snapshot.states[canonical]!;
      if (!matches.some((existing) => existing.state.name === stateObj.name)) {
        matches.push({ index: m.index, state: stateObj });
      }
    }
  }

  // Sort by appearance index in the query string to preserve order
  matches.sort((a, b) => a.index - b.index);
  return matches.map((m) => m.state);
}

/**
 * Extracts a requested count N from phrases like "top 3", "rank 5", "bottom 4".
 * Defaults to defaultN if no number is found.
 */
function parseRequestedNumber(query: string, defaultN = 5): number {
  const m = query.match(/\b(?:top|bottom|rank|first|lowest|highest|least|most)?\s*(\d{1,2})\b/i);
  if (m && m[1]) {
    const num = parseInt(m[1], 10);
    if (num > 0 && num <= 35) return num;
  }

  const wordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const wm = query.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  if (wm && wm[1] && wordMap[wm[1].toLowerCase()]) {
    return wordMap[wm[1].toLowerCase()]!;
  }

  return defaultN;
}

export type ComparativeMetric = "area" | "population" | "cropland" | "risk" | "unsupported";

/**
 * Identifies which metric the user is comparing.
 */
function detectComparativeMetric(query: string): ComparativeMetric {
  const q = query.toLowerCase();

  // Unsupported metrics
  if (
    q.includes("dollar") ||
    q.includes("rupee") ||
    q.includes("financial") ||
    q.includes("damage cost") ||
    q.includes("economic loss") ||
    q.includes("economic damage") ||
    q.includes("drone") ||
    q.includes("cctv") ||
    q.includes("livestock") ||
    q.includes("fatalit") ||
    q.includes("death") ||
    q.includes("casualt")
  ) {
    return "unsupported";
  }

  if (q.includes("population") || q.includes("people") || q.includes("residents") || q.includes("human")) {
    return "population";
  }
  if (q.includes("cropland") || q.includes("crop") || q.includes("farmland") || q.includes("agriculture")) {
    return "cropland";
  }
  if (
    q.includes("risk") ||
    q.includes("severity") ||
    q.includes("danger") ||
    q.includes("alert") ||
    q.includes("threat")
  ) {
    return "risk";
  }

  return "area";
}

/**
 * SATO Deterministic Context-Grounded Intelligence Engine
 */
export function querySato(userQuestion: string, snapshotOverride?: FloodSnapshot): string {
  const res = analyzeSatoQuery(userQuestion, snapshotOverride);
  return res.text;
}

export function analyzeSatoQuery(userQuestion: string, snapshotOverride?: FloodSnapshot): SatoResponse {
  const snapshot = snapshotOverride ?? snapshotManager.getSnapshot();
  const rawQ = userQuestion.trim();
  const q = rawQ.toLowerCase();

  // --------------------------------------------------------------------------
  // 1. GREETINGS (Must come before state/keyword routing)
  // --------------------------------------------------------------------------
  const isGreeting =
    /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|greetings|what'?s\s+up|yo)\b/i.test(q) &&
    !q.includes("flood") &&
    !q.includes("assam") &&
    !q.includes("bihar") &&
    !q.includes("trend") &&
    !q.includes("forecast");

  if (isGreeting) {
    return {
      text: `Hello! I am **SATO**, your AQUACAST flood intelligence companion.\n\nI am connected to the **${snapshot.title}** snapshot (${snapshot.observationDate}). How can I assist you with regional flood extent, river discharge forecasts, or state impact comparisons today?`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: DEFAULT_CHIPS,
    };
  }

  // --------------------------------------------------------------------------
  // 2. DATA TELEMETRY OUTAGE / ERROR STATE
  // --------------------------------------------------------------------------
  if (snapshot.status === "unavailable" || snapshot.status === "error") {
    return {
      text: `⚠️ **Data Telemetry Interrupted**\n\nThe AQUACAST ingestion gateway reports that observational feeds are currently offline.\n\n• **Status:** ${snapshot.errorMessage ?? "Telemetry unavailable"}\n• **Honesty Notice:** In accordance with AQUACAST safety protocols, unverified or simulated values are not presented during a sensor outage to prevent false negatives.\n• **Action:** Please check back after the next scheduled satellite pass or ground station reconnection.`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: [
        "What is the system status?",
        "Where is data sourced from?",
        "Explain severity levels.",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 3. OUT-OF-SCOPE / UNSUPPORTED REQUESTS
  // --------------------------------------------------------------------------
  if (
    q.includes("drone") ||
    q.includes("street") ||
    q.includes("address") ||
    q.includes("house") ||
    q.includes("camera") ||
    q.includes("my location") ||
    q.includes("usa") ||
    q.includes("china") ||
    q.includes("europe") ||
    q.includes("pakistan") ||
    q.includes("florida")
  ) {
    return {
      text: `ℹ️ **Information Outside Current Snapshot Scope**\n\nYou asked for information that is **not available** in the active AQUACAST India flood snapshot.\n\n• **Geographic Scope:** This snapshot currently covers **India** at the state and river basin level. International territories are unmonitored in this deployment.\n• **Spatial Resolution:** AQUACAST aggregates satellite synthetic aperture radar (SAR) and CWC gauge metrics at regional basin scale. We do not provide street-level CCTV, drone video feeds, or individual building damage assessments.\n• **Economic Loss:** Macro financial damage estimates (in INR/USD) require post-disaster insurance assessments and are intentionally not extrapolated here to prevent ungrounded claims.\n\n*You can ask about state inundated areas (km²), population exposure models, 7-day historical trends, or 72-hour hydrological forecasts for Indian states.*`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: DEFAULT_CHIPS,
    };
  }

  // Check metric: if unsupported metric is requested, report cleanly
  const metric = detectComparativeMetric(q);
  if (metric === "unsupported") {
    return {
      text: `⚠️ **Metric Unavailable in Active Snapshot**\n\nThe requested metric (e.g., financial damage / casualty valuation / drone coverage) is not monitored or estimated in the current AQUACAST India snapshot.\n\n• **Supported Comparative Metrics:** **Inundated Area (km²)**, **Estimated Population Exposure**, **Submerged Cropland**, and **Flood Severity Tier**.\n• Macro financial damage and local casualty figures are intentionally omitted to prevent unverified estimations.`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: DEFAULT_CHIPS,
    };
  }

  // --------------------------------------------------------------------------
  // 4. COMPARISONS (Requires two explicitly identified states)
  // --------------------------------------------------------------------------
  const isCompareIntent =
    /\b(compare|versus|vs|difference\s+between)\b/i.test(q) ||
    /\bhow\s+does\s+.+\s+compare\s+to\b/i.test(q);

  if (isCompareIntent) {
    const states = detectMentionedStates(rawQ, snapshot);

    if (states.length < 2) {
      return {
        text: `To perform a regional comparison, please specify **two states** to compare.\n\nFor example:\n• *"Compare Bihar and Assam."*\n• *"Assam vs Uttar Pradesh."*\n• *"Compare population exposure between Bihar and Assam."*`,
        showMap: false,
        mapLayer: "risk",
        suggestedFollowUps: [
          "Compare Assam and Bihar.",
          "Compare Uttar Pradesh and Bihar.",
          "Which state is most affected?",
        ],
      };
    }

    const s1 = states[0]!;
    const s2 = states[1]!;

    let text = `### Regional Comparison: ${s1.name} vs. ${s2.name}\n\n`;

    if (metric === "population") {
      const p1 = s1.populationExposed ?? 0;
      const p2 = s2.populationExposed ?? 0;
      const diff = Math.abs(p1 - p2);
      const leadState = p1 >= p2 ? s1 : s2;
      const trailState = p1 >= p2 ? s2 : s1;

      text += `• **${s1.name}:** ~${(p1 / 1000000).toFixed(2)}M exposed population *(derived census model)*\n`;
      text += `• **${s2.name}:** ~${(p2 / 1000000).toFixed(2)}M exposed population *(derived census model)*\n\n`;
      text += `**Comparison:** **${leadState.name}** has ~**${(diff / 1000000).toFixed(2)}M** more exposed population than **${trailState.name}**.\n`;
    } else if (metric === "cropland") {
      const c1 = s1.croplandAreaKm2 ?? 0;
      const c2 = s2.croplandAreaKm2 ?? 0;
      const diff = Math.abs(c1 - c2);
      const leadState = c1 >= c2 ? s1 : s2;

      text += `• **${s1.name}:** ~${c1.toLocaleString("en-US")} km² cropland inundated\n`;
      text += `• **${s2.name}:** ~${c2.toLocaleString("en-US")} km² cropland inundated\n\n`;
      text += `**Comparison:** **${leadState.name}** has **${diff.toLocaleString("en-US")} km²** more submerged agricultural land.\n`;
    } else {
      const diffArea = Math.abs(s1.floodedAreaKm2 - s2.floodedAreaKm2);
      const higher = s1.floodedAreaKm2 >= s2.floodedAreaKm2 ? s1 : s2;
      const lower = s1.floodedAreaKm2 >= s2.floodedAreaKm2 ? s2 : s1;
      const pctLead = lower.floodedAreaKm2 > 0 ? Math.round((diffArea / lower.floodedAreaKm2) * 100) : 100;

      text += `• **${s1.name}:** **${s1.floodedAreaKm2.toLocaleString("en-US")} km²** (${s1.severity.toUpperCase()} Severity) · Primary Basin: ${s1.primaryRiverBasins.join(", ")}\n`;
      text += `• **${s2.name}:** **${s2.floodedAreaKm2.toLocaleString("en-US")} km²** (${s2.severity.toUpperCase()} Severity) · Primary Basin: ${s2.primaryRiverBasins.join(", ")}\n\n`;
      text += `**Mathematical Comparison:**\n`;
      text += `• **Inundated Surface:** **${higher.name}** leads by **${diffArea.toLocaleString("en-US")} km²** (~**${pctLead}%** more flooded area than ${lower.name}).\n`;

      if (s1.populationExposed && s2.populationExposed) {
        text += `• **Population Exposure (derived):** ~**${(s1.populationExposed / 1000000).toFixed(1)}M** in ${s1.name} vs. ~**${(s2.populationExposed / 1000000).toFixed(1)}M** in ${s2.name}.\n`;
      }
      text += `• **72h Forecast Outlook:** ${s1.name} is **${s1.forecastSeverity.toUpperCase()}**; ${s2.name} is **${s2.forecastSeverity.toUpperCase()}**.\n`;
    }

    text += `\n*Data sourced from unified ${snapshot.title} (${snapshot.observationDate}).*`;

    return {
      text,
      showMap: true,
      mapLayer: "impact",
      selectedState: s1.floodedAreaKm2 >= s2.floodedAreaKm2 ? s1.name : s2.name,
      suggestedFollowUps: [
        `What is the forecast for ${s1.name}?`,
        `What is the trend in ${s2.name}?`,
        "Which state is most affected?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 5. RANKING & SINGULAR EXTREMES (Dynamic Mathematical Sorting)
  // --------------------------------------------------------------------------
  const isSingularMin =
    /\b(least\s+affected|lowest\s+(?:impact|risk|flood\s+risk|inundat|populat)|minimum\s+(?:impact|risk|area)|least\s+flooded|least\s+risk|least\s+populat)\b/i.test(q) &&
    !/\b(rank|top|bottom|\d+)\b/i.test(q);

  const isSingularMax =
    /\b(most\s+affected|highest\s+(?:impact|risk|flood\s+risk|inundat|populat)|maximum\s+(?:impact|risk|area)|most\s+flooded|highest\s+risk|most\s+populat|worst\s+affected)\b/i.test(q) &&
    !/\b(rank|top|bottom|\d+)\b/i.test(q);

  const isRankingMin =
    /\b(bottom|lowest|least)\s+\d+\b/i.test(q) ||
    /\brank\s+(?:the\s+)?\d+\s+least\b/i.test(q) ||
    /\b\d+\s+least\s+affected\b/i.test(q);

  const isRankingMax =
    /\b(top|highest|most)\s+\d+\b/i.test(q) ||
    /\brank\s+(?:the\s+)?\d+\s+most\b/i.test(q) ||
    /\b\d+\s+most\s+affected\b/i.test(q) ||
    /\brank\s+the\s+most\s+affected\b/i.test(q);

  const isRiskFilter = /\bwhich\s+states\s+(?:are\s+at\s+)?(?:high|severe|moderate|low)\s+risk\b/i.test(q);

  // 5A. SINGULAR MINIMUM ("Which state is least affected?", "Which state has lowest risk?")
  if (isSingularMin) {
    const allStates = Object.values(snapshot.states);
    const affectedStates = allStates
      .filter((s) => s.floodedAreaKm2 > 0)
      .sort((a, b) => a.floodedAreaKm2 - b.floodedAreaKm2);

    if (affectedStates.length === 0) {
      return {
        text: `### Least Affected State\n\n- **State:** All States\n- **Metric:** Inundated Flood Extent (km²)\n- **Value:** 0 km²\n- **Why:** No active flood inundation anomalies are recorded across Indian states in this snapshot.`,
        showMap: false,
        mapLayer: "risk",
        suggestedFollowUps: DEFAULT_CHIPS,
      };
    }

    if (metric === "population") {
      const sortedByPop = [...affectedStates]
        .filter((s) => s.populationExposed !== null && s.populationExposed > 0)
        .sort((a, b) => (a.populationExposed ?? 0) - (b.populationExposed ?? 0));

      const leastState = sortedByPop[0] ?? affectedStates[0]!;
      const popVal = leastState.populationExposed
        ? `~${leastState.populationExposed.toLocaleString("en-US")} people (~${(leastState.populationExposed / 1000000).toFixed(3)}M)`
        : "N/A";

      return {
        text: `### Least Affected State by Population\n\n- **State:** ${leastState.name}\n- **Metric:** Estimated Exposed Population *(derived census model)*\n- **Value:** ${popVal}\n- **Why:** ${leastState.name} has the lowest recorded human exposure among flood-affected states in the active snapshot (unaffected states report 0 exposed population).`,
        showMap: true,
        mapLayer: "impact",
        selectedState: leastState.name,
        suggestedFollowUps: [
          `What is the situation in ${leastState.name}?`,
          "Which state has the most affected population?",
          "Which state is most affected by area?",
        ],
      };
    }

    if (metric === "risk") {
      const leastAffected = affectedStates[0]!;
      return {
        text: `### Lowest Flood Risk State\n\n- **State:** Goa (and 22 other normal-baseline states)\n- **Metric:** Flood Severity Classification\n- **Value:** Low / Normal Impact (0 km² anomaly)\n- **Why:** 23 Indian states have water levels within normal seasonal limits with no flood alerts. Among states with active flood monitoring, **${leastAffected.name}** holds the lowest impact profile (${leastAffected.floodedAreaKm2.toLocaleString("en-US")} km² · ${leastAffected.alertLevel} Alert).`,
        showMap: false,
        mapLayer: "risk",
        selectedState: leastAffected.name,
        suggestedFollowUps: [
          "Which state has the highest flood risk?",
          "Which state is most affected?",
          "What does the forecast indicate?",
        ],
      };
    }

    // Default: Inundated Area
    const leastState = affectedStates[0]!;
    return {
      text: `### Least Affected State\n\n- **State:** ${leastState.name}\n- **Metric:** Inundated Flood Extent (km²) among affected states\n- **Value:** ${leastState.floodedAreaKm2.toLocaleString("en-US")} km²\n- **Why:** ${leastState.name} has the lowest recorded inundated surface area among all ${affectedStates.length} flood-affected states in this snapshot (${snapshot.title}). Unaffected states in India currently report 0 km² normal baseline flow.`,
      showMap: true,
      mapLayer: "impact",
      selectedState: leastState.name,
      suggestedFollowUps: [
        `Tell me more about ${leastState.name}`,
        "Which state is most affected?",
        "Rank the 5 least affected states.",
      ],
    };
  }

  // 5B. SINGULAR MAXIMUM ("Which state is most affected?", "Which state has highest risk?")
  if (isSingularMax) {
    const allStates = Object.values(snapshot.states);
    const affectedStates = allStates
      .filter((s) => s.floodedAreaKm2 > 0)
      .sort((a, b) => b.floodedAreaKm2 - a.floodedAreaKm2);

    if (affectedStates.length === 0) {
      return {
        text: `### Most Affected State\n\n- **State:** None\n- **Metric:** Inundated Flood Extent (km²)\n- **Value:** 0 km²\n- **Why:** No states are experiencing severe or moderate inundation in this snapshot.`,
        showMap: false,
        mapLayer: "risk",
        suggestedFollowUps: DEFAULT_CHIPS,
      };
    }

    if (metric === "population") {
      const sortedByPop = [...affectedStates].sort(
        (a, b) => (b.populationExposed ?? 0) - (a.populationExposed ?? 0)
      );
      const topPopState = sortedByPop[0]!;
      const popVal = topPopState.populationExposed
        ? `~${topPopState.populationExposed.toLocaleString("en-US")} people (~${(topPopState.populationExposed / 1000000).toFixed(2)}M)`
        : "N/A";

      return {
        text: `### Most Affected State by Population\n\n- **State:** ${topPopState.name}\n- **Metric:** Estimated Exposed Population *(derived census model)*\n- **Value:** ${popVal}\n- **Why:** ${topPopState.name} has the highest floodplain human exposure in India due to high population density across active river catchments (${topPopState.primaryRiverBasins.join(", ")}).`,
        showMap: true,
        mapLayer: "impact",
        selectedState: topPopState.name,
        suggestedFollowUps: [
          `What is the situation in ${topPopState.name}?`,
          "Which state is most affected by area?",
          "What does the 72-hour forecast indicate?",
        ],
      };
    }

    if (metric === "risk") {
      const highestRiskState = affectedStates[0]!;
      return {
        text: `### Highest Flood Risk State\n\n- **State:** ${highestRiskState.name}\n- **Metric:** Flood Severity Classification & River Status\n- **Value:** ${highestRiskState.severity.toUpperCase()} (${highestRiskState.alertLevel} Alert · ${highestRiskState.floodedAreaKm2.toLocaleString("en-US")} km²)\n- **Why:** Primary river basins (${highestRiskState.primaryRiverBasins.join(", ")}) are cresting above CWC danger levels with sustained upstream discharge and a ${highestRiskState.trend7d} trend.`,
        showMap: true,
        mapLayer: "risk",
        selectedState: highestRiskState.name,
        suggestedFollowUps: [
          `Forecast for ${highestRiskState.name}?`,
          `Trend in ${highestRiskState.name}?`,
          "Which states are at high risk?",
        ],
      };
    }

    // Default: Inundated Area
    const topState = affectedStates[0]!;
    const totalFlooded = snapshot.summary.totalSeverelyFloodedKm2 + snapshot.summary.totalModeratelyFloodedKm2;
    const sharePct = totalFlooded > 0 ? Math.round((topState.floodedAreaKm2 / totalFlooded) * 100) : 0;

    return {
      text: `### Most Affected State\n\n- **State:** ${topState.name}\n- **Metric:** Inundated Flood Extent (km²)\n- **Value:** ${topState.floodedAreaKm2.toLocaleString("en-US")} km²\n- **Why:** ${topState.name} has the largest inundated area in India, accounting for ~${sharePct}% of all mapped floodwater in the active snapshot (${snapshot.title}).`,
      showMap: true,
      mapLayer: "impact",
      selectedState: topState.name,
      suggestedFollowUps: [
        `Forecast for ${topState.name}?`,
        `Compare ${topState.name} and Bihar`,
        "Rank the 5 most affected states.",
      ],
    };
  }

  // 5C. RANKING: BOTTOM N / LEAST AFFECTED
  if (isRankingMin) {
    const n = parseRequestedNumber(q, 5);
    const affectedStates = Object.values(snapshot.states)
      .filter((s) => s.floodedAreaKm2 > 0)
      .sort((a, b) => a.floodedAreaKm2 - b.floodedAreaKm2);

    const count = Math.min(n, affectedStates.length);
    const ranked = affectedStates.slice(0, count);

    let text = `### ${count} Least Affected States *(Ascending Flood Extent)*\n\n`;
    text += `*Metric: Inundated Area (km²) among states with active flood impact in ${snapshot.title}:*\n\n`;

    ranked.forEach((s, idx) => {
      text += `${idx + 1}. **${s.name}**: **${s.floodedAreaKm2.toLocaleString("en-US")} km²** (${s.severity.toUpperCase()} Severity · ${s.alertLevel} Alert)\n`;
    });

    text += `\n*(Note: 23 non-impacted Indian states report 0 km² baseline with no active flood anomaly).*`;

    return {
      text,
      showMap: true,
      mapLayer: "impact",
      selectedState: ranked[0]?.name,
      suggestedFollowUps: [
        "Which state is least affected?",
        "Rank the 5 most affected states.",
        "What does the forecast indicate?",
      ],
    };
  }

  // 5D. RANKING: TOP N / MOST AFFECTED
  if (isRankingMax) {
    const n = parseRequestedNumber(q, 5);
    const affectedStates = Object.values(snapshot.states)
      .filter((s) => s.floodedAreaKm2 > 0)
      .sort((a, b) => b.floodedAreaKm2 - a.floodedAreaKm2);

    const count = Math.min(n, affectedStates.length);
    const ranked = affectedStates.slice(0, count);

    let text = `### Top ${count} Most Affected States *(Descending Flood Extent)*\n\n`;
    text += `*Metric: Inundated Area (km²) in ${snapshot.title} (${snapshot.observationDate}):*\n\n`;

    ranked.forEach((s, idx) => {
      const popStr = s.populationExposed ? ` · ~${(s.populationExposed / 1000000).toFixed(1)}M exposed` : "";
      text += `${idx + 1}. **${s.name}**: **${s.floodedAreaKm2.toLocaleString("en-US")} km²** (${s.severity.toUpperCase()}${popStr})\n`;
    });

    return {
      text,
      showMap: true,
      mapLayer: "impact",
      selectedState: ranked[0]?.name,
      suggestedFollowUps: [
        "Rank the 5 least affected states.",
        "Which states are at high risk?",
        "What does the forecast indicate?",
      ],
    };
  }

  // 5E. RISK FILTER ("Which states are at high risk?")
  if (isRiskFilter) {
    const isHigh = /\b(high|severe)\b/i.test(q);
    const targetSeverity = isHigh ? "severe" : "moderate";
    const matching = Object.values(snapshot.states).filter((s) => s.severity === targetSeverity);

    if (matching.length === 0) {
      return {
        text: `### ${isHigh ? "High / Severe" : "Moderate"} Risk States\n\nIn the active snapshot (**${snapshot.title}**), **no states** are currently classified under **${isHigh ? "Severe / High" : "Moderate"}** risk. Inundations have receded below emergency thresholds.`,
        showMap: false,
        mapLayer: "risk",
        suggestedFollowUps: DEFAULT_CHIPS,
      };
    }

    let text = `### States at ${isHigh ? "High / Severe" : "Moderate"} Risk\n\n`;
    text += `The following **${matching.length} states** are currently classified under **${isHigh ? "Severe (Emergency Alert)" : "Moderate (Warning Alert)"}**:\n\n`;

    matching
      .sort((a, b) => b.floodedAreaKm2 - a.floodedAreaKm2)
      .forEach((s, idx) => {
        text += `${idx + 1}. **${s.name}**: **${s.floodedAreaKm2.toLocaleString("en-US")} km²** inundated · River Basin: ${s.primaryRiverBasins.join(", ")}\n`;
      });

    return {
      text,
      showMap: true,
      mapLayer: "risk",
      selectedState: matching[0]?.name,
      suggestedFollowUps: [
        "What does the 72-hour forecast indicate?",
        "Which state is most affected?",
        "What is the trend in Assam?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 6. TARGETED STATE QUERIES WITH SUB-INTENTS
  // --------------------------------------------------------------------------
  const mentionedStates = detectMentionedStates(rawQ, snapshot);
  if (mentionedStates.length > 0) {
    const s = mentionedStates[0]!;
    const isFlooded = s.floodedAreaKm2 > 0;

    // Sub-intent 6A: Trend in specific state ("What is the trend in Bihar?")
    if (/\b(trend|history|past\s+7\s+days|getting\s+worse|rising|reced|trajectory)\b/i.test(q)) {
      let text = `### ${s.name} — 7-Day Inundation Trend\n\n`;
      if (isFlooded) {
        text += `• **Current Trajectory:** **${s.trend7d.toUpperCase()}**\n`;
        text += `• **Inundated Extent:** **${s.floodedAreaKm2.toLocaleString("en-US")} km²** (${s.severity.toUpperCase()} Severity)\n`;
        text += `• **Alert Status:** **${s.alertLevel}** Alert\n`;
        text += `• **River Catchments:** ${s.primaryRiverBasins.join(", ")}\n`;
        if (s.notes) {
          text += `\n**Field Note:** ${s.notes}\n`;
        }
      } else {
        text += `• **Trend:** **STABLE / NORMAL**\n`;
        text += `• **Status:** No floodwaters detected. Water levels remain within seasonal normal embankment limits.\n`;
      }
      return {
        text,
        showMap: false,
        mapLayer: "risk",
        selectedState: s.name,
        suggestedFollowUps: [
          `Forecast for ${s.name}?`,
          `Population exposure in ${s.name}?`,
          "Which state is most affected?",
        ],
      };
    }

    // Sub-intent 6B: Forecast for specific state ("Forecast for Assam?")
    if (/\b(forecast|predict|future|next\s+72|outlook|crest)\b/i.test(q)) {
      const fItem = snapshot.forecast.find((f) => f.region.toLowerCase().includes(s.name.toLowerCase()));
      let text = `### ${s.name} — 72-Hour Forecast Outlook\n\n`;
      text += `• **Forecast Risk Level:** **${s.forecastSeverity.toUpperCase()}**\n`;
      if (fItem) {
        text += `• **Expected Peak Timing:** *${fItem.expectedPeak}*\n`;
        text += `• **Model Confidence:** *${fItem.confidence}*\n`;
        text += `• **Hydrological Projection:** ${fItem.details}\n`;
      } else {
        text += `• **Hydrological Projection:** Water flows projected to remain steady with no emergency cresting over the next 72 hours.\n`;
      }
      return {
        text,
        showMap: true,
        mapLayer: "forecast",
        selectedState: s.name,
        suggestedFollowUps: [
          `Trend in ${s.name}?`,
          "Which state has the highest flood risk?",
          "What does the India-wide forecast indicate?",
        ],
      };
    }

    // Sub-intent 6C: Population / Exposure for specific state ("Population exposure in Bihar?")
    if (/\b(population|people|residents|cropland|infrastructure|roads|schools)\b/i.test(q)) {
      let text = `### ${s.name} — Exposure Metrics\n\n`;
      if (isFlooded) {
        const pop = s.populationExposed ? `~${(s.populationExposed / 1000000).toFixed(2)}M people` : "N/A";
        const crop = s.croplandAreaKm2 ? `~${s.croplandAreaKm2.toLocaleString("en-US")} km²` : "N/A";
        text += `• **Estimated Population Exposed:** **${pop}** residing in active inundation zones *(derived census model)*\n`;
        text += `• **Submerged Cropland:** **${crop}**\n`;
        if (s.criticalInfrastructure) {
          text += `• **Road Infrastructure Impact:** ~${s.criticalInfrastructure.roadsKm ?? 0} km\n`;
          text += `• **Public Health Centers in Flood Zone:** ${s.criticalInfrastructure.healthcareFacilities ?? 0}\n`;
        }
      } else {
        text += `• **Exposed Population:** **0** (No active inundation detected in ${s.name})\n`;
        text += `• **Cropland Impact:** **0 km²**\n`;
      }
      return {
        text,
        showMap: true,
        mapLayer: "impact",
        selectedState: s.name,
        suggestedFollowUps: [
          `What is the trend in ${s.name}?`,
          `Forecast for ${s.name}?`,
          "Which state has the most affected population?",
        ],
      };
    }

    // Sub-intent 6D: General State Overview ("How is Assam?", "Tell me about Kerala")
    let response = `### ${s.name} — Flood Status\n\n`;
    if (isFlooded) {
      response += `• **Impact Classification:** **${s.severity.toUpperCase()}** (${s.alertLevel} Alert)\n`;
      response += `• **Inundated Extent:** **${s.floodedAreaKm2.toLocaleString("en-US")} km²**\n`;
      if (s.populationExposed) {
        response += `• **Estimated Population Exposed:** ~**${(s.populationExposed / 1000000).toFixed(2)}M people** *(derived census model)*\n`;
      }
      if (s.croplandAreaKm2) {
        response += `• **Inundated Cropland:** ~**${s.croplandAreaKm2.toLocaleString("en-US")} km²**\n`;
      }
      response += `• **Primary River Basins:** ${s.primaryRiverBasins.join(", ")}\n`;
      response += `• **7-Day Trend:** **${s.trend7d.toUpperCase()}**\n`;
      response += `• **72-Hour Forecast Outlook:** Risk level is **${s.forecastSeverity.toUpperCase()}**\n`;
      if (s.notes) {
        response += `\n**Field Observation Note:** ${s.notes}\n`;
      }
      response += `\n*Data provenance: ${snapshot.sourceAttribution.name} (${s.lastUpdated}).*`;
    } else {
      response += `• **Impact Classification:** **LOW / NORMAL**\n`;
      response += `• **Inundated Extent:** **0 km²** significant flood anomaly detected.\n`;
      response += `• **River Flow:** Water levels remain within seasonal non-flood thresholds.\n`;
      response += `• **Forecast:** Normal baseline flow expected over the next 72 hours.\n`;
      response += `\n*Note: AQUACAST confirms no emergency alert for ${s.name} in this snapshot.*`;
    }

    return {
      text: response,
      showMap: true,
      mapLayer: s.severity === "severe" ? "impact" : "risk",
      selectedState: s.name,
      suggestedFollowUps: [
        `What is the trend in ${s.name}?`,
        `Forecast for ${s.name}?`,
        "Which state is most affected?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 7. GENERAL 7-DAY TREND (India-wide)
  // --------------------------------------------------------------------------
  if (/\b(trend|history|past\s+7\s+days|getting\s+worse|rising|reced|trajectory)\b/i.test(q)) {
    const trend = snapshot.trend;
    const first = trend[0];
    const last = trend[trend.length - 1];
    const delta = snapshot.summary.change7dPct;
    const isRising = delta > 0;

    let text = `### 7-Day Flood Evolution Trend\n\n`;
    if (first && last) {
      text += `• Inundated area changed from **${first.floodedAreaThousandKm2}k km²** (${first.day}) to **${last.floodedAreaThousandKm2}k km²** (${last.day}).\n`;
      text += `• **7-Day Trajectory:** **${isRising ? "+" : ""}${delta}%** (${isRising ? "Expanding / Rising" : "Receding / Draining"}).\n`;
      text += `• **River Discharge Index:** Measured at **${last.riverDischargeIndex.toFixed(2)}x** normal baseline discharge.\n\n`;
    }

    text += `**Day-by-Day Inundation Summary:**\n`;
    trend.forEach((t) => {
      text += `• **${t.day}**: ${t.floodedAreaKm2.toLocaleString("en-US")} km² (${t.floodedAreaThousandKm2}k km²)\n`;
    });

    return {
      text,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: [
        "What does the forecast indicate?",
        "Which state is most affected?",
        "Where is this data sourced from?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 8. GENERAL 72-HOUR FORECAST (India-wide)
  // --------------------------------------------------------------------------
  if (/\b(forecast|predict|future|next\s+72|outlook|crest)\b/i.test(q)) {
    let text = `### 72-Hour Hydrological Forecast Outlook\n\n`;
    text += `Based on GloFAS river discharge simulations and CWC basin routing models:\n\n`;

    snapshot.forecast.forEach((f) => {
      text += `• **${f.region}** [Risk: **${f.level.toUpperCase()}** · Confidence: **${f.confidence}**]\n`;
      text += `  Expected Peak: *${f.expectedPeak}*\n`;
      text += `  ${f.details}\n\n`;
    });

    text += `⚠️ **Honesty & Methodology Note:**\n`;
    text += `These predictions represent calibrated hydrological runoff models (ECMWF/GloFAS). They indicate advisory flood risk bands, not pinpoint water-meter depth measurements.`;

    return {
      text,
      showMap: true,
      mapLayer: "forecast",
      suggestedFollowUps: [
        "Which states are at high risk?",
        "Which state is most affected?",
        "How is population exposure calculated?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 9. METRICS EXPLANATION / SEVERITY TIERS
  // --------------------------------------------------------------------------
  if (/\b(severity|levels?|colors?|what\s+does\s+red\s+mean|classify|methodology)\b/i.test(q)) {
    return {
      text: `### AQUACAST Flood Severity Classification System\n\nTERRA categorizes regional risk into three standardized tiers:\n\n🔴 **Severe Impact (Red / Emergency):**\n• Defined as major overbank river discharge exceeding Central Water Commission (CWC) Danger Level.\n• Inundated area > 2,000 km² or widespread submergence of inhabited floodplains.\n• Requires immediate evacuation protocols and emergency rescue deployment.\n\n🟡 **Moderate Impact (Yellow / Warning):**\n• River water level between Warning Level and Danger Level.\n• Significant waterlogging of agricultural cropland, low-lying rural roads, or drainage congestion.\n• Communities placed on active alert; transport disruptions likely.\n\n🟢 **Low / No Significant Impact (Green / Normal):**\n• Water levels remain within normal seasonal embankment capacities.\n• Standard localized monsoon drainage with no emergency disruption.\n\n*All levels correspond directly to the unified snapshot data model.*`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: [
        "Which state has the highest flood risk?",
        "Which state has the lowest flood risk?",
        "Which state is most affected?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 10. SITUATION SUMMARY / OVERVIEW BRIEF
  // --------------------------------------------------------------------------
  if (/\b(summary|overview|brief|situation|recap|status)\b/i.test(q)) {
    const top2 = snapshot.topAffectedStates.slice(0, 2).map((s) => s.name).join(" and ");
    let text = `### AQUACAST Situation Brief: ${snapshot.title}\n\n`;
    text += `• **Observation Date:** ${snapshot.observationDate} (${snapshot.geographicCoverage})\n`;
    text += `• **Total Severely Inundated:** **${snapshot.summary.totalSeverelyFloodedKm2.toLocaleString("en-US")} km²**\n`;
    text += `• **Total Moderately Inundated:** **${snapshot.summary.totalModeratelyFloodedKm2.toLocaleString("en-US")} km²**\n`;
    text += `• **Epicenter of Inundation:** ${top2 || "Central river basins"}\n`;
    text += `• **7-Day Dynamic:** Inundation has changed by **${snapshot.summary.change7dPct > 0 ? "+" : ""}${snapshot.summary.change7dPct}%**\n`;
    text += `• **Estimated Human Exposure:** ~**${(snapshot.summary.totalPopulationExposed / 1000000).toFixed(1)}M** in flood plains\n\n`;
    text += `**Key Intelligence Insights:**\n`;
    snapshot.keyInsights.forEach((ki) => {
      text += `• ${ki}\n`;
    });

    return {
      text,
      showMap: true,
      mapLayer: "impact",
      suggestedFollowUps: [
        "Which state is most affected?",
        "What does the 72-hour forecast indicate?",
        "Compare Assam and Bihar.",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 11. DATA PROVENANCE & SOURCES
  // --------------------------------------------------------------------------
  if (/\b(sources?|provenance|where\s+is\s+data\s+from|real\s+satellite|cwc|glofas)\b/i.test(q)) {
    const src = snapshot.sourceAttribution;
    return {
      text: `### AQUACAST Data Provenance & Source Transparency\n\n**Primary Data Source:**\n• **Agency:** ${src.provider}\n• **Benchmark Dataset:** ${src.name}\n• **Licensing:** ${src.license}\n\n**Methodology & Data Integrity:**\n${src.methodology}\n\n⚠️ **Honesty Disclosure:**\n${src.disclaimer}\n\n**Technical Limitations:**\n${snapshot.dataLimitations.map((l) => `• ${l}`).join("\n")}`,
      showMap: false,
      mapLayer: "risk",
      suggestedFollowUps: DEFAULT_CHIPS,
    };
  }

  // --------------------------------------------------------------------------
  // 12. CONVERSATIONAL FALLBACK (Helpful, Concise, No Data Dumping)
  // --------------------------------------------------------------------------
  return {
    text: `I am **SATO**, your AQUACAST flood intelligence assistant. I analyze the active **${snapshot.title}** snapshot.\n\nYou can ask me specific questions such as:\n• **Singular Comparisons:** *"Which state is least affected?"*, *"Which state is most affected?"*\n• **Regional Rankings:** *"Rank the 5 most affected states."*, *"Rank the 3 least affected states."*\n• **State Comparisons:** *"Compare Bihar and Assam."*\n• **Targeted Inquiries:** *"What is the trend in Bihar?"*, *"Forecast for Assam?"*, *"Population exposure in Bihar?"*\n\nTry selecting one of the suggested prompts below:`,
    showMap: false,
    mapLayer: "risk",
    suggestedFollowUps: DEFAULT_CHIPS,
  };
}
