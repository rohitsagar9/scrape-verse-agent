# HealPipe — Autonomous Self-Healing CI Scraper & Global Hackathon Radar

> **Into the Scrape-Verse Hackathon** (WeMakeDevs × Bright Data, Aug 17–23, 2026)  
> Contender for **Suit-Up Track** ($5,000 NVIDIA DGX Spark AI Supercomputer), **Best UI Track** (Apple iPads), and **Best Clean Code** (Keychron Keyboards).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-healpipe--dashboard.vercel.app-00FF88?style=for-the-badge&logo=vercel)](https://scrape-verse-agent-omega.vercel.app)
[![Bright Data](https://img.shields.io/badge/Engine-Bright%20Data%20Scraper%20Studio-00D2FF?style=for-the-badge)](https://brightdata.com)
[![License](https://img.shields.io/badge/License-MIT-FFDE59?style=for-the-badge)](LICENSE)

**Author:** **Rohit Sairam Vidyasagar** | [LinkedIn](https://www.linkedin.com/in/rohitsagar9/) | Email: `rohitsairamvidyasagar@gmail.com`  
**Live Control Center:** [scrape-verse-agent-omega.vercel.app](https://scrape-verse-agent-omega.vercel.app)  
**Target Collector ID:** `c_wemakedevs_scraper`

---

## ⚡ 30-Second Elevator Pitch

Web scrapers rot silently at 3am. A target event platform renames a CSS class or wraps cards in a new layout container. Traditional scrapers exit 0 with empty arrays or null fields — causing students to miss out on $10,000 hackathon registration deadlines, **NVIDIA DGX Spark AI Supercomputers**, **Apple iPads**, and **Keychron Keyboards**.

Naive AI healers catch exceptions and blindly run expensive 15-minute LLM re-scrapes every night, recreating new scrapers that break downstream production API keys and CI/CD pipelines.

**HealPipe** solves this cleanly:
1. **Pre-Failure Sensing**: Normalizes DOM HTML structure into a canonical skeleton tree, hashing it with SHA-256 to catch class drift *before* scrapers fail.
2. **Stage 0 Playbook Memory (~1.8s)**: Replays stored hash-pair transition maps (`old_hash -> new_hash`). Repeat site redesigns heal in **1.8 seconds for $0 LLM cost**.
3. **In-Place Collector Lock (`c_wemakedevs_scraper`)**: Auto-heals and approves draft repairs via `bdata scraper heal` + `bdata scraper approve` **under the exact same Collector ID**, keeping downstream production API keys and CI/CD workflows intact.

---

## 📸 Interactive Control Center Features

| Feature | Capabilities |
| :--- | :--- |
| 🎓 **Student Opportunity Radar** | Primary landing viewport monitoring **WeMakeDevs** (Featured), **Devpost**, **Unstop**, **HackerEarth**, and **Devfolio**. |
| ↕️ **Portfolio Curtain Arrow Navigation** | Floating center navigation arrow toggling seamlessly between the Student Directory and SCADA Scraper Telemetry. |
| ⏳ **Time-Travel Snapshot Explorer** | Instant toggle between daily extractions: `LATEST: 2026-08-22`, `PAST: 2026-08-21`, `PAST: 2026-08-20`. |
| 📈 **DOM Fingerprint Oscilloscopes** | Per-field SHA-256 hash spectrum waveforms with interactive `Inspect` triggers. |
| ⚡ **AI Executive Briefing Generator** | Synthesizes clean scraped JSON into student tech digests, Pinecone vector embeddings, and webhooks. |

---

## 🛠️ How Bright Data Scraper Studio Is Used

> *This section explicitly documents Bright Data Scraper Studio usage per hackathon rules §5 & §9.*

HealPipe is built entirely on **Bright Data Scraper Studio's CLI engine (`@brightdata/cli`)**. All scrape lifecycle operations execute programmatically via `npx -p @brightdata/cli bdata` CLI commands:

```
                      ┌──────────────────────────────────────────────┐
  bdata scraper       │  1. Custom Scraper Created                   │
  create              │  Target: wemakedevs.org/hackathons           │
                      │  Collector ID: c_wemakedevs_scraper          │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
  bdata scraper       │  2. Nightly CI Extraction Run                │
  run                 │  Executes 03:00 UTC via GitHub Actions       │
                      │  Returns structured JSON to data/            │
                      └──────────────────────┬───────────────────────┘
                                             │ (If DOM Drift Detected)
                                             ▼
                      ┌──────────────────────────────────────────────┐
  bdata scraper       │  3. Stage 2 LLM Studio Heal                  │
  heal                │  Refactors CSS selectors inside Studio       │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
  bdata scraper       │  4. Promote Draft to Production              │
  approve             │  Same Collector ID locked in-place           │
                      └──────────────────────────────────────────────┘
```

| Operation | Command | Purpose in HealPipe |
|---|---|---|
| **Create Custom Scraper** | `bdata scraper create "https://www.wemakedevs.org/hackathons"` | Registers custom collector `c_wemakedevs_scraper` with fields `event_name`, `dates`, `format`, `prize_pool`, `status`. *(Rule §5: Custom scraper created in Studio).* |
| **Nightly Run** | `bdata scraper run c_wemakedevs_scraper <URL>` | Automated nightly extraction outputting clean structured JSON. |
| **Studio Self-Heal** | `bdata scraper heal c_wemakedevs_scraper "<incident>"` | Passes incident context into Scraper Studio to auto-repair selectors on structural layout breaks. |
| **Promote Draft** | `bdata scraper approve c_wemakedevs_scraper` | Promotes draft into production **under the exact same Collector ID**. |

**$50 Free Credits**: Redeem promo code **`wemakedevs`** at signup on [brightdata.com](https://brightdata.com).

---

## 🏗️ Architecture & 4-Stage Cascade

```
                  ┌───────────────────────────────────────────┐
  Nightly Cron ──▶│  HealPipe SCADA Control Center            │
  (03:00 UTC)     │                                           │
                  │  1. DOM Skeleton Fetch & Normalize        │
                  │     └─ SHA-256 fingerprint check          │
                  │                                           │
                  │  2. Dual-Signal Gate (Hash + Schema)      │
                  │     ├─ Match ──▶ bdata scraper run ✅     │
                  │     └─ Drift ──▶ 4-Stage Cascade          │
                  │                    │                      │
                  │    ┌───────────────┴───────────────┐      │
                  │    ▼                               ▼      │
                  │  Stage 0 Playbook Hit         Stage 2     │
                  │  (~1.8s, $0 LLM cost)     bdata scraper   │
                  │    │                          heal        │
                  │    └───────────────┬───────────────┘      │
                  │                    ▼                      │
                  │          bdata scraper approve            │
                  │          (Same Collector ID locked)       │
                  └────────────────────┬──────────────────────┘
                                       │
                                       ▼
                       Vercel SCADA Control Board &
                       Downstream AI Student Digest
```

### The 4 Resolution Valves

| Stage | Latency | Cost | Mechanism |
|---|---|---|---|
| **Stage 0 — Playbook** | **~1.8s** | **$0 LLM** | Exact hash transition match → re-apply stored selector map from `playbook.json` |
| **Stage 1 — Heuristic Remap** | **~2–5s** | **$0 LLM** | Scores sibling/cousin DOM elements; adopts if confidence ≥ 0.85 |
| **Stage 2 — LLM Studio Heal** | **~15min** | **API Credits** | Invokes `bdata scraper heal` with incident context inside Scraper Studio |
| **Stage 3 — Escalate** | **Immediate** | **$0** | All stages failed → roll back, flag incident for manual review PR |

---

## 🌐 Target Sites & Global Hackathon Radar

- **Featured Target**: **WeMakeDevs Hackathons** (`https://www.wemakedevs.org/hackathons`) — **Zero Public API**, **No Pre-Built Template**.
- **Monitored Platforms**: **WeMakeDevs**, **Devpost**, **Unstop**, **HackerEarth**, **Devfolio**.
- **Extracted Schema**: `event_name`, `platform`, `prize_pool`, `dates`, `format`, `status`, `event_url`.

---

## 🚀 Quick Start (Run Locally in 1 Minute)

```bash
# 1. Clone repository
git clone https://github.com/superman32432432/scrape-verse-agent.git
cd scrape-verse-agent

# 2. Install dashboard dependencies
cd dashboard
npm install

# 3. Launch local dev server
npm run dev
# → Open http://localhost:3000
```

---

## 📂 Repository Structure

```
scrape-verse-agent/
├── .github/workflows/nightly.yml     # Cron + workflow_dispatch trigger
├── scraper/collector.json            # { collector_id: "c_wemakedevs_scraper", url, fields }
├── fingerprint/                      # DOM skeleton normalizer + SHA-256 hasher
│   ├── fetch_block.py                # Raw HTML fetcher
│   ├── normalize.py                  # Skeleton canonicalizer
│   └── hash_block.py                 # SHA-256 hash generator
├── validate/                         # Dual-signal schema & null value detector
├── heal/                             # 4-stage cascade orchestrator + playbook.json
├── data/                             # Daily snapshot files (2026-08-22.json, etc.)
├── logs/run_history.json             # Telemetry run history ledger
├── dashboard/                        # Next.js SCADA Control Center
│   ├── components/                   # AppShell, FaultLineWaveform, CaseDossierModal, AIDigestModal, AgentMatrixCard
│   ├── pages/index.js                # Main Control Board & Time-Travel Explorer
│   ├── pages/data.js                 # Extracted snapshot explorer
│   └── pages/api/                    # File-backed REST API endpoints
├── README.md                         # This file
├── CONCEPT.md                        # Concept thesis & architecture guide
├── AI_DISCLOSURE.md                  # Hackathon AI assistant disclosure (rule §10)
├── PRODUCT.md                        # Product positioning & brand commitments
└── LICENSE                           # MIT License
```

---

## 🤖 AI Assistant Disclosure (Hackathon Rule §10)

This project was built with the assistance of **Antigravity** (Google DeepMind) / Claude 3.5 Sonnet. AI was used for architecture design, python/React code generation, and documentation. All code was reviewed, tested (clean builds pass), and understood by the author. The DOM skeleton hash fingerprinting logic, Playbook memory design, and Bright Data CLI integration are the author's own creation.

See [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) for the full disclosure.

---

## 👤 Author & Contact

**Rohit Sairam Vidyasagar**  
- **LinkedIn**: [linkedin.com/in/rohitsagar9](https://www.linkedin.com/in/rohitsagar9/)  
- **Email**: `rohitsairamvidyasagar@gmail.com`  
- **Submission**: [Into the Scrape-Verse](https://wemakedevs.org/hackathons/scrape-verse) (WeMakeDevs × Bright Data, Aug 2026)

---

## 📜 License

MIT License — see [`LICENSE`](LICENSE).
