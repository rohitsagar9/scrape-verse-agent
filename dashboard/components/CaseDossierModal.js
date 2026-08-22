/**
 * components/CaseDossierModal.js
 * --------------------------------
 * Interactive Case Investigation Modal.
 * Displays DOM skeleton hash transition, selector remappings,
 * Collector ID lock verification, and Bright Data Studio payloads.
 */

import { useState } from 'react';

const STUB_SELECTORS = [
  { field: 'title', oldSel: '.titleline > a', newSel: '.titleline .titlelink', conf: 98 },
  { field: 'score', oldSel: '.subtext .score', newSel: '.subtext span.score', conf: 97 },
  { field: 'url', oldSel: 'a.storylink', newSel: '.titleline a', conf: 99 },
  { field: 'author', oldSel: '.subtext .hnuser', newSel: '.subtext a.hnuser', conf: 96 },
  { field: 'comments_count', oldSel: 'td.subtext a:last-child', newSel: '.subtext a[href*="item?id="]', conf: 95 },
  { field: 'rank', oldSel: '.rank', newSel: 'span.rank', conf: 98 },
];

export default function CaseDossierModal({ isOpen, onClose, caseData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const incident = caseData || {
    id: 'INC-2026-0819',
    date: '2026-08-19',
    target: 'https://www.wemakedevs.org/hackathons',
    collector_id: 'c_wemakedevs_scraper',
    signal: 'both',
    outcome: 'healed',
    stage: 'Stage 0 — Playbook Hit',
    old_hash: '8a9f3b12e45d901a7c88b43f2110c9d7',
    new_hash: 'c4b17e90f12a3489b099c88214fa76e3',
    duration: '1.8s',
    confidence: '98%',
  };

  const payloadJSON = JSON.stringify(
    {
      case_id: incident.id || 'INC-2026-0819',
      collector_id: incident.collector_id || 'c_wemakedevs_scraper',
      status: 'approved_in_place',
      target_url: 'https://www.wemakedevs.org/hackathons',
      old_skeleton_hash: incident.old_hash || '8a9f3b12e45d901a7c88b43f2110c9d7',
      new_skeleton_hash: incident.new_hash || 'c4b17e90f12a3489b099c88214fa76e3',
      selector_map: STUB_SELECTORS.reduce((acc, curr) => {
        acc[curr.field] = curr.newSel;
        return acc;
      }, {}),
      studio_commands: [
        'bdata scraper heal --id c_wemakedevs_scraper',
        'bdata scraper approve --id c_wemakedevs_scraper',
      ],
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 13, 26, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: 'var(--panel)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard-lg)',
          maxWidth: 780,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span className="badge badge-ok" style={{ fontSize: '0.65rem' }}>
                CASE DOSSIER
              </span>
              <span className="badge badge-none" style={{ fontSize: '0.65rem' }}>
                {incident.date || '2026-08-19'}
              </span>
            </div>
            <h2 id="modal-title" className="page-title" style={{ fontSize: '1.8rem', margin: 0 }}>
              {incident.id || 'INC-2026-0819'} — Structural Investigation
            </h2>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--mono)', color: 'var(--ink-soft)', marginTop: 4 }}>
              Target: <strong style={{ color: 'var(--ink)' }}>{incident.target}</strong> · Collector:{' '}
              <span style={{ color: 'var(--acid)', background: '#090D1A', padding: '2px 6px', borderRadius: 4, border: '1px solid #0E131F' }}>
                {incident.collector_id || 'c_hn_scrapper'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.9rem', fontWeight: 800 }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Status Highlights */}
        <div className="stat-grid mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="stat-card" style={{ padding: '10px 12px' }}>
            <div className="stat-label">Trigger Signal</div>
            <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--amber)' }}>
              Δ {incident.signal ? incident.signal.toUpperCase() : 'BOTH'}
            </div>
            <div className="stat-sub">Hash + Schema mismatch</div>
          </div>
          <div className="stat-card amber" style={{ padding: '10px 12px' }}>
            <div className="stat-label">Resolution Valve</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--teal)' }}>
              Stage 0 Replay
            </div>
            <div className="stat-sub">Playbook Hit ~{incident.duration || '1.8s'}</div>
          </div>
          <div className="stat-card ink" style={{ padding: '10px 12px' }}>
            <div className="stat-label">Collector Status</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>
              LOCKED & APPROVED
            </div>
            <div className="stat-sub">Same ID maintained</div>
          </div>
        </div>

        {/* Section 1: Skeleton Hash Transition */}
        <div className="card mb-4" style={{ background: '#090D1A', color: '#FFFFFF', border: '2px solid #0E131F' }}>
          <div className="section-title" style={{ color: 'var(--acid)', marginBottom: 8, fontSize: '1rem' }}>
            DOM Skeleton SHA-256 Hash Diff
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>
            <div style={{ background: '#040710', padding: 10, borderRadius: 6, border: '1px solid #1E293B' }}>
              <div style={{ color: '#718096', fontSize: '0.58rem', textTransform: 'uppercase', marginBottom: 3 }}>Previous Skeleton</div>
              <div style={{ color: '#FF3B30', wordBreak: 'break-all', fontWeight: 700 }}>
                {incident.old_hash || '8a9f3b12e45d901a7c88b43f2110c9d7'}
              </div>
            </div>
            <div style={{ color: 'var(--acid)', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center' }}>➔</div>
            <div style={{ background: '#040710', padding: 10, borderRadius: 6, border: '1px solid #1E293B' }}>
              <div style={{ color: '#718096', fontSize: '0.58rem', textTransform: 'uppercase', marginBottom: 3 }}>Healed Skeleton</div>
              <div style={{ color: 'var(--acid)', wordBreak: 'break-all', fontWeight: 700 }}>
                {incident.new_hash || 'c4b17e90f12a3489b099c88214fa76e3'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Selector Mapping Table */}
        <div className="section-title" style={{ fontSize: '1.1rem' }}>
          Learned CSS Selector Remappings
        </div>
        <div className="table-wrapper mb-4">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Original Selector</th>
                <th>Healed Selector</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {STUB_SELECTORS.map((s) => (
                <tr key={s.field}>
                  <td className="text-mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {s.field}
                  </td>
                  <td className="text-mono text-faint" style={{ textDecoration: 'line-through' }}>
                    {s.oldSel}
                  </td>
                  <td className="text-mono text-teal" style={{ fontWeight: 700 }}>
                    {s.newSel}
                  </td>
                  <td className="text-mono" style={{ color: 'var(--ink)', fontWeight: 700 }}>
                    {s.conf}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Raw Studio Config */}
        <div className="section-title" style={{ fontSize: '1.1rem' }}>
          Bright Data Scraper Studio Payload
        </div>
        <pre className="mb-4" style={{ maxHeight: 180, fontSize: '0.68rem' }}>
          {payloadJSON}
        </pre>

        {/* Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? '✓ Payload Copied!' : 'Copy JSON Payload'}
          </button>
        </div>
      </div>
    </div>
  );
}
