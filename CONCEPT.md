# CONCEPT — HealPipe (Autonomous CI Scraper)

**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data, Aug 2026)  
**Build Window:** Aug 17–23, 2026  
**Target Tracks:** 
- **Suit-Up Track**: Best Use of Bright Data (NVIDIA DGX Spark AI Supercomputer — $5,000)
- **Best UI Track**: Apple iPads for Team
- **Spider-Sense Track**: Best Clean Code (Keychron Keyboards)

---

## 1. The Problem

Web scrapers rot silently at 3am. A target site renames a CSS class or wraps event cards in a new `<div>` wrapper. Traditional scrapers exit 0 with empty arrays or throw unhandled null reference exceptions. Downstream AI pipelines, student opportunity feeds, and automated digests rot for days before anyone notices.

Existing solutions either:
1. **Cry wolf on cosmetic changes** (triggering expensive 15-minute LLM re-scrapes every night on tiny layout shifts).
2. **Break Collector IDs** (recreating new scrapers that break downstream production API keys and CI/CD pipelines).

## 2. The Solution: HealPipe

HealPipe is a **nightly self-healing scrape pipeline** that wraps **Bright Data Scraper Studio** with a pre-failure sensing radar and a 4-stage resolution cascade:

1. **Pre-Failure Sensing (Dual-Signal Gate)**: Normalizes DOM HTML structure into a canonical skeleton tree, hashing it with SHA-256. Fuses this with schema output validation to filter cosmetic noise from real structural breaks.
2. **Stage 0 Playbook Memory (~1.8s)**: Maintains a hash-pair memory (`old_hash -> new_hash`). Repeat site redesigns heal instantly for **$0 LLM cost**, skipping 15-minute LLM cycles.
3. **In-Place Collector ID Locking (`c_wemakedevs_scraper`)**: Auto-heals and approves draft repairs via `bdata scraper heal` + `bdata scraper approve` **under the exact same Collector ID**, keeping downstream CI/CD pipelines intact.
4. **Multi-Platform Hackathon Intelligence**: Sourced from high-value developer community portals (**WeMakeDevs**, Devpost, Unstop, HackerEarth, Devfolio) with **zero public APIs**.

---

## 3. Why This Is the Right Concept (Validation Matrix)

| Hackathon Criterion | HealPipe Implementation |
|---|---|
| **Bright Data Scraper Studio Integration** | ✅ Core engine: `bdata scraper create / run / heal / approve` executed programmatically via `@brightdata/cli`. |
| **Custom Scraper (Not Library-Only)** | ✅ Custom scraper `c_wemakedevs_scraper` created for WeMakeDevs Hackathons & Bounties. |
| **No Public API Target** | ✅ Targets `wemakedevs.org/hackathons` — zero public REST API available. |
| **Downstream Value Demonstration** | ✅ Integrated **AI Executive Briefing & Student Digest Generator**, Vector DB indexer, and webhook telemetry. |
| **Time-Travel Telemetry UI** | ✅ Interactive **Time-Travel Snapshot Explorer** (`LATEST: 2026-08-22`, `PAST: 2026-08-21`, `PAST: 2026-08-20`). |

---

## 4. Architecture

```
                  ┌───────────────────────────────────────────┐
  Nightly Cron ──▶│  HealPipe Control Board & Engine         │
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

---

## 5. Repository Structure

```
autonomous-ci-scraper/
├── .github/workflows/nightly.yml     # Cron + manual trigger
├── scraper/collector.json            # { collector_id: "c_wemakedevs_scraper", url, fields }
├── fingerprint/                      # DOM skeleton normalizer + SHA-256 hasher
├── validate/                         # Dual-signal schema & null value detector
├── heal/                             # 4-stage cascade orchestrator + playbook.json
├── data/                             # Daily snapshot files (2026-08-22.json, etc.)
├── logs/run_history.json             # Telemetry run history ledger
├── dashboard/                        # Next.js SCADA Control Board
│   ├── components/                   # AppShell, FaultLineWaveform, CaseDossierModal, AIDigestModal, AgentMatrixCard
│   ├── pages/index.js                # Control board & Time-Travel Explorer
│   ├── pages/data.js                 # Extracted snapshot explorer
│   └── pages/api/                    # File-backed REST API endpoints
├── README.md                         # Full documentation & Bright Data usage guide
├── CONCEPT.md                        # Concept thesis & architecture (this file)
├── AI_DISCLOSURE.md                  # Hackathon AI assistant disclosure (rule §10)
├── PRODUCT.md                        # Product positioning & brand commitments
└── requirements.txt
```

---

**Built for:** Into the Scrape-Verse (WeMakeDevs × Bright Data)  
**Bright Data Credits Code:** `wemakedevs` ($50 free credits)  
**Status:** 100% Production Ready for Vercel Deployment & Judging.
