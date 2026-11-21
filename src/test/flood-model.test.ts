import { describe, expect, it } from "vitest";
import {
  MONSOON_PEAK_SNAPSHOT,
  POST_MONSOON_RECESSION_SNAPSHOT,
  UNAVAILABLE_SNAPSHOT,
  snapshotManager,
} from "@/lib/flood";
import { analyzeSatoQuery, detectMentionedStates } from "@/lib/sato-engine";
import indiaStates from "@/data/india.json";

describe("AQUACAST Flood Snapshot Data Integrity", () => {
  it("has valid geometries in india.json for all affected states in benchmark snapshot", () => {
    const geoStateNames = new Set(indiaStates.features.map((f: any) => f.properties.name));

    for (const state of MONSOON_PEAK_SNAPSHOT.topAffectedStates) {
      expect(geoStateNames.has(state.name)).toBe(true);
      expect(state.floodedAreaKm2).toBeGreaterThan(0);
      expect(["severe", "moderate", "low"]).toContain(state.severity);
      expect(["severe", "moderate", "low"]).toContain(state.forecastSeverity);
    }
  });

  it("ensures internal consistency across summary, trend, and regional data", () => {
    const snap = MONSOON_PEAK_SNAPSHOT;

    for (let i = 0; i < snap.topAffectedStates.length - 1; i++) {
      expect(snap.topAffectedStates[i]!.floodedAreaKm2).toBeGreaterThanOrEqual(
        snap.topAffectedStates[i + 1]!.floodedAreaKm2
      );
    }

    const latestTrend = snap.trend[snap.trend.length - 1];
    expect(latestTrend?.floodedAreaKm2).toBe(snap.summary.totalSeverelyFloodedKm2);

    expect(snap.sourceAttribution.name).toBeTruthy();
    expect(snap.sourceAttribution.provider).toBeTruthy();
    expect(snap.sourceAttribution.disclaimer).toBeTruthy();
  });

  it("handles recession scenario with dynamic state changes", () => {
    const peak = MONSOON_PEAK_SNAPSHOT;
    const recession = POST_MONSOON_RECESSION_SNAPSHOT;

    expect(recession.summary.totalSeverelyFloodedKm2).toBe(0);
    expect(recession.summary.change7dPct).toBeLessThan(0);
    expect(recession.topAffectedStates[0]?.floodedAreaKm2).toBeLessThan(
      peak.topAffectedStates[0]?.floodedAreaKm2 ?? 0
    );
  });

  it("supports subscription and scenario toggling via snapshotManager", () => {
    let current = snapshotManager.getSnapshot();
    const unsubscribe = snapshotManager.subscribe((s) => {
      current = s;
    });

    snapshotManager.setScenario("recession");
    expect(current.scenarioName).toBe("recession");

    snapshotManager.setScenario("unavailable");
    expect(current.status).toBe("unavailable");
    expect(current.errorMessage).toBeDefined();

    snapshotManager.setScenario("monsoon_peak");
    expect(current.scenarioName).toBe("monsoon_peak");
    expect(current.status).toBe("ready");

    unsubscribe();
  });
});

