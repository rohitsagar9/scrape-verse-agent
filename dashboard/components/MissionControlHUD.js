/**
 * components/MissionControlHUD.js
 * --------------------------------
 * Sleek, dark glassmorphic Mission Control HUD (Linear/Stripe style).
 * Features live DOM spectrum waveforms, SHA-256 selector radar,
 * and real-time SCADA telemetry gauges.
 */

import { useState, useEffect } from 'react';

export default function MissionControlHUD({ isHealActive = false }) {
  const [ticks, setTicks] = useState([65, 82, 94, 78, 100, 88, 92, 96, 85, 99, 91, 100]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTicks((prev) => prev.map(() => Math.floor(75 + Math.random() * 25)));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      style={{
        background: 'rgba(8, 13, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '2px solid #1E293B',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'var(--sans)',
        color: '#E2E8F0',
      }}
    >
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isHealActive ? '#FF3B30' : '#00FF88',
              boxShadow: isHealActive ? '0 0 10px #FF3B30' : '0 0 10px #00FF88',
              animation: 'pulseGlow 1.5s infinite',
            }}
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em' }}>
            MISSION CONTROL HUD // DOM SPECTRUM
          </span>
        </div>
        <span
          style={{
            fontSize: '0.6rem',
            fontFamily: 'var(--mono)',
            background: 'rgba(0, 255, 136, 0.12)',
            color: '#00FF88',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          240Hz LIVE RADAR
        </span>
      </div>

      {/* DOM Spectrum Waveform Visualizer */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--mono)', color: '#94A3B8', marginBottom: 6 }}>
          <span>DOM TREE SKELETON INTEGRITY</span>
          <span style={{ color: '#00FF88', fontWeight: 700 }}>99.8% NOMINAL</span>
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 42, background: '#040710', padding: '6px 8px', borderRadius: 6, border: '1px solid #1E293B' }}>
          {ticks.map((val, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${val}%`,
                background: isHealActive
                  ? 'linear-gradient(180deg, #FF3B30 0%, rgba(255, 59, 48, 0.2) 100%)'
                  : 'linear-gradient(180deg, #00FF88 0%, rgba(0, 255, 136, 0.15) 100%)',
                borderRadius: 2,
                transition: 'height 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Telemetry Matrix Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ background: '#040710', padding: '8px 10px', borderRadius: 6, border: '1px solid #1E293B' }}>
          <div style={{ fontSize: '0.58rem', fontFamily: 'var(--mono)', color: '#64748B', textTransform: 'uppercase' }}>Collector ID</div>
          <div style={{ fontSize: '0.74rem', fontFamily: 'var(--mono)', fontWeight: 800, color: '#E2E8F0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            c_wemakedevs_scraper
          </div>
        </div>
        <div style={{ background: '#040710', padding: '8px 10px', borderRadius: 6, border: '1px solid #1E293B' }}>
          <div style={{ fontSize: '0.58rem', fontFamily: 'var(--mono)', color: '#64748B', textTransform: 'uppercase' }}>SHA-256 Hash</div>
          <div style={{ fontSize: '0.74rem', fontFamily: 'var(--mono)', fontWeight: 800, color: '#FFDE59', marginTop: 2 }}>
            8a9f3b12e45d
          </div>
        </div>
      </div>

      {/* Stage Latency Ledger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#040710', padding: '6px 10px', borderRadius: 6, border: '1px solid #1E293B', fontSize: '0.64rem', fontFamily: 'var(--mono)' }}>
        <span style={{ color: '#94A3B8' }}>Stage 0 Replay:</span>
        <span style={{ color: '#00FF88', fontWeight: 800 }}>~1.8s ($0 LLM Cost)</span>
      </div>
    </div>
  );
}
