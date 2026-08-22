# AI Assistant Disclosure

**Project:** HealPipe (Autonomous CI Scraper)  
**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data, Aug 2026)  
**AI assistant used:** Antigravity (Google DeepMind) / Claude 3.5 Sonnet  

Per hackathon rule §10: *"AI coding assistants are allowed, but their use must be disclosed."*

---

## What AI Was Used For

- **Architecture Design & Strategy**: Re-engineering the 4-stage cascade (`Playbook Hit` → `Heuristic Remap` → `bdata scraper heal` → `Escalate`) and designing the Dual-Signal DOM Skeleton SHA-256 fingerprinting mechanism.
- **Code Generation**: Authoring python modules (`fingerprint/`, `validate/`, `heal/`), Next.js control board components (`AppShell.js`, `FaultLineWaveform.js`, `CaseDossierModal.js`, `AIDigestModal.js`, `AgentMatrixCard.js`), and REST API endpoints under `dashboard/pages/api/`.
- **Documentation & UI Polish**: Drafting [README.md](file:///README.md), [CONCEPT.md](file:///CONCEPT.md), [PRODUCT.md](file:///PRODUCT.md), and designing the mission-control SCADA visual aesthetic.

---

## What Is the Author's Own Work

- **Core Architectural Concept**: Fusing **DOM Skeleton SHA-256 Hashing** with **Bright Data Scraper Studio CLI** (`bdata scraper create / run / heal / approve`) so scrapers self-heal in-place under the **exact same Collector ID** (`c_wemakedevs_scraper`).
- **Playbook Learning Memory**: Specifying the hash-transition replay cache (`old_hash -> new_hash`) that bypasses 15-minute LLM heal cycles and resolves repeat site redesigns in **~1.8s for $0 LLM cost**.
- **Multi-Platform Intelligence Focus**: Directing the target pivot away from sites with public APIs to **WeMakeDevs Global Hackathons** (`wemakedevs.org/hackathons`), **Devpost**, **Unstop**, **HackerEarth**, and **Devfolio**.
- **Tactical Quality Sensors & Time-Travel Telemetry**: Specifying the 4-sensor quality radar suite (DOM Hash, Null Detector, Type Shift, Volumetric Yield) and the Time-Travel Snapshot Explorer.
- **Verification & Testing**: End-to-end local build verification (`npm run build`), snapshot validation, and CLI subprocess execution testing.

---

## Technical Understanding (Hackathon Rule §11 / §12 Compliance)

The author fully understands all submitted codebase components and can demonstrate:
1. **Scraper Studio CLI Integration**: How `bdata scraper create`, `run`, `heal`, and `approve` execute via `npx -p @brightdata/cli` subprocesses while locking `collector.json`.
2. **Dual-Signal Sensing Logic**: How normalized DOM skeleton tree stripping ignores cosmetic CSS noise and triggers self-healing only on true structural layout breaks.
3. **Stage 0 Playbook Replay**: How `playbook.json` matches SHA-256 transition pairs to apply learned CSS selector maps in under 2 seconds.
4. **Vercel & Next.js Architecture**: How file-based snapshot API handlers (`/api/snapshot/[date]`) render static and dynamic telemetry without external DB dependencies.

*This project is not "entirely generated using AI without meaningful participant contribution." AI accelerated implementation; the author directed the architecture, verified correctness, and owns all technical decisions.*
