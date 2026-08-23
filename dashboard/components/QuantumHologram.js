/**
 * components/QuantumHologram.js
 * ------------------------------
 * Mind-Bending 3D Interactive DOM Skeleton Hologram & Telemetry Radar.
 * Fills unused hero space with a glowing 3D perspective wireframe tesseract,
 * floating SHA-256 hash tags, and live SCADA frequency telemetry.
 */

import { useState } from 'react';

export default function QuantumHologram({ isHealActive = false }) {
  const [rotate, setRotate] = useState({ x: 15, y: 25 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    setRotate({ x: -x, y });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 15, y: 25 });
  };

  return (
    <div
      className="quantum-hologram-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'linear-gradient(135deg, #090D1A 0%, #050810 100%)',
        border: '3px solid #0E131F',
        boxShadow: '4px 4px 0px #0E131F',
        borderRadius: 12,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 240,
      }}
    >
      {/* Background Radar Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.08) 0%, transparent 70%),
            linear-gradient(rgba(0, 255, 136, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 16px 16px, 16px 16px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Telemetry Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isHealActive ? '#FF3B30' : '#00FF88',
              boxShadow: isHealActive ? '0 0 10px #FF3B30' : '0 0 10px #00FF88',
              animation: 'pulseGlow 1.2s infinite',
            }}
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', fontWeight: 800, color: '#A7F3D0', letterSpacing: '0.05em' }}>
            {isHealActive ? 'REMAP IN FLIGHT' : 'DOM SKELETON 3D MATRIX'}
          </span>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.58rem' }}>
          SHA-256 240Hz
        </span>
      </div>

      {/* 3D MIND-BENDING WIREFRAME CUBE STAGE */}
      <div
        style={{
          perspective: 600,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          margin: '8px 0',
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transition: 'transform 0.1s ease-out',
            animation: 'rotateCube 12s infinite linear',
          }}
        >
          {/* 6 Faces of 3D Wireframe Cube */}
          {[
            { transform: 'translateZ(35px)', border: '#00FF88' },
            { transform: 'rotateY(180deg) translateZ(35px)', border: '#00E676' },
            { transform: 'rotateY(-90deg) translateZ(35px)', border: '#FFDE59' },
            { transform: 'rotateY(90deg) translateZ(35px)', border: '#00FF88' },
            { transform: 'rotateX(90deg) translateZ(35px)', border: '#00E676' },
            { transform: 'rotateX(-90deg) translateZ(35px)', border: '#FFDE59' },
          ].map((face, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 70,
                height: 70,
                border: `2px solid ${face.border}`,
                background: 'rgba(0, 255, 136, 0.05)',
                boxShadow: 'inset 0 0 12px rgba(0, 255, 136, 0.15)',
                transform: face.transform,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--mono)',
                fontSize: '0.5rem',
                color: '#A7F3D0',
                fontWeight: 700,
              }}
            >
              F{i + 1}
            </div>
          ))}

          {/* Inner Quantum Core */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              width: 30,
              height: 30,
              background: isHealActive ? '#FF3B30' : '#00FF88',
              borderRadius: '50%',
              filter: 'blur(8px)',
              opacity: 0.7,
              animation: 'pulseGlow 1.5s infinite',
            }}
          />
        </div>
      </div>

      {/* Bottom Telemetry Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          zIndex: 2,
          borderTop: '1px solid #1E293B',
          paddingTop: 8,
        }}
      >
        <div>
          <div style={{ fontSize: '0.55rem', color: '#718096', fontFamily: 'var(--mono)' }}>Collector</div>
          <div style={{ fontSize: '0.68rem', color: '#00FF88', fontFamily: 'var(--mono)', fontWeight: 800 }}>c_wemakedevs</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: '#718096', fontFamily: 'var(--mono)' }}>Baseline SHA</div>
          <div style={{ fontSize: '0.68rem', color: '#FFDE59', fontFamily: 'var(--mono)', fontWeight: 800 }}>8a9f3b12</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: '#718096', fontFamily: 'var(--mono)' }}>Noise Gate</div>
          <div style={{ fontSize: '0.68rem', color: '#A7F3D0', fontFamily: 'var(--mono)', fontWeight: 800 }}>0.00% FP</div>
        </div>
      </div>

      {/* Keyframe Style Tag for Cube Rotation */}
      <style jsx>{`
        @keyframes rotateCube {
          from {
            transform: rotateX(15deg) rotateY(0deg);
          }
          to {
            transform: rotateX(15deg) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
}
