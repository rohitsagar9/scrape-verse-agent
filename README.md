# HealPipe

> **Autonomous Self-Healing Web Extraction Engine & CI Scraper Platform**  
> Powered by Bright Data Scraper Studio (AI Flow API & `@brightdata/cli`).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success)](https://scrape-verse-agent-omega.vercel.app)
[![Bright Data Scraper Studio](https://img.shields.io/badge/Bright%20Data-Collector%20c__mt5eqqbi2j9n8wv66n-orange)](https://docs.brightdata.com/datasets/scrapers/overview)
[![Video Walkthrough](https://img.shields.io/badge/YouTube-Demo%20Walkthrough-red)](https://youtu.be/8d66aCwAspA)

---

## Overview

**HealPipe** prevents data pipeline degradation caused by web layout drift. When target DOM structures change, conventional web scrapers return null payloads or fail silently, breaking downstream systems.

HealPipe continuously monitors target websites, detects layout mutations via normalized DOM skeleton fingerprinting, and automatically repairs extraction selectors using **Bright Data Scraper Studio**. Repaired selector maps are promoted **in-place under the existing Collector ID**, preventing API token invalidation and pipeline breakage.

---

## Core Capabilities

- **In-Place Collector Repair**: Utilizes `@brightdata/cli` (`bdata scraper heal` & `approve`) to update extraction rules without altering the primary Collector ID (`c_mt5eqqbi2j9n8wv66n`).
- **DOM Skeleton Hash Radar**: Fingerprints structural DOM trees with normalized SHA-256 hashes to identify layout drift before data extraction fails.
- **Stage 0 Playbook Caching**: Stores historical hash-pair selector transitions (`old_hash -> new_hash`). Replays known layout mutations in ~1.8 seconds at zero LLM inference cost.
- **Scraper Studio AI Flow API**: Direct REST integration with Bright Data Cloud endpoints (`POST /dca/trigger`, `GET /dca/get_result`).
- **Telemetry Control Center**: Next.js dashboard providing live DOM integrity spectrums, daily extraction snapshots, and AI-generated summaries.

---

## System Architecture

```
                                  ┌─────────────────────────────────────────┐
    HTTP Clients / Agents ───────▶│ Next.js Telemetry Control Center         │
                                  │ (scrape-verse-agent-omega.vercel.app)   │
                                  └────────────────────┬────────────────────┘
                                                       │
                                  ┌────────────────────▼────────────────────┐
                                  │  HealPipe Engine Core                   │
                                  │  - SHA-256 DOM Fingerprinting Radar     │
                                  │  - Stage 0 Playbook Transition Memory   │
                                  │  - Dual-Signal Anomaly Verification     │
                                  └────────────────────┬────────────────────┘
                                                       │
                                  ┌────────────────────▼────────────────────┐
                                  │ Bright Data Scraper Studio Gateway      │
                                  │ (Collector: c_mt5eqqbi2j9n8wv66n)       │
                                  │  - POST /dca/trigger                    │
                                  │  - bdata scraper heal & approve         │
                                  └─────────────────────────────────────────┘
```

---

## Bright Data Scraper Studio Integration

HealPipe interfaces with Bright Data Scraper Studio through both the Cloud REST API and the official CLI transport layer.

### Scraper Studio CLI Lifecycle Commands

```bash
# 1. Register target collector in Scraper Studio
npx -p @brightdata/cli bdata scraper create \
  "https://www.wemakedevs.org/hackathons" \
  "Extract event_name, dates, format, prize_pool, status, event_url"

# 2. Trigger automated extraction run
npx -p @brightdata/cli bdata scraper run c_mt5eqqbi2j9n8wv66n https://www.wemakedevs.org/hackathons

# 3. Autonomous selector repair upon layout drift detection
npx -p @brightdata/cli bdata scraper heal c_mt5eqqbi2j9n8wv66n "DOM skeleton hash changed on prize_pool field"

# 4. Promote repaired selector map to production (retains Collector ID)
npx -p @brightdata/cli bdata scraper approve c_mt5eqqbi2j9n8wv66n
```

### REST API Endpoint Verification

```bash
# Query connection status
curl -s https://scrape-verse-agent-omega.vercel.app/api/brightdata

# Response
{
  "connected": true,
  "status": "ACTIVE",
  "collector_id": "c_mt5eqqbi2j9n8wv66n",
  "target_url": "https://www.wemakedevs.org/hackathons",
  "engine": "Bright Data Scraper Studio Cloud",
  "token_configured": true
}
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/brightdata` | `GET` | Diagnostic status for Bright Data Scraper Studio connection. |
| `/api/brightdata` | `POST` | Triggers a live extraction job on Bright Data Cloud. |
| `/api/snapshots` | `GET` | Lists available historical daily extraction snapshot dates. |
| `/api/snapshot/[date]` | `GET` | Returns structured dataset rows for a specified date snapshot. |
| `/api/run-history` | `GET` | Telemetry log of automated execution and self-healing runs. |
| `/api/playbook` | `GET` | Returns cached selector transition mappings. |

---

## Quick Start

### Installation

```bash
git clone https://github.com/superman32432432/scrape-verse-agent.git
cd scrape-verse-agent/dashboard
npm install
```

### Environment Setup

Create `.env.local` in `dashboard/`:

```env
BRIGHT_DATA_API_TOKEN=your_bright_data_api_token
COLLECTOR_ID=c_mt5eqqbi2j9n8wv66n
TARGET_URL=https://www.wemakedevs.org/hackathons
```

### Local Execution

```bash
npm run dev
# Application running at http://localhost:3000
```

---

## Video Demonstration

A 2-minute video walkthrough demonstrating live execution, DOM skeleton radar telemetry, and Bright Data Scraper Studio integration is hosted on YouTube:

▶ **[Watch Demo Video on YouTube](https://youtu.be/8d66aCwAspA)**

---

## AI Assistant Disclosure (Rule §10)

In compliance with competition guidelines (§10 & §11), LLM tooling was utilized for code refactoring and documentation compilation. Core system design, including normalized DOM skeleton hashing, Stage 0 playbook caching, and Bright Data CLI lifecycle workflows, were developed by the author.

---

## Author & License

- **Author**: Rohit Sai Ram Vidya Sagar
- **LinkedIn**: [linkedin.com/in/rohitsagar9](https://www.linkedin.com/in/rohitsagar9/)
- **Email**: `rohitsairamvidyasagar@gmail.com`
- **License**: MIT
