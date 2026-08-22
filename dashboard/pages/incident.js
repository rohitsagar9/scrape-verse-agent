import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import IncidentStepper from '../components/IncidentStepper';
import CaseDossierModal from '../components/CaseDossierModal';
import { useSSE } from '../lib/sse';

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch {
    return null;
  }
}

const GitBranchIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 01-9 9" />
  </svg>
);

export default function IncidentDetail() {
  const router = useRouter();
  const { date } = router.query;
  const [incident, setIncident] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { events } = useSSE();

  useEffect(() => {
    async function load() {
      const [inc, hist] = await Promise.all([
        fetchJSON('/api/incident'),
        fetchJSON('/api/run-history'),
      ]);
      if (inc) setIncident(inc);
      if (hist) setRuns(Array.isArray(hist) ? hist : []);
      setLoading(false);
    }
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [date]);

  const run = date
    ? runs.find((r) => r.date === date)
    : [...runs].sort((a, b) => b.date.localeCompare(a.date)).find((r) => r.signal && r.signal !== 'none');

  const liveEvents = events.filter((e) => !date || (e.timestamp && e.timestamp.startsWith(date)));
  const incidentRuns = runs.filter((r) => r.signal && r.signal !== 'none');

  const stageKey = {
    playbook: 'playbook',
    heuristic_remap: 'heuristic',
    llm_heal: 'llm',
    escalated: 'escalated',
  }[run?.stage_used] ?? 'playbook';

  return (
    <AppShell
      active="incident"
      title="Incidents"
      description="Per-incident heal receipts: dual signal, cascade stage, hash transition, validation."
      rail={
        <aside className="night-rail" aria-label="Incident list">
          <div className="night-rail-header">Pressure events</div>
          <Link
            href="/incident"
            style={{
              display: 'block',
              padding: '6px 8px',
              fontSize: '0.68rem',
              fontFamily: 'var(--mono)',
              color: 'var(--ink-faint)',
              marginBottom: 6,
            }}
          >
            ← All incidents
          </Link>
          {incidentRuns.length === 0 && (
            <div style={{ padding: 8, fontSize: '0.7rem', fontFamily: 'var(--mono)', color: 'var(--ink-faint)' }}>
              No incidents logged.
            </div>
          )}
          {incidentRuns.map((r) => (
            <Link
              key={r.date}
              href={`/incident?date=${r.date}`}
              className={`night-entry${r.date === date ? ' selected' : ''}`}
              style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
              aria-current={r.date === date ? 'page' : undefined}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="night-entry-date">{r.date?.slice(5)}</div>
                <div
                  className="night-entry-label"
                  style={{ color: r.outcome === 'healed' ? 'var(--teal)' : 'var(--coral)' }}
                >
                  {r.signal} · {r.outcome}
                </div>
              </div>
            </Link>
          ))}
        </aside>
      }
    >
      {loading ? (
        <div style={{ color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: '0.8rem', padding: '40px 0', textAlign: 'center' }}>
          Loading incident data…
        </div>
      ) : !incident && !run ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', maxWidth: 480, margin: '40px auto' }}>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Pipes holding steady</h1>
          <p className="page-lede" style={{ margin: '0 auto' }}>
            Incident dossiers appear when fingerprint or schema sensors fire. Trigger{' '}
            <code style={{ fontFamily: 'var(--mono)', background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 3 }}>
              workflow_dispatch
            </code>{' '}
            with force_heal to demo a break.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 className="page-title">
                Incident — {run?.date ?? incident?.timestamp?.slice(0, 10) ?? 'Latest'}
              </h1>
              <p className="page-lede">
                Full receipt for one pressure event: which signal fired, which valve closed the leak, and whether the Collector ID stayed put.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <span className={`badge ${run?.signal === 'none' ? 'badge-none' : 'badge-heal'}`}>
                  Signal: {run?.signal ?? incident?.triggered_by ?? 'unknown'}
                </span>
                <span
                  className={`badge ${
                    run?.outcome === 'healed'
                      ? 'badge-ok'
                      : run?.outcome === 'escalated'
                        ? 'badge-escalated'
                        : 'badge-none'
                  }`}
                >
                  {run?.outcome ?? 'in-progress'}
                </span>
                {run?.stage_used && (
                  <span className="badge badge-none">
                    <GitBranchIcon />
                    via {run.stage_used}
                  </span>
                )}
              </div>
            </div>
            {(incident?.collector_id || run?.collector_id) && (
              <code
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-soft)',
                  background: 'var(--surface-2)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                {incident?.collector_id ?? run?.collector_id}
              </code>
            )}
          </div>

          <div className="split-2">
            <div className="card">
              <div className="section-title">Cascade valves</div>
              <IncidentStepper activeStage={stageKey} outcome={run?.outcome ?? 'active'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(incident?.old_hash || run?.old_hash) && (
                <div className="card">
                  <div className="section-title">Hash transition</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ color: 'var(--ink-faint)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        Previous
                      </div>
                      <div style={{ color: 'var(--ink-soft)', wordBreak: 'break-all' }}>
                        {incident?.old_hash ?? run?.old_hash}
                      </div>
                    </div>
                    <div style={{ color: 'var(--amber)', fontSize: '0.65rem', marginBottom: 8, fontWeight: 700 }}>
                      ↓ mismatch confirmed (re-check)
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink-faint)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        New
                      </div>
                      <div style={{ color: 'var(--amber)', wordBreak: 'break-all', fontWeight: 600 }}>
                        {incident?.new_hash ?? run?.new_hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(incident?.changed_fields || run?.changed_fields)?.length > 0 && (
                <div className="card">
                  <div className="section-title">Changed fields</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(incident?.changed_fields || run?.changed_fields).map((f) => (
                      <span key={f} className="badge badge-heal">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {incident?.validation_failures?.length > 0 && (
                <div className="card">
                  <div className="section-title">Validation failures</div>
                  {incident.validation_failures.map((vf, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 8,
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span className="badge badge-escalated">{vf.field}</span>
                      <span style={{ color: 'var(--ink-soft)' }}>{vf.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {incident?.new_block_html && (
            <div className="card mb-4">
              <div className="section-title">New block HTML (truncated)</div>
              <pre
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.68rem',
                  color: '#A7F3D0',
                  background: '#1A1F25',
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'auto',
                  maxHeight: 240,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {incident.new_block_html}
              </pre>
            </div>
          )}

          {liveEvents.length > 0 && (
            <div className="card">
              <div className="section-title">Live cascade events</div>
              <div className="event-ticker" role="log" aria-live="polite">
                {[...liveEvents].reverse().map((ev, i) => (
                  <div className="event-line" key={i}>
                    <span className="event-ts">
                      {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                    <span className="event-name">{ev.event}</span>
                    <span className="event-data">
                      {typeof ev.data === 'object' ? JSON.stringify(ev.data) : ev.data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              Open Full Case Dossier →
            </button>
          </div>

          <CaseDossierModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            caseData={run || incident}
          />
        </>
      )}
    </AppShell>
  );
}
