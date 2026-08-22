# HealPipe — Autonomous Self-Healing CI Scraper & Global Hackathon Radar

**Nightly self-healing scraper pipeline & multi-platform opportunity monitor built on Bright Data Scraper Studio.** Detects DOM skeleton class drift *before* scrapers fail, repairs selectors via Bright Data Scraper Studio CLI, and promotes repairs in-place under the exact same Collector ID — all while monitoring **WeMakeDevs** (Featured), **Devpost**, **Unstop**, **HackerEarth**, and **Devfolio**.

Built for **[Into the Scrape-Verse](https://wemakedevs.org/hackathons/scrape-verse)** (WeMakeDevs × Bright Data, Aug 17–23, 2026).

**Author:** **Rohit Sairam Vidyasagar** | [LinkedIn](https://www.linkedin.com/in/rohitsagar9/) | Email: `rohitsairamvidyasagar@gmail.com`  
**Live Demo:** [healpipe-dashboard.vercel.app](https://scrape-verse-agent-omega.vercel.app/)  
**Target Collector ID:** `c_wemakedevs_scraper`

---

## Quick Demo

**Live SCADA Control Center:** [healpipe-dashboard.vercel.app](https://healpipe-dashboard.vercel.app)  
Click **▶ Run Heal** or **AI Digest Generator ⚡** to inspect real-time telemetry, DOM skeleton hash diffs, and synthesized opportunity briefings.

### One-Call CLI Execution (Bright Data Scraper Studio Driver)

```bash
# Run nightly extraction via Bright Data CLI driver
npx -p @brightdata/cli bdata scraper run c_wemakedevs_scraper https://www.wemakedevs.org/hackathons
```

Sample structured output returned from Scraper Studio:

```json
[
  {
    "rank": 1,
    "event_name": "WeMakeDevs Agent Harness Hackathon 2026",
    "platform": "WeMakeDevs",
    "is_featured": true,
    "prize_pool": "$5,000 + NVIDIA DGX Spark Supercomputer",
    "dates": "Aug 22 - Aug 25, 2026",
    "format": "Global Online / Hybrid",
    "status": "OPEN FOR REGISTRATION",
    "url": "https://www.wemakedevs.org/hackathons"
  }
]
```

---

## The Problem

Web data is volatile. Target event platforms and developer portals frequently update their CSS class names, wrapper structures, and card layouts. A standard scraper fails silently at 3am — exiting 0 with empty arrays or null fields.

Missing a hackathon drop by one day means CS students and developers miss out on $10,000 prize pools, **NVIDIA DGX Spark AI Supercomputers**, **Apple iPads**, and **Keychron Keyboards**.

Bright Data Scraper Studio gives you clean **extraction**. However, traditional pipelines break downstream API keys and CI workflows when scrapers crash or create duplicate Collector IDs.

---

## The Solution: HealPipe

HealPipe wraps Bright Data Scraper Studio with a pre-failure sensing radar and a 4-stage resolution cascade:

1. **Pre-Failure Sensing (Dual-Signal Gate)**: Normalizes DOM HTML structure into a canonical skeleton tree, hashing it with SHA-256. Fuses this with schema output validation to filter cosmetic noise from real structural breaks.
2. **Stage 0 Playbook Memory (~1.8s)**: Maintains a hash-pair memory (`old_hash -> new_hash`). Repeat site redesigns heal instantly for **$0 LLM cost**, skipping 15-minute LLM cycles.
3. **In-Place Collector ID Locking (`c_wemakedevs_scraper`)**: Auto-heals and approves draft repairs via `bdata scraper heal` + `bdata scraper approve` **under the exact same Collector ID**, keeping downstream CI/CD pipelines intact.
4. **Time-Travel Snapshot Explorer**: Seamlessly flip between `LATEST: 2026-08-22`, `PAST: 2026-08-21`, and `PAST: 2026-08-20` to verify historic extraction fidelity.

---

## Unique Angle

> Unlike standalone scrapers or naive "catch exception then re-scrape" tools, **HealPipe** fuses pre-failure DOM skeleton fingerprinting with Bright Data Scraper Studio CLI, using a **Stage 0 Playbook Memory** to replay repeat redesigns in **~1.8s for $0 LLM cost**, while locking Collector IDs in-place so downstream production API keys never break.

---

## Architecture

```
                  ┌───────────────────────────────────────────┐
  Nightly Cron ──▶│  HealPipe SCADA Control Center            │
  (03:00 UTC)     │                                           │
                  │  1. DOM Skeleton Fetch & Normalize        │
                  │     └─ SHA-256 fingerprint check          │
                  │                                           │
                  │  2. Dual-Signal Gate (Hash + Schema)      │
                  │     ├─ Match ──▶ bdata scraper run       │
                  │     └─ Drift ──▶ 4-Stage Cascade         │
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

## How Bright Data Scraper Studio Is Used

Every scrape operation goes through **Bright Data Scraper Studio CLI (`bdata`)** commands executed programmatically via `npx -p @brightdata/cli`:

| Command | Where | What It Does in HealPipe |
|---|---|---|
| `bdata scraper create "https://www.wemakedevs.org/hackathons"` | M1 Initial Setup | Creates custom scraper `c_wemakedevs_scraper` in Scraper Studio with defined fields (`event_name`, `dates`, `format`, `prize_pool`, `status`). |
| `bdata scraper run c_wemakedevs_scraper <URL>` | Nightly CI Pipeline | Runs automated extraction every night at 03:00 UTC via GitHub Actions, outputting clean structured JSON. |
| `bdata scraper heal c_wemakedevs_scraper "<incident>"` | Stage 2 LLM Heal | When DOM skeleton drift is detected, passes incident context into Scraper Studio to auto-repair selectors. |
| `bdata scraper approve c_wemakedevs_scraper` | Stage 4 Approval | Promotes the repaired draft into production **under the exact same Collector ID**. |

**10/10 Hackathon Rule Compliance**:
- **Custom Scraper**: Created via `bdata scraper create` for `wemakedevs.org/hackathons` (not a pre-built library scraper).
- **No Public API Target**: Monitored platforms (WeMakeDevs, Devpost, Unstop, HackerEarth, Devfolio) do not offer free REST APIs for event listings.
- **Zero Global Installs**: All commands run cleanly through `npx -p @brightdata/cli`.

---

## The 4-Stage Cascade Heal

| Stage | Latency | Mechanism |
|---|---|---|
| **0 — Playbook** | **~1.8s** | Exact hash transition seen before → re-apply stored selector map for **$0 LLM cost** |
| **1 — Heuristic Remap** | **~2–5s** | Scores sibling/cousin DOM elements; adopts if confidence ≥ 0.85 |
| **2 — LLM Heal** | **~15min** | Invokes `bdata scraper heal` with incident context inside Scraper Studio |
| **3 — Escalate** | **Immediate** | All stages failed → roll back, flag incident for manual review PR |

---

## Target Sites & Global Hackathon Radar

- **Featured Target**: **WeMakeDevs Hackathons** (`https://www.wemakedevs.org/hackathons`)
- **Monitored Platforms**: **WeMakeDevs**, **Devpost**, **Unstop**, **HackerEarth**, **Devfolio**
- **Fields Extracted**: `event_name`, `platform`, `prize_pool`, `dates`, `format`, `status`, `event_url`

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/scrape-verse-agent.git
cd scrape-verse-agent

# Install dashboard dependencies
cd dashboard
npm install

# Run locally in mock/demo mode
npm run dev
# → http://localhost:3000
```

---

## Example Output

See [`data/`](data/):
- [`data/2026-08-22.json`](data/2026-08-22.json) — Latest multi-platform hackathon snapshot
- [`data/2026-08-21.json`](data/2026-08-21.json) — Historical snapshot
- [`logs/run_history.json`](logs/run_history.json) — Telemetry run history ledger

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Extraction Engine** | Bright Data Scraper Studio CLI (`@brightdata/cli`) |
| **Sensing & Validation** | Python 3.11+ (`hashlib`, `difflib`, `json`) |
| **Dashboard UI** | Next.js 14 (Pages Router) + SCADA CSS Design System |
| **Telemetry APIs** | File-backed REST endpoints (`/api/snapshot/[date]`) |
| **Deployment** | Vercel Serverless + GitHub Actions Cron (03:00 UTC) |

---

## AI Assistant Disclosure (Hackathon Rule §10)

This project was built with the assistance of **Antigravity** (Google DeepMind) / Claude 3.5 Sonnet. AI was used for architecture design, python/React code generation, and documentation. All code was reviewed, tested, and understood by the author. The DOM skeleton hash fingerprinting logic, Playbook memory design, and Bright Data CLI integration are the author's own creation.

See [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) for the full disclosure.

---

## Author & Contact

**Rohit Sairam Vidyasagar**  
- **LinkedIn**: [linkedin.com/in/rohitsagar9](https://www.linkedin.com/in/rohitsagar9/)  
- **Email**: `rohitsairamvidyasagar@gmail.com`  
- **Hackathon Submission**: [Into the Scrape-Verse](https://wemakedevs.org/hackathons/scrape-verse) (WeMakeDevs × Bright Data, Aug 2026)

---

## License

MIT — see [`LICENSE`](LICENSE).
