/**
 * components/NightRail.js
 * -----------------------
 * Left scrollable rail — one entry per nightly run.
 * Reads directly from run_history.json shape.
 * No emoji; uses SVG bar sparklines only.
 */

export default function NightRail({ runs = [], selectedDate, onSelect }) {
  const sorted = [...runs].sort((a, b) => b.date.localeCompare(a.date));

  function signalColor(signal, outcome) {
    if (outcome === 'escalated') return 'var(--coral)';
    if (signal === 'hash' || signal === 'both' || signal === 'data') {
      return outcome === 'healed' ? 'var(--amber)' : 'var(--coral)';
    }
    return 'var(--teal)';
  }

  function signalLabel(signal) {
    return { none: 'stable', hash: 'Δ hash', data: 'Δ data', both: 'Δ both' }[signal] ?? signal ?? '—';
  }

  function outcomeLabel(outcome) {
    return { ok: 'clean', healed: 'healed', escalated: 'escalated', unknown: '?' }[outcome] ?? outcome ?? '—';
  }

  return (
    <nav className="night-rail" aria-label="Nightly run history">
      <div className="night-rail-header">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Run History
      </div>

      {sorted.length === 0 && (
        <div style={{ padding: '12px 8px', color: 'var(--text-faint)', fontSize: '0.7rem', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
          No runs yet.{'\n'}Pipeline populates this on first nightly execution.
        </div>
      )}

      {sorted.map(run => {
        const isSelected = run.date === selectedDate;
        const color = signalColor(run.signal, run.outcome);
        const barHeight = run.signal && run.signal !== 'none' ? 14 : 7;

        return (
          <button
            key={run.date}
            className={`night-entry${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(run.date === selectedDate ? null : run.date)}
            title={`${run.date} — signal: ${run.signal ?? 'none'} — ${run.outcome ?? 'ok'}`}
            aria-pressed={isSelected}
          >
            {/* Mini bar sparkline */}
            <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true" style={{ flexShrink: 0 }}>
              {/* base line */}
              <rect x="3" y="18" width="4" height="4" rx="1" fill={color} opacity="0.25" />
              {/* signal bar */}
              <rect x="3" y={22 - barHeight - 4} width="4" height={barHeight} rx="1" fill={color} opacity="0.9" />
              {/* healed suture dash */}
              {run.outcome === 'healed' && (
                <line x1="9" y1="11" x2="17" y2="11" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
              )}
            </svg>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="night-entry-date">{run.date?.slice(5) ?? run.date}</div>
              <div className="night-entry-label" style={{ color }}>
                {signalLabel(run.signal)} · {outcomeLabel(run.outcome)}
              </div>
            </div>

            <span
              className={`signal-dot${isSelected ? ' pulse' : ''}`}
              style={{ background: color }}
              aria-hidden="true"
            />
          </button>
        );
      })}

      <div style={{ height: 20 }} />
    </nav>
  );
}
