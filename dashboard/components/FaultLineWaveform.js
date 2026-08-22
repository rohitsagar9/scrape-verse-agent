/**
 * components/FaultLineWaveform.js
 * --------------------------------
 * SVG fault-line oscilloscope waveform for a single tracked field.
 * - Flat line when hash is stable (teal)
 * - Spike when a mismatch fires (amber)
 * - Animated "suture" close when a heal is approved
 * - Shows SHA-256 fingerprint hash preview + Inspect dossier trigger.
 */

import { useEffect, useRef, useState } from 'react';

const W = 320;   // SVG viewBox width
const H = 36;    // SVG viewBox height
const MID = H / 2;
const SPIKE_H = H * 0.85;

const STUB_HASHES = {
  title: '8a9f3b12',
  url: '3d1e90fa',
  score: 'c4b17e90',
  author: 'f92b451c',
  comments_count: 'e11d087b',
  rank: 'a7c88b43',
};

function buildPath(points) {
  if (!points.length) return '';

  const step = W / Math.max(points.length - 1, 1);
  const cmds = [];

  points.forEach((pt, i) => {
    const x = i * step;
    let y;
    if (pt.changed && !pt.healed) {
      y = MID - SPIKE_H / 2;
    } else if (pt.healed) {
      y = MID - SPIKE_H / 4;
    } else {
      y = MID;
    }
    if (i === 0) cmds.push(`M ${x} ${y}`);
    else cmds.push(`L ${x} ${y}`);
  });

  return cmds.join(' ');
}

export default function FaultLineWaveform({ fieldName, runs, live = false, onInspect }) {
  const [animOffset, setAnimOffset] = useState(0);

  useEffect(() => {
    if (!live) return;
    let frame;
    const tick = () => {
      setAnimOffset(o => (o + 0.4) % W);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live]);

  const points = (runs || []).map(r => ({
    changed: r.signal === 'hash' || r.signal === 'both',
    healed: r.outcome === 'healed' || r.outcome === 'ok',
  }));

  if (!points.length) {
    points.push({ changed: false, healed: true });
    points.push({ changed: false, healed: true });
  }

  const pathD = buildPath(points);
  const hasChange = points.some(p => p.changed);
  const color = hasChange
    ? (points[points.length - 1].healed ? '#D97706' : '#DC2626')
    : '#00A859';
  const hashPreview = STUB_HASHES[fieldName] || '9f8b7c6a';

  return (
    <div className="fault-line-row" style={{ gap: 12, alignItems: 'center' }}>
      {/* Field label + SHA-256 Hash tag */}
      <div style={{ width: 140, flexShrink: 0 }}>
        <div className="fault-line-field" style={{ fontSize: '0.74rem' }}>{fieldName}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--ink-faint)', marginTop: 1 }}>
          sha:<span style={{ color: 'var(--ink)', fontWeight: 700 }}>{hashPreview}</span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <svg
        className="fault-line-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-label={`Fault line for ${fieldName}`}
      >
        <defs>
          <filter id={`glow-${fieldName}`}>
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <line x1="0" y1={MID} x2={W} y2={MID} stroke="#0E131F" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />

        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={hasChange ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={hasChange ? `url(#glow-${fieldName})` : undefined}
          style={{ transition: 'stroke 0.6s ease' }}
        />

        {hasChange && points[points.length - 1].healed && (
          <circle r="3" fill={color} opacity="0.8">
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}

        {live && (
          <circle cx={W - 2} cy={MID} r="3.5" fill={color} opacity="0.9">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* Status Badge + Inspect Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          className={`badge ${hasChange
            ? (points[points.length - 1].healed ? 'badge-heal' : 'badge-escalated')
            : 'badge-ok'}`}
          style={{ fontSize: '0.62rem', padding: '3px 7px' }}
        >
          {hasChange
            ? (points[points.length - 1].healed ? 'healed' : 'fault')
            : 'stable'}
        </span>
        {onInspect && (
          <button
            className="btn-secondary"
            onClick={() => onInspect(fieldName)}
            style={{ fontSize: '0.62rem', padding: '3px 8px', fontFamily: 'var(--mono)', fontWeight: 700 }}
            title="Inspect DOM Skeleton Case Dossier"
          >
            Inspect
          </button>
        )}
      </div>
    </div>
  );
}
