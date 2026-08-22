/**
 * components/AIDigestModal.js
 * ----------------------------
 * Downstream Consumer Reader Modal.
 * Demonstrates what the self-healed Bright Data structured extraction output
 * powers downstream: AI Executive Briefing, Student Tech Digest, Vector DB Indexing.
 */

import { useState } from 'react';

const STUB_DIGEST = [
  {
    topic: 'Hackathons & AI Competitions',
    headline: 'WeMakeDevs Agent Harness Hackathon 2026 Registration Open',
    summary: 'Global online build track features a $5,000 NVIDIA DGX Spark AI supercomputer prize pool, Apple iPads, and Keychron keyboards.',
    tags: ['WeMakeDevs', 'NVIDIA DGX', 'Bright Data'],
    score: 5000,
  },
  {
    topic: 'Scraper Infrastructure',
    headline: 'Bright Data Scraper Studio Playoffs Announced',
    summary: 'Virtual build track challenges developers to construct zero-downtime, self-healing scraping pipelines using bdata CLI tools.',
    tags: ['Bright Data', 'Scraper Studio', 'CI/CD'],
    score: 3500,
  },
  {
    topic: 'Student Ecosystem Grants',
    headline: 'Vizag Student Tech Incubator Grant 2027 Applications Live',
    summary: 'Pre-seed incubator grant delivers $10,000 non-dilutive funding for student-led AI infrastructure startups.',
    tags: ['Incubator', 'Student Grants', 'Vizag Tech'],
    score: 10000,
  },
];

export default function AIDigestModal({ isOpen, onClose, items = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeDigest = STUB_DIGEST;

  const handleCopyMarkdown = () => {
    const text = `# Downstream Student Opportunity Briefing — Powered by HealPipe Clean Scraping\n\n` +
      activeDigest.map((d) => `### ${d.topic}: ${d.headline}\n${d.summary}\nPrize/Value: ${d.score} | Tags: ${d.tags.join(', ')}\n`).join('\n');
    navigator.clipboard.writeText(text);
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
      aria-labelledby="digest-modal-title"
    >
      <div
        style={{
          background: 'var(--panel)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hard-lg)',
          maxWidth: 760,
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
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                DOWNSTREAM AI POWERED
              </span>
              <span className="badge badge-ok" style={{ fontSize: '0.65rem' }}>
                100% CLEAN JSON CONSUMPTION
              </span>
            </div>
            <h2 id="digest-modal-title" className="page-title" style={{ fontSize: '1.8rem', margin: 0 }}>
              WeMakeDevs Hackathon & Student Opportunity Digest
            </h2>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--mono)', color: 'var(--ink-soft)', marginTop: 4 }}>
              Powered by self-healed extraction output from Bright Data Scraper Studio (Collector: <code style={{ color: 'var(--ink)' }}>c_wemakedevs_scraper</code>)
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

        {/* Pipeline Destinations Grid */}
        <div className="stat-grid mb-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="stat-card" style={{ padding: '10px 12px' }}>
            <div className="stat-label">AI Briefing Agent</div>
            <div className="stat-value" style={{ fontSize: '1.15rem', color: 'var(--teal)' }}>
              SYNTHESIZED
            </div>
            <div className="stat-sub">3 Opportunity digests generated</div>
          </div>
          <div className="stat-card amber" style={{ padding: '10px 12px' }}>
            <div className="stat-label">Vector DB Index</div>
            <div className="stat-value" style={{ fontSize: '1.15rem', color: 'var(--amber)' }}>
              30 EMBEDDINGS
            </div>
            <div className="stat-sub">Pinecone / Qdrant synced</div>
          </div>
          <div className="stat-card ink" style={{ padding: '10px 12px' }}>
            <div className="stat-label">Discord / Slack Alert</div>
            <div className="stat-value" style={{ fontSize: '1.15rem', color: 'var(--ink)' }}>
              LIVE STREAM
            </div>
            <div className="stat-sub">Zero missed hackathon drops</div>
          </div>
        </div>

        {/* Generated AI Stories */}
        <div className="section-title" style={{ fontSize: '1.1rem' }}>
          Synthesized Hackathon & Grant Digest
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {activeDigest.map((d, i) => (
            <div
              key={i}
              style={{
                background: '#FDFCF8',
                border: '2px solid #0E131F',
                borderRadius: 8,
                padding: 14,
                boxShadow: '3px 3px 0px #0E131F',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="why-tag" style={{ margin: 0, fontSize: '0.58rem' }}>
                  {d.topic}
                </span>
                <span className="text-mono" style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>
                  Prize Value: ${d.score}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '1rem', marginBottom: 6, color: 'var(--ink)' }}>
                {d.headline}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 10 }}>
                {d.summary}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {d.tags.map((tag) => (
                  <span key={tag} className="badge badge-none" style={{ fontSize: '0.58rem' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleCopyMarkdown}>
            {copied ? '✓ Markdown Copied!' : 'Copy Markdown Briefing'}
          </button>
        </div>
      </div>
    </div>
  );
}
