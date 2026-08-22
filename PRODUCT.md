# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: existing Next.js 14 (Pages Router) dashboard in `dashboard/` — preserve APIs that read repo JSON (`run-history`, `incident`, `playbook`, `snapshots`, `anomalies`) and optional SSE; redesign UI in place.

## Users

**Primary (hackathon judges):** Bright Data Scrape-Verse judges evaluating Challenges 04 (self-healing scraper) and 05 (scrapers in CI, no humans). They open the live dashboard for ~60–90 seconds and decide polish, clarity of Scraper Studio usage, and whether the system feels real.

**Secondary (students / builders):** CS students and indie builders who maintain a nightly scraper (HN digest, research corpus, price watch) and cannot babysit broken selectors at 3am.

## Product Purpose

HealPipe (dashboard brand; repo also referenced as Autonomous CI Scraper / ScrapeForge) is a **nightly self-healing scrape pipeline**: Bright Data Scraper Studio extracts WeMakeDevs Global Hackathons & Student Bounties (`https://www.wemakedevs.org/hackathons`); normalized DOM fingerprinting + schema validation detect real breaks; a 4-stage cascade (`playbook` → heuristic remap → `bdata scraper heal` → escalate) repairs and approves the **same Collector ID** (`c_wemakedevs_scraper`) without humans in the common case.

Success = a judge understands in one viewport: *something broke → we knew why → we healed it → we learned*.

## Positioning

Unlike naive “catch exception then heal” bots or scrapers targeting sites with free APIs, HealPipe’s target is **WeMakeDevs Global Hackathons & Student Opportunities** (`wemakedevs.org/hackathons`) — a high-value community portal with **zero public API**, **no pre-built Bright Data template**, and high-stakes registration deadlines ($10,000 prize pools, NVIDIA DGX Sparks, iPads).

HealPipe’s core claim is: **know *when* and *why* the scraper broke** via dual signals (structural hash + data validation) and a learning playbook that resists false positives — with Bright Data create/run/heal/approve as the real extraction engine.

## Operating Context

- Demo on laptop/projector or deployed Vercel-style host during judging
- Data sourced from committed JSON in the repo (`logs/`, `data/`, `heal/playbook.json`) — no DB required
- “Run Heal Demo” button for interactive narrative when live Actions aren’t running
- Target site: `https://www.wemakedevs.org/hackathons` (not in Bright Data pre-built library, no free API)

## Capabilities and Constraints

- Must showcase: fingerprint waveforms, dual-signal language, cascade stages, playbook memory, same Collector ID, CI autonomy story
- Must not invent commercial customers, fake uptime SLAs, or Bright Data partnership claims beyond documented CLI usage
- Synthetic/demo runs may be labeled when not from Actions
- Open: final public product name lock (HealPipe preferred in competitive framing; code currently says ScrapeForge) — **assumed: HealPipe** for this redesign unless user overrides

## Brand Commitments

- Name for UI: **HealPipe**
- Tagline direction: self-healing CI scrapers / receipts for every heal
- Visual world (user-pinned 2026-08-22): **Linear + Vercel dashboard density** combined with **mission-control / satellite** drama. Deep navy ground, acid-green accents, giant status pill, live ticker, high information density. Clean, technical, dramatic.
- Must **not** clone HireLens: no warm beige paper, no thick black borders, no hard offset shadows, no Bebas Neue, no RetroUI / warm neobrutalism.

## Evidence on Hand

- Real pipeline modules: `fingerprint/`, `validate/`, `heal/`, `.github/workflows/`
- `logs/run_history.json`, snapshot JSON under `data/`, playbook under `heal/`
- Competitor references: https://hire-lenss.vercel.app/ , https://github.com/shankywho/HireLens
- No customer logos, press, or third-party testimonials on hand — do not fabricate

## Product Principles

1. **Receipts over vibes** — every heal shows signal, stage, duration, and outcome.
2. **Mechanism first** — the dual-signal + cascade is the hero, not generic “AI scraper” marketing.
3. **Student-real** — frame the pain as overnight broken homework/research pipelines, not enterprise hype.
4. **Studio-honest** — Bright Data CLI is the engine; our code is the smart trigger.
5. **Demo in one breath** — interactive heal path must be one click from the first screen.

## Accessibility & Inclusion

WCAG-minded contrast for dark or light surfaces; keyboard-reachable nav and demo controls; no information by color alone on waveforms/signals.
