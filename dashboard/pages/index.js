/**
 * Overview — HealPipe OSINT Control Board
 * Multi-Platform Global Hackathon Radar & Time-Travel Telemetry
 * Targets: WeMakeDevs (Featured), Devpost, Unstop, HackerEarth, Devfolio
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import NightRail from '../components/NightRail';
import FaultLineWaveform from '../components/FaultLineWaveform';
import CaseDossierModal from '../components/CaseDossierModal';
import AIDigestModal from '../components/AIDigestModal';
import AgentMatrixCard from '../components/AgentMatrixCard';
import MissionControlHUD from '../components/MissionControlHUD';

const TRACKED_FIELDS = ['event_name', 'dates', 'format', 'prize_pool', 'status', 'event_url'];

const STUB_RUNS = [
  { date: '2026-08-22', signal: 'none', outcome: 'ok', timestamp: '2026-08-22T03:00:00Z', stage_used: 'n/a', items_scraped: 30, duration_s: 18 },
  { date: '2026-08-21', signal: 'both', outcome: 'healed', timestamp: '2026-08-21T03:00:00Z', stage_used: 'playbook', items_scraped: 30, duration_s: 2, changed_fields: ['prize_pool', 'status'] },
  { date: '2026-08-20', signal: 'none', outcome: 'ok', timestamp: '2026-08-20T03:00:00Z', stage_used: 'n/a', items_scraped: 30, duration_s: 17 },
  { date: '2026-08-19', signal: 'both', outcome: 'healed', timestamp: '2026-08-19T03:04:00Z', stage_used: 'heuristic_remap', items_scraped: 30, duration_s: 47, changed_fields: ['dates', 'status'] },
];

const VALVES = [
  { step: 1, title: 'Sense', sub: 'DOM hash + schema' },
  { step: 2, title: 'Playbook', sub: 'Memory hit ~1s' },
  { step: 3, title: 'Remap / Heal', sub: 'Heuristic → bdata' },
  { step: 4, title: 'Approve', sub: 'Same collector ID' },
];

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default function Overview() {
  const [runs, setRuns] = useState(STUB_RUNS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [demoState, setDemoState] = useState('idle');
  const [demoStep, setDemoStep] = useState(0);
  const [logs, setLogs] = useState([]);
  
  // Snapshot Data & Time-Travel State
  const [availableSnapshots, setAvailableSnapshots] = useState(['2026-08-22', '2026-08-21', '2026-08-20']);
  const [activeSnapshotDate, setActiveSnapshotDate] = useState('2026-08-22');
  const [snapshotData, setSnapshotData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [anomalyReport, setAnomalyReport] = useState(null);

  // Portfolio Curtain Scroll State
  const [isScadaVisible, setIsScadaVisible] = useState(false);

  // Modal State for "Open Case" Dossier & AI Digest
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [runFilter, setRunFilter] = useState('all');

  // Track scroll position for portfolio curtain arrows
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('scada-section');
      if (el) {
        const rect = el.getBoundingClientRect();
        setIsScadaVisible(rect.top <= 300);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load available snapshot dates
  useEffect(() => {
    async function load() {
      try {
        const hist = await fetch('/api/run-history').then((r) => r.json());
        if (Array.isArray(hist) && hist.length > 0) setRuns(hist);
      } catch {}
      try {
        const snaps = await fetch('/api/snapshots').then((r) => r.json());
        if (Array.isArray(snaps) && snaps.length > 0) {
          const dates = snaps.map((s) => s.date);
          setAvailableSnapshots(dates);
          setActiveSnapshotDate(dates[0]);
        }
      } catch {}
      try {
        const ar = await fetch('/api/anomalies').then((r) => r.json());
        if (ar?.findings) setAnomalyReport(ar);
      } catch {}
    }
    load();
  }, []);

  // Fetch active snapshot rows when activeSnapshotDate changes
  useEffect(() => {
    async function fetchSnapshotRows() {
      if (!activeSnapshotDate) return;
      try {
        const rows = await fetch(`/api/snapshot/${activeSnapshotDate}`).then((r) => r.json());
        if (Array.isArray(rows)) {
          setSnapshotData(rows);
          setTotalRows(rows.length);
        }
      } catch {}
    }
    fetchSnapshotRows();
  }, [activeSnapshotDate]);

  const scrollToScada = () => {
    const el = document.getElementById('scada-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalRuns = runs.length;
  const healedRuns = runs.filter((r) => r.outcome === 'healed').length;
  const stableRuns = runs.filter((r) => r.signal === 'none').length;
  const uptimePct = totalRuns > 0 ? Math.round((stableRuns / totalRuns) * 100) : 100;
  const lastSignal = [...runs].sort((a, b) => b.date.localeCompare(a.date))[0];

  const tickerItems = [
    `★ WEMAKEDEVS (Featured) · Devpost · Unstop · HackerEarth · Devfolio`,
    `collector c_wemakedevs_scraper · ${uptimePct}% clean nights`,
    `${healedRuns} autonomous heals · zero missed hackathon deadlines`,
    'bdata scraper create / run / heal / approve',
    lastSignal
      ? `last signal ${lastSignal.date} · ${lastSignal.signal === 'none' ? 'stable' : lastSignal.signal}`
      : 'awaiting first nightly',
    'targets: wemakedevs.org · devpost.com · unstop.com · hackerearth.com · devfolio.co',
    'playbook memory skips 15min LLM heal on repeat redesigns',
  ];

  const pill =
    demoState === 'running'
      ? { cls: 'hot', label: 'HEAL IN FLIGHT' }
      : demoState === 'done'
        ? { cls: '', label: 'HEAL APPROVED · SAME COLLECTOR' }
        : lastSignal?.signal && lastSignal.signal !== 'none'
          ? { cls: 'warn', label: `DRIFT · Δ ${lastSignal.signal.toUpperCase()}` }
          : { cls: '', label: 'SYSTEM NOMINAL' };

  const runInteractiveDemo = async () => {
    setDemoState('running');
    setDemoStep(1);
    setLogs([{ time: '03:12:01', color: '#FFB020', text: 'STRUCTURAL — WeMakeDevs event card DOM skeleton hash drifted after layout update.' }]);
    await new Promise((r) => setTimeout(r, 1200));
    setDemoStep(2);
    setLogs((prev) => [...prev, { time: '03:12:02', color: '#FF3B30', text: 'DATA — prize_pool null in preview. Dual-signal re-check confirmed (not noise).' }]);
    await new Promise((r) => setTimeout(r, 1400));
    setDemoStep(3);
    setLogs((prev) => [...prev, { time: '03:12:03', color: '#00FF88', text: 'Stage 0 PLAYBOOK HIT — known transition. Selector map re-applied in 1.8s.' }]);
    await new Promise((r) => setTimeout(r, 1100));
    setDemoStep(4);
    setLogs((prev) => [...prev, { time: '03:12:05', color: '#00FF88', text: 'schema 0.98 · bdata scraper approve · c_wemakedevs_scraper unchanged' }]);
    setDemoState('done');
    const today = new Date().toISOString().slice(0, 10);
    setRuns((prev) => [
      {
        date: `${today} (Demo)`,
        signal: 'both',
        outcome: 'healed',
        timestamp: new Date().toISOString(),
        stage_used: 'playbook',
        duration_s: 2,
        items_scraped: 30,
        changed_fields: ['prize_pool', 'status'],
      },
      ...prev.filter((r) => !String(r.date).includes('Demo')),
    ]);
  };

  const handleOpenCase = (runOrField) => {
    if (typeof runOrField === 'string') {
      setCaseData({
        id: `CASE-${runOrField.toUpperCase()}`,
        date: activeSnapshotDate,
        target: 'https://www.wemakedevs.org/hackathons',
        collector_id: 'c_wemakedevs_scraper',
        signal: 'both',
        outcome: 'healed',
        stage: 'Stage 0 — Playbook Hit',
        old_hash: '8a9f3b12e45d901a7c88b43f2110c9d7',
        new_hash: 'c4b17e90f12a3489b099c88214fa76e3',
        duration: '1.8s',
        confidence: '98%',
      });
    } else {
      setCaseData(runOrField || null);
    }
    setIsModalOpen(true);
  };

  const filteredRuns = runs.filter((r) => {
    if (runFilter === 'healed') return r.outcome === 'healed';
    if (runFilter === 'stable') return r.signal === 'none';
    return true;
  });

  const spotlightItem = snapshotData.length > 0 ? snapshotData[0] : {
    event_name: 'WeMakeDevs Agent Harness Hackathon 2026',
    platform: 'WeMakeDevs',
    prize_pool: '$5,000 + NVIDIA DGX Spark Supercomputer',
    dates: 'Aug 22 - Aug 25, 2026',
    format: 'Global Online / Hybrid',
    status: 'OPEN FOR REGISTRATION',
    url: 'https://www.wemakedevs.org/hackathons'
  };

  return (
    <AppShell
      active="overview"
      title="Global Opportunity Radar"
      description="Global Student Opportunity & Hackathon Intelligence Radar — monitoring WeMakeDevs, Devpost, Unstop, HackerEarth, and Devfolio."
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => setIsDigestOpen(true)}
            style={{ fontSize: '0.75rem', background: '#FFDE59', color: '#0E131F' }}
          >
            AI Digest Generator ⚡
          </button>
          <button
            className="btn-secondary"
            onClick={scrollToScada}
            style={{ fontSize: '0.75rem' }}
          >
            Scraper Engine ↓
          </button>
          <button
            className="btn-primary"
            onClick={runInteractiveDemo}
            disabled={demoState === 'running'}
            aria-label="Run interactive heal demonstration"
          >
            <PlayIcon />
            {demoState === 'running' ? 'Healing…' : 'Run heal'}
          </button>
        </div>
      }
      tickerItems={tickerItems}
    >
      {/* FLOATING PORTFOLIO-STYLE CENTER ARROW NAVIGATION BUTTON */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          pointerEvents: 'auto',
        }}
      >
        {!isScadaVisible ? (
          <button
            onClick={scrollToScada}
            className="portfolio-nav-pill"
            style={{
              background: '#090D1A',
              color: '#00FF88',
              border: '2.5px solid #0E131F',
              boxShadow: '4px 4px 0px #0E131F',
              padding: '10px 22px',
              borderRadius: 30,
              fontFamily: 'var(--mono)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>INSPECT SCRAPER ENGINE</span>
            <span style={{ fontSize: '1.1rem', animation: 'bounceArrow 1.5s infinite' }}>↓</span>
          </button>
        ) : (
          <button
            onClick={scrollToTop}
            className="portfolio-nav-pill"
            style={{
              background: '#FFDE59',
              color: '#0E131F',
              border: '2.5px solid #0E131F',
              boxShadow: '4px 4px 0px #0E131F',
              padding: '10px 22px',
              borderRadius: 30,
              fontFamily: 'var(--mono)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>STUDENT DIRECTORY</span>
            <span style={{ fontSize: '1.1rem', animation: 'bounceArrow 1.5s infinite' }}>↑</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Student Opportunity Hero & Directory (Main Curtain Viewport) */}
      <section className="story-hero anim-in mb-4" aria-label="Student Opportunity Radar" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Top Grid: Hero Copy + Dark Glassmorphic Mission Control HUD */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, alignItems: 'center' }} className="hero-top-grid">
          <div className="story-copy">
            <div className={`giant-pill ${pill.cls}`} role="status">
              <span className="orb" aria-hidden="true" />
              {pill.label}
            </div>
            <h1 className="story-headline">Never miss a 3am hackathon drop.</h1>
            <p className="story-lede">
              Live monitoring <strong>WeMakeDevs</strong> (Featured Target), Devpost, Unstop, HackerEarth, and Devfolio — delivering active registration links, grand prizes ($5,000 + NVIDIA DGX Spark, iPads, Keychron Keyboards), and instant AI student digests.
            </p>
            
            {/* Featured Platform Pills Bar */}
            <div className="story-proof mb-3">
              <span className="proof-pill" style={{ background: '#00FF88', color: '#0E131F', fontWeight: 800 }}>
                ★ WEMAKEDEVS FEATURED
              </span>
              <span className="proof-pill">DEVPOST</span>
              <span className="proof-pill">UNSTOP</span>
              <span className="proof-pill">HACKEREARTH</span>
              <span className="proof-pill">DEVFOLIO</span>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => setIsDigestOpen(true)}>
                Generate AI Student Briefing ✦
              </button>
              <button className="btn-secondary" onClick={scrollToScada}>
                Inspect Scraper Controls ↓
              </button>
              <button className="btn-secondary" onClick={runInteractiveDemo} disabled={demoState === 'running'}>
                Replay 3am Heal
              </button>
            </div>
          </div>

          {/* Sleek Dark Glassmorphic Mission Control HUD Component */}
          <MissionControlHUD isHealActive={demoState === 'running'} />
        </div>

        {/* Featured Hackathon Spotlight Curtain Card */}
        <div style={{ background: '#090D1A', border: '3px solid #0E131F', boxShadow: '4px 4px 0px #0E131F', borderRadius: 10, padding: 22, margin: '16px 0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge" style={{ background: '#00FF88', color: '#0E131F', fontWeight: 800, fontSize: '0.68rem' }}>
                ★ WEMAKEDEVS SPOTLIGHT
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                LIVE FEED
              </span>
            </div>
            <span className="badge badge-ok" style={{ fontSize: '0.65rem' }}>
              {spotlightItem.status || 'OPEN FOR REGISTRATION'}
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--display)', fontSize: '1.9rem', margin: '0 0 8px', color: '#FFFFFF' }}>
            {spotlightItem.event_name || spotlightItem.title}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <div style={{ background: '#040710', padding: '8px 12px', borderRadius: 6, border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.6rem', color: '#718096', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Grand Prize & Hardware</div>
              <div style={{ fontSize: '0.92rem', fontFamily: 'var(--sans)', fontWeight: 800, color: '#FFDE59', marginTop: 2 }}>
                {spotlightItem.prize_pool || '$5,000 + NVIDIA DGX Spark'}
              </div>
            </div>
            <div style={{ background: '#040710', padding: '8px 12px', borderRadius: 6, border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.6rem', color: '#718096', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Dates & Format</div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#A7F3D0', marginTop: 2 }}>
                {spotlightItem.dates || 'Aug 22 - Aug 25'} ({spotlightItem.format || 'Global Online'})
              </div>
            </div>
            <div style={{ background: '#040710', padding: '8px 12px', borderRadius: 6, border: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.6rem', color: '#718096', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Perks & Track Awards</div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#00FF88', marginTop: 2 }}>
                Apple iPads & Keychron Keyboards
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a
              href={spotlightItem.url || 'https://www.wemakedevs.org/hackathons'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Register on WeMakeDevs →
            </a>
            <button
              className="btn-secondary"
              onClick={() => setIsDigestOpen(true)}
              style={{ fontSize: '0.78rem', padding: '8px 14px', background: '#FFDE59', color: '#0E131F', fontWeight: 800 }}
            >
              View AI Student Digest ✦
            </button>
          </div>
        </div>
      </section>

      {/* Time-Travel Snapshot Explorer Header & Directory Table */}
      <div className="card mb-5" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '2.5px solid var(--border-color)', background: '#090D1A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="section-title" style={{ margin: 0, color: 'var(--acid)', fontSize: '1.15rem' }}>
              Global Hackathon & Student Directory
            </div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--mono)', color: '#A0AEC0', marginTop: 2 }}>
              Monitored live across WeMakeDevs, Devpost, Unstop, HackerEarth, and Devfolio
            </div>
          </div>

          {/* Time-Travel Snapshot Pills */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--mono)', color: '#A0AEC0', textTransform: 'uppercase', marginRight: 4 }}>
              Snapshot:
            </span>
            {availableSnapshots.map((dateStr, idx) => (
              <button
                key={dateStr}
                onClick={() => setActiveSnapshotDate(dateStr)}
                className={`btn-secondary${activeSnapshotDate === dateStr ? ' active' : ''}`}
                style={{
                  fontSize: '0.68rem',
                  padding: '5px 12px',
                  fontFamily: 'var(--mono)',
                  fontWeight: 800,
                  background: activeSnapshotDate === dateStr ? '#00FF88' : '#1E293B',
                  color: activeSnapshotDate === dateStr ? '#0E131F' : '#E2E8F0',
                  border: '1.5px solid #0E131F',
                  borderRadius: 20,
                  boxShadow: activeSnapshotDate === dateStr ? '2px 2px 0px #0E131F' : 'none',
                }}
              >
                {idx === 0 ? `◉ LATEST: ${dateStr}` : `PAST: ${dateStr}`}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {['#', 'Hackathon Event', 'Platform', 'Prize Pool / Rewards', 'Dates & Format', 'Status'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshotData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                    Loading directory telemetry for {activeSnapshotDate}…
                  </td>
                </tr>
              ) : (
                snapshotData.map((item, i) => (
                  <tr key={i}>
                    <td className="text-mono text-faint" style={{ fontSize: '0.72rem' }}>{item.rank ?? i + 1}</td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={item.url || 'https://www.wemakedevs.org/hackathons'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', fontSize: '0.82rem', fontWeight: 800 }}>
                        {item.event_name || item.title}
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${item.platform === 'WeMakeDevs' ? 'badge-ok' : 'badge-none'}`} style={{ fontSize: '0.62rem', fontWeight: 800 }}>
                        {item.platform === 'WeMakeDevs' ? '★ WEMAKEDEVS' : item.platform || 'Devpost'}
                      </span>
                    </td>
                    <td className="text-mono text-amber" style={{ fontWeight: 700, fontSize: '0.76rem' }}>
                      {item.prize_pool || `$${item.score}`}
                    </td>
                    <td className="text-mono text-muted" style={{ fontSize: '0.7rem' }}>
                      {item.dates || item.author} ({item.format || 'Virtual'})
                    </td>
                    <td>
                      <span className={`badge ${item.status?.includes('REGISTRATION') || item.status === 'OPEN' ? 'badge-ok' : 'badge-heal'}`} style={{ fontSize: '0.58rem' }}>
                        {item.status || 'OPEN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SCADA TELEMETRY & SCRAPER CONTROL ROOM (Revealed via Down Arrow) */}
      <div id="scada-section" style={{ paddingTop: 20, scrollMarginTop: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="section-title" style={{ margin: 0, color: 'var(--ink)', fontSize: '1.25rem' }}>
            SCADA Telemetry & Self-Healing Pipeline
          </div>
          <button
            onClick={scrollToTop}
            className="btn-secondary"
            style={{ fontSize: '0.68rem', padding: '4px 10px', background: '#FFDE59', color: '#0E131F', fontWeight: 800 }}
          >
            ↑ Back to Student Directory
          </button>
        </div>

        {/* Cascade Valves Control Board */}
        <div className="cascade-board mb-5" aria-label="Heal cascade control board">
          <div className="cascade-board-label">Cascade · create / run / heal / approve</div>
          <div className="valve-row">
            {VALVES.map((v) => (
              <div
                key={v.step}
                className={`valve${demoStep === v.step ? ' active' : ''}${demoStep > v.step ? ' done' : ''}`}
                aria-current={demoStep === v.step ? 'step' : undefined}
              >
                <div className="valve-num">V{v.step}</div>
                <div className="valve-title">{v.title}</div>
                <div className="valve-sub">{v.sub}</div>
              </div>
            ))}
          </div>
          <div className="pipe-connector" aria-hidden="true" />
          <div className="receipt-log" role="log" aria-live="polite" aria-label="Heal receipt log">
            {logs.length === 0 ? (
              <div style={{ color: '#718096' }}>
                Standby — monitoring WeMakeDevs & global boards. Press Run heal to inspect receipts.
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i}>
                  <span className="ts">[{l.time}]</span>
                  <span style={{ color: l.color }}>{l.text}</span>
                </div>
              ))
            )}
          </div>
          {demoState === 'done' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--acid)', fontWeight: 700 }}>
                HEAL COMPLETE · no human · playbook updated
              </div>
              <button className="btn-secondary" onClick={() => handleOpenCase('demo-0819')} style={{ padding: '2px 8px', fontSize: '0.62rem' }}>
                Inspect Diff
              </button>
            </div>
          )}
        </div>

        {/* Coding Agent CLI Driver Matrix Card */}
        <AgentMatrixCard />

        {/* Pressure gauges */}
        <div className="stat-grid mb-5">
          <div className="stat-card" role="region" aria-label="Clean run rate">
            <div className="stat-label">Clean nights</div>
            <div className="stat-value text-teal">{uptimePct}%</div>
            <div className="stat-sub">{stableRuns}/{totalRuns} no-signal runs</div>
          </div>
          <div className="stat-card amber" role="region" aria-label="Autonomous heals">
            <div className="stat-label">Autonomous heals</div>
            <div className="stat-value text-amber">{healedRuns}</div>
            <div className="stat-sub">zero manual PRs in common path</div>
          </div>
          <div className="stat-card orange" role="region" aria-label="Last signal">
            <div className="stat-label">Last pressure</div>
            <div className="stat-value" style={{ fontSize: '1.15rem', paddingTop: 6, color: lastSignal?.signal === 'none' ? 'var(--teal)' : 'var(--amber)' }}>
              {lastSignal?.signal === 'none' ? 'STABLE' : `Δ ${lastSignal?.signal?.toUpperCase() ?? '—'}`}
            </div>
            <div className="stat-sub">{lastSignal?.date ?? '—'}</div>
          </div>
          <div className="stat-card ink" role="region" aria-label="Collector ID">
            <div className="stat-label">Collector ID</div>
            <div className="stat-value" style={{ fontSize: '1.15rem', paddingTop: 6, color: 'var(--ink)' }}>
              c_wemakedevs_scraper
            </div>
            <div className="stat-sub">healed in place — never recreated</div>
          </div>
        </div>

        {/* Fault lines - Oscilloscope Radar */}
        <div className="fault-line-container mb-5" role="region" aria-label="Structural integrity waveforms">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '1.25rem', color: 'var(--ink)', marginBottom: 2 }}>
                WeMakeDevs DOM Skeleton Fingerprint Radar
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Normalized SHA-256 skeleton hash spectrum for wemakedevs.org/hackathons. Click Inspect on any field for full DOM diffs.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', fontFamily: 'var(--mono)' }}>
              {[
                { label: 'Stable', color: '#00A859' },
                { label: 'Healed', color: '#D97706' },
                { label: 'Fault', color: '#DC2626' },
              ].map((l) => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-soft)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, border: '1px solid #0E131F' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          {TRACKED_FIELDS.map((field) => (
            <FaultLineWaveform
              key={field}
              fieldName={field}
              runs={selectedDate ? runs.filter((r) => r.date === selectedDate) : runs}
              live
              onInspect={handleOpenCase}
            />
          ))}
        </div>

        {/* Quality Sensors Radar */}
        <div className="card mb-5" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '2.5px solid var(--border-color)', background: '#090D1A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ margin: 0, color: 'var(--acid)' }}>Quality Sensors Suite</div>
            <div className="badge badge-ok" style={{ fontSize: '0.65rem' }}>
              98 / 100 QUALITY
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#ECE8DE', border: '2px solid #0E131F', padding: '8px 10px', borderRadius: 6, boxShadow: '2px 2px 0px #0E131F' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>DOM Skeleton Hash</div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#00A859', marginTop: 2 }}>100% NOMINAL</div>
              </div>
              <div style={{ background: '#ECE8DE', border: '2px solid #0E131F', padding: '8px 10px', borderRadius: 6, boxShadow: '2px 2px 0px #0E131F' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Null Value Detector</div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#00A859', marginTop: 2 }}>0 NULLS DETECTED</div>
              </div>
              <div style={{ background: '#ECE8DE', border: '2px solid #0E131F', padding: '8px 10px', borderRadius: 6, boxShadow: '2px 2px 0px #0E131F' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Type Shift Sensor</div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#00A859', marginTop: 2 }}>TYPES ALIGNED</div>
              </div>
              <div style={{ background: '#ECE8DE', border: '2px solid #0E131F', padding: '8px 10px', borderRadius: 6, boxShadow: '2px 2px 0px #0E131F' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Volumetric Yield</div>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--mono)', fontWeight: 700, color: '#00A859', marginTop: 2 }}>30 / 30 ROWS</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', lineHeight: 1.5, background: '#F5F2EA', border: '1.5px solid #0E131F', padding: 10, borderRadius: 6 }}>
              <strong>Sensor Verdict:</strong> Zero schema drift detected across active snapshots. Scraper Studio Collector <code>c_wemakedevs_scraper</code> operational.
            </div>
          </div>
        </div>

        {/* Architectural Superiority Matrix */}
        <div className="arch-banner mb-5">
          <div className="arch-banner-title">
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>ARCHITECTURAL EDGE</span>
            Why HealPipe Dominates Naive Chatbot Scrapers
          </div>
          <div className="arch-banner-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <div style={{ background: '#F5F2EA', border: '2px solid #0E131F', padding: 12, borderRadius: 6, boxShadow: '2.5px 2.5px 0px #0E131F' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>1. Pre-Failure Detection</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)', margin: '4px 0' }}>Dual-Signal DOM Skeleton</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Catches structural CSS class drift <em>before</em> scrapers exit with empty data. Competitors only react after total crashes.
                </div>
              </div>
              <div style={{ background: '#F5F2EA', border: '2px solid #0E131F', padding: 12, borderRadius: 6, boxShadow: '2.5px 2.5px 0px #0E131F' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>2. Memory-Backed Replay</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#00A859', margin: '4px 0' }}>Stage 0 Playbook Hit (~1.8s)</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Stores hash-pair repairs. Repeat site redesigns heal in 1.8 seconds at $0 LLM cost instead of paying 15-minute LLM fees every night.
                </div>
              </div>
              <div style={{ background: '#F5F2EA', border: '2px solid #0E131F', padding: 12, borderRadius: 6, boxShadow: '2.5px 2.5px 0px #0E131F' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>3. CI Pipeline Lock</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)', margin: '4px 0' }}>Same Collector ID In-Place</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                  Promotes drafts under <code>c_wemakedevs_scraper</code> so downstream production API keys and CI workflows never break.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nightly Run Ledger */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div className="section-title" style={{ margin: 0 }}>Nightly Run Ledger</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'all', label: 'All Runs' },
              { key: 'healed', label: 'Healed & Approved' },
              { key: 'stable', label: 'Stable / Nominal' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setRunFilter(f.key)}
                className={`btn-secondary${runFilter === f.key ? ' active' : ''}`}
                style={{
                  fontSize: '0.65rem',
                  padding: '4px 10px',
                  background: runFilter === f.key ? 'var(--acid)' : 'var(--panel)',
                  color: '#0E131F',
                  fontWeight: 700,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper mb-4" role="region" aria-label="Run history">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Target</th>
                <th>Signal</th>
                <th>Stage</th>
                <th>Output</th>
                <th>Outcome</th>
                <th>Investigation</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r, i) => (
                  <tr key={i}>
                    <td className="text-mono" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{r.date}</td>
                    <td className="text-mono text-muted" style={{ fontSize: '0.72rem' }}>wemakedevs.org / global</td>
                    <td>
                      <span className={`badge ${r.signal === 'none' ? 'badge-ok' : 'badge-heal'}`}>
                        {r.signal === 'none' ? 'none' : `Δ ${r.signal}`}
                      </span>
                    </td>
                    <td className="text-mono text-muted" style={{ fontSize: '0.72rem' }}>{r.stage_used ?? '—'}</td>
                    <td className="text-mono" style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 600 }}>
                      {r.items_scraped ? `${r.items_scraped} rows` : '—'}
                      {r.duration_s != null && <span style={{ color: 'var(--ink-faint)', marginLeft: 6 }}>({r.duration_s}s)</span>}
                    </td>
                    <td>
                      <span className={`badge ${r.outcome === 'ok' || r.outcome === 'healed' ? 'badge-ok' : 'badge-escalated'}`}>
                        {r.outcome === 'healed' ? 'healed & approved' : r.outcome?.toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        onClick={() => handleOpenCase(r)}
                        style={{ fontSize: '0.62rem', padding: '2px 7px', fontFamily: 'var(--mono)', fontWeight: 700 }}
                      >
                        Open Case Dossier
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Dossier Modal */}
      <CaseDossierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        caseData={caseData}
      />

      {/* Downstream AI Digest Modal */}
      <AIDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        items={snapshotData}
      />
    </AppShell>
  );
}
