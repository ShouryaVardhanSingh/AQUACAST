# 🌊 AQUACAST
### Satellite-Inspired Flood Intelligence & Impact Assessment Platform

**Understanding floods. Seeing beyond the surface.**

AQUACAST is a flood intelligence platform designed to make flood conditions, regional impact, risk patterns, and forecasts easier to explore through an interactive geospatial dashboard and a contextual analytical assistant.

It combines geographic visualization, flood-impact indicators, scenario-based analysis, and a conversational interface into a unified experience.

🔗 **Live Demo:** https://aquacast-six.vercel.app/  
📂 **Repository:** https://github.com/ShouryaVardhanSingh/AQUACAST

---

## 🌍 Overview

Flood information is often difficult to interpret when it is spread across maps, reports, statistics, and separate data sources.

AQUACAST aims to simplify this experience by bringing flood-related information into one interactive platform, allowing users to explore affected regions, understand impact indicators, compare states, and interact with contextual flood data.

The platform currently focuses on India as its demonstration region, with an extensible interface designed for broader geographic coverage.

---

## ✨ Features

### 🗺️ TERRA — Flood Intelligence Dashboard

TERRA is AQUACAST's geospatial monitoring and analysis interface.

- Interactive India flood map
- State-level flood-risk visualization
- Flood impact indicators and statistics
- Affected-region rankings
- Flood trend visualization
- River basin and hydrological indicators
- Forecast visualization
- Multiple analytical dashboard views

### 🤖 SATO — Contextual Flood Intelligence Assistant

SATO is AQUACAST's conversational assistant, designed to answer questions using the currently active flood data snapshot.

Capabilities include:

- State-specific flood information
- Highest and lowest impact comparisons
- Dynamic state rankings
- Top-N and bottom-N queries
- State-to-state comparisons
- Population exposure queries
- Trend and forecast queries
- Flood situation summaries
- Context-aware responses based on selected dashboard scenarios
- Honest responses when requested information is unavailable

SATO currently uses a deterministic, rule-based intelligence engine rather than a generative AI API.

### 🌐 Interactive Geographic Exploration

- Continent-based navigation
- Geographic exploration experience
- India-focused demonstration coverage
- Coverage indicators for regions not yet supported

### 📊 Scenario-Based Analysis

Explore different benchmark scenarios through the dashboard:

- **Monsoon Peak** — high-inundation benchmark scenario
- **Post-Monsoon Recession** — reduced-inundation scenario
- **Sensor Telemetry Outage** — unavailable-data state

Dashboard visualizations and SATO responses update according to the active scenario.

---

## 🧭 Platform Modules

| Module | Description |
|---|---|
| **AQUACAST** | Unified flood intelligence platform |
| **TERRA** | Geospatial flood monitoring and impact dashboard |
| **SATO** | Contextual flood-data assistant |

---

## 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- Vite
- Tailwind CSS 4
- Framer Motion
- Recharts
- D3 Geo

### Development & Deployment

- Bun
- Git & GitHub
- Vercel

---

## 🏗️ Architecture

AQUACAST uses a shared flood-data model to keep the dashboard and assistant aligned.

```text
                  AQUACAST
                     │
          ┌──────────┴──────────┐
          │                     │
        TERRA                  SATO
          │                     │
  Geospatial Dashboard    Query Intelligence
          │                     │
          └──────────┬──────────┘
                     │
              FloodSnapshot
                     │
         Active Scenario / Data Model
```

The shared flood snapshot contains structured information used by both TERRA and SATO, helping maintain consistency between dashboard visualizations and assistant responses.

---

## 📁 Project Structure

```text
AQUACAST/
├── src/
│   ├── components/
│   │   └── aquacast/
│   │       ├── IndiaMap.tsx
│   │       ├── Sato.tsx
│   │       └── Terra.tsx
│   ├── lib/
│   │   ├── flood.ts
│   │   └── sato-engine.ts
│   ├── types/
│   │   └── flood.ts
│   ├── test/
│   │   └── flood-model.test.ts
│   └── routeTree.gen.ts
├── public/
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Git installed

### 1. Clone the repository

```bash
git clone https://github.com/ShouryaVardhanSingh/AQUACAST.git
```

### 2. Navigate to the project directory

```bash
cd AQUACAST
```

### 3. Install dependencies

```bash
bun install
```

### 4. Start the development server

```bash
bun run dev
```

Open the local URL displayed in your terminal.

---

## 🧪 Testing

Run the test suite:

```bash
bun run test
```

The tests cover flood model integrity, scenario switching, state comparisons, rankings, query routing, and other SATO behaviors.

## 🏗️ Production Build

Create the production build:

```bash
bun run build
```

---

## 🌐 Deployment

AQUACAST is deployed on Vercel.

**Production:** https://aquacast-six.vercel.app/

The project is connected to GitHub for version control and deployment updates.

---

## ⚠️ Data & Limitations

AQUACAST is currently a hackathon MVP using benchmark/demo flood snapshots and scenario-based data.

- The current flood scenarios are not a live satellite data feed.
- Satellite imagery is not processed in real time by the application.
- Flood values and exposure estimates should not be treated as verified operational disaster information.
- Forecast and impact figures are demonstration data, not authoritative emergency predictions.
- SATO answers from the available structured snapshot and is not a live internet-connected AI model.
- Geographic coverage is currently limited to the India demonstration experience.

AQUACAST is intended for demonstration and exploration, not operational emergency response or evacuation decision-making.

---

## 🔮 Future Scope

Potential future development includes:

- Integration of verified satellite-derived flood observations
- Live hydrological and river gauge data
- Automated satellite imagery processing
- More comprehensive geographic coverage
- Improved flood forecasting and impact assessment
- Population and infrastructure exposure analysis using verified datasets
- More advanced natural-language intelligence
- Backend data pipelines and automated data ingestion
- Historical flood-event analysis
- Improved validation and data provenance

---

## 🎯 Vision

AQUACAST aims to make flood intelligence more accessible, understandable, and geographically intuitive—bridging complex environmental data with interactive visual exploration and contextual analysis.

**Understanding floods. Seeing beyond the surface.**

---

## 👥 Team

Built as a hackathon project.

---

## 📄 License

No license has been added yet. Unless a license is added to this repository, the source code remains subject to its default copyright restrictions.
