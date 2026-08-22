import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch {
    return null;
  }
}

export default function DataExplorer() {
  const [snapshots, setSnapshots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const list = await fetchJSON('/api/snapshots');
      const snaps = list || [];
      setSnapshots(snaps);
      if (snaps.length > 0 && !selected) setSelected(snaps[0].date);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchJSON(`/api/snapshot/${selected}`).then((d) => {
      if (d) setItems(Array.isArray(d) ? d : [d]);
    });
  }, [selected]);

  return (
    <AppShell
      active="data"
      title="Extracted"
      description="Browse daily multi-platform hackathon extraction snapshots written under data/."
      rail={
        <aside className="night-rail" aria-label="Snapshot list">
          <div className="night-rail-header">Time-Travel Snapshots</div>
          {snapshots.length === 0 && (
            <div style={{ padding: '10px 8px', color: 'var(--ink-faint)', fontSize: '0.7rem', fontFamily: 'var(--mono)' }}>
              No snapshots yet.
            </div>
          )}
          {snapshots.map((snap, idx) => (
            <button
              key={snap.date}
              className={`night-entry${selected === snap.date ? ' selected' : ''}`}
              onClick={() => setSelected(snap.date)}
              aria-pressed={selected === snap.date}
            >
              <div>
                <div className="night-entry-date">
                  {idx === 0 ? `◉ LATEST: ${snap.date}` : `PAST: ${snap.date}`}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)', marginTop: 1 }}>
                  {snap.items} hackathons extracted
                </div>
              </div>
            </button>
          ))}
        </aside>
      }
    >
      <h1 className="page-title">Extracted Hackathon Repositories</h1>
      <p className="page-lede">
        Proof the collector ships structured rows after every heal — monitoring <strong>WeMakeDevs</strong> (Featured), Devpost, Unstop, HackerEarth, and Devfolio.
      </p>

      {loading ? (
        <div style={{ color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: '0.78rem', textAlign: 'center', padding: '40px 0' }}>
          Loading snapshots…
        </div>
      ) : snapshots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', maxWidth: 480, margin: '40px auto' }}>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 800, marginBottom: 8, fontSize: '1rem' }}>No snapshots yet</div>
          <div style={{ color: 'var(--ink-soft)', fontSize: '0.84rem', lineHeight: 1.7 }}>
            Nightly runs write{' '}
            <code style={{ fontFamily: 'var(--mono)', background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 3 }}>
              data/YYYY-MM-DD.json
            </code>
            .
          </div>
        </div>
      ) : (
        <>
          <div className="section-title" id="data-table-heading">
            Hackathons & Student Bounties — {selected} ({items.length} items)
          </div>
          <div className="table-wrapper" role="region" aria-labelledby="data-table-heading">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hackathon Event</th>
                  <th>Platform</th>
                  <th>Prize Pool / Rewards</th>
                  <th>Dates & Format</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="text-mono" style={{ color: 'var(--ink-faint)', width: 36, fontSize: '0.72rem' }}>
                      {item.rank ?? i + 1}
                    </td>
                    <td>
                      <a
                        href={item.url || 'https://www.wemakedevs.org/hackathons'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--ink)', fontSize: '0.82rem', fontWeight: 800 }}
                      >
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