describe("SATO Ranking Intelligence & Comparative Queries", () => {
  it("returns exactly one state for 'Which state is least affected?'", () => {
    const res = analyzeSatoQuery("Which state is least affected?", MONSOON_PEAK_SNAPSHOT);

    expect(res.text).toContain("- **State:** Jharkhand");
    expect(res.text).toContain("- **Metric:** Inundated Flood Extent (km²)");
    expect(res.text).toContain("240 km²");
    expect(res.text).toContain("- **Why:**");
    expect(res.selectedState).toBe("Jharkhand");
    // Ensure it does not return a list of multiple numbered states
    expect(res.text).not.toContain("1. Assam");
    expect(res.text).not.toContain("2. Bihar");
  });

  it("returns exactly one state for 'Which state is most affected?'", () => {
    const res = analyzeSatoQuery("Which state is most affected?", MONSOON_PEAK_SNAPSHOT);

    expect(res.text).toContain("- **State:** Assam");
    expect(res.text).toContain("- **Metric:** Inundated Flood Extent (km²)");
    expect(res.text).toContain("3,240 km²");
    expect(res.selectedState).toBe("Assam");
    expect(res.text).not.toContain("1. Assam");
  });

  it("correctly identifies lowest and highest flood risk states", () => {
    const highRisk = analyzeSatoQuery("Which state has the highest flood risk?", MONSOON_PEAK_SNAPSHOT);
    expect(highRisk.text).toContain("- **State:** Assam");
    expect(highRisk.text).toContain("SEVERE");

    const lowRisk = analyzeSatoQuery("Which state has the lowest flood risk?", MONSOON_PEAK_SNAPSHOT);
    expect(lowRisk.text).toContain("Lowest Flood Risk State");
    expect(lowRisk.text).toContain("Low / Normal Impact");
  });

  it("correctly handles population exposure comparisons", () => {
    const mostPop = analyzeSatoQuery("Which state has the most affected population?", MONSOON_PEAK_SNAPSHOT);
    expect(mostPop.text).toContain("- **State:** Bihar");
    expect(mostPop.text).toContain("Estimated Exposed Population");
    expect(mostPop.text).toContain("5,120,000");

    const leastPop = analyzeSatoQuery("Which state has the least affected population?", MONSOON_PEAK_SNAPSHOT);
    expect(leastPop.text).toContain("- **State:** Uttaranchal");
    expect(leastPop.text).toContain("95,000");
  });

  it("dynamically sorts and slices Top 3 and Bottom 3 rankings", () => {
    const top3 = analyzeSatoQuery("Rank the 3 most affected states", MONSOON_PEAK_SNAPSHOT);
    expect(top3.text).toContain("Top 3 Most Affected States");
    expect(top3.text).toContain("1. **Assam**: **3,240 km²**");
    expect(top3.text).toContain("2. **Bihar**: **2,870 km²**");
    expect(top3.text).toContain("3. **Uttar Pradesh**: **1,920 km²**");
    expect(top3.text).not.toContain("4. **West Bengal**");

    const bottom3 = analyzeSatoQuery("Rank the 3 least affected states", MONSOON_PEAK_SNAPSHOT);
    expect(bottom3.text).toContain("3 Least Affected States");
    expect(bottom3.text).toContain("1. **Jharkhand**: **240 km²**");
    expect(bottom3.text).toContain("2. **Uttaranchal**: **290 km²**");
    expect(bottom3.text).toContain("3. **Kerala**: **360 km²**");
    expect(bottom3.text).not.toContain("4. **Gujarat**");
  });

  it("filters states by risk tier dynamically", () => {
    const high = analyzeSatoQuery("Which states are at high risk?", MONSOON_PEAK_SNAPSHOT);
    expect(high.text).toContain("States at High / Severe Risk");
    expect(high.text).toContain("Assam");
    expect(high.text).toContain("Bihar");
    expect(high.text).toContain("Meghalaya");
  });

  it("switches comparison results dynamically when scenario changes", () => {
    const peakLeast = analyzeSatoQuery("Which state is least affected?", MONSOON_PEAK_SNAPSHOT);
    expect(peakLeast.text).toContain("Jharkhand");

    const recessionLeast = analyzeSatoQuery("Which state is least affected?", POST_MONSOON_RECESSION_SNAPSHOT);
    expect(recessionLeast.text).toContain("Orissa");
    expect(recessionLeast.text).toContain("320 km²");
  });

  it("handles missing metric queries without fabricating data", () => {
    const res = analyzeSatoQuery("Which state has the lowest financial damage in dollars?", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Metric Unavailable in Active Snapshot");
    expect(res.text).not.toContain("USD");
    expect(res.text).not.toContain("$");
  });
});

describe("SATO Intent Routing & State Recognition", () => {
  it("does not match 'What's up?' to Uttar Pradesh and returns greeting", () => {
    const res = analyzeSatoQuery("What's up?", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Hello! I am **SATO**");
    expect(res.text).not.toContain("Uttar Pradesh");
    expect(res.text).not.toContain("1,920 km²");
  });

  it("handles standard greetings gracefully", () => {
    const res = analyzeSatoQuery("Hello there", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Hello! I am **SATO**");
  });

  it("handles punctuation and abbreviations like U.P. and J&K accurately", () => {
    const upStates = detectMentionedStates("Forecast for U.P.?", MONSOON_PEAK_SNAPSHOT);
    expect(upStates.length).toBe(1);
    expect(upStates[0]!.name).toBe("Uttar Pradesh");

    const jkStates = detectMentionedStates("Is J&K flooded?", MONSOON_PEAK_SNAPSHOT);
    expect(jkStates.length).toBe(1);
    expect(jkStates[0]!.name).toBe("Jammu and Kashmir");
  });

  it("routes 'What is the trend in Bihar?' to trend sub-intent, not generic state overview", () => {
    const res = analyzeSatoQuery("What is the trend in Bihar?", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Bihar — 7-Day Inundation Trend");
    expect(res.text).toContain("RISING");
    expect(res.text).toContain("2,870 km²");
  });

  it("routes 'Forecast for Assam?' to forecast sub-intent, not generic state overview", () => {
    const res = analyzeSatoQuery("Forecast for Assam?", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Assam — 72-Hour Forecast Outlook");
    expect(res.text).toContain("SEVERE");
    expect(res.mapLayer).toBe("forecast");
  });

  it("routes 'Population exposure in Bihar?' to population exposure sub-intent", () => {
    const res = analyzeSatoQuery("Population exposure in Bihar?", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("Bihar — Exposure Metrics");
    expect(res.text).toContain("5.12M people");
  });

  it("preserves state mention order in pairwise comparisons", () => {
    const states = detectMentionedStates("Compare Bihar and Assam", MONSOON_PEAK_SNAPSHOT);
    expect(states[0]!.name).toBe("Bihar");
    expect(states[1]!.name).toBe("Assam");

    const compRes = analyzeSatoQuery("Compare Bihar and Assam", MONSOON_PEAK_SNAPSHOT);
    expect(compRes.text).toContain("Regional Comparison: Bihar vs. Assam");
  });

  it("does not silently pick defaults when only one state is given for comparison", () => {
    const res = analyzeSatoQuery("Compare Bihar", MONSOON_PEAK_SNAPSHOT);
    expect(res.text).toContain("please specify **two states** to compare");
    expect(res.text).not.toContain("Regional Comparison: Bihar vs. Assam");
  });

  it("returns honest telemetry outage notice when data feed is unavailable", () => {
    const res = analyzeSatoQuery("Which state is most affected?", UNAVAILABLE_SNAPSHOT);
    expect(res.text).toContain("Data Telemetry Interrupted");
    expect(res.text).toContain("offline");
  });
});
