# Design System — HealPipe

<!-- impeccable:design-schema 1 -->

## World

**Pipe-network SCADA / pressure-control room** (seed `9d3164c6`, assigned grounded #5). Warm porcelain instrument panels on concrete-tinted ground; gunmetal command header with a safety-orange commit key. Not HireLens phosphor terminal; not purple glass.

## Palette

| Role | Token | Value |
|------|-------|-------|
| Page ground | `--bg` | `#E8E4DC` |
| Panel | `--panel` | `#F7F4EE` |
| Ink | `--ink` | `#1C2228` |
| Header | `--gunmetal` | `#2A3038` |
| Stable / OK | `--teal` | `#0D9488` |
| Tremor | `--amber` | `#D97706` |
| Fault | `--coral` | `#DC2626` |
| Commit CTA | `--orange` | `#EA580C` |

## Typography

- UI / display: **Overpass** (800 for headlines, 600 for nav)
- Data / receipts: **JetBrains Mono**

## Surfaces

Embossed light panels (`box-shadow` inset highlight + soft drop). Dark gunmetal only for topbar + cascade valve board (receipt log uses phosphor-green on near-black as a raised borrow from terminal discipline — confined to that board).

## Signature interaction

Orange **Run Heal Demo** key advances four cascade valves and streams a receipt log — the narrative proof of dual-signal → playbook → approve.

## Pages

- `/` Control Board — story hero + valves + telemetry
- `/incident` — heal dossiers
- `/playbook` — learned hash transitions
- `/data` — extraction snapshots
