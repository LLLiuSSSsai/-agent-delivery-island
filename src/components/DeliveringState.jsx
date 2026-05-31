import React from 'react';

function dotStyle(delay) {
  return {
    width: 1.5,
    height: 3,
    borderRadius: 0.5,
    background: 'rgba(255,255,255,0.2)',
    animation: 'blink 0.8s ease-in-out infinite',
    animationDelay: `${delay}s`,
  };
}

export default function DeliveringState({ task = 'Agent 正在工作中...', elapsed = '00:00' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 18px',
      width: '100%',
      height: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        flexShrink: 0,
      }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#4da6ff',
          boxShadow: '0 0 8px rgba(77,166,255,0.5)',
          animation: 'breathe 2s ease-in-out infinite',
        }} />
        <span style={{
          color: 'rgba(200,220,255,0.85)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          配送中
        </span>
      </div>

      <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      <span style={{
        color: 'rgba(200,220,255,0.5)',
        fontSize: 10,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {task}
      </span>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36,
          height: 1.5,
          borderRadius: 1,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '45%',
            height: '100%',
            borderRadius: 1,
            background: 'linear-gradient(90deg, rgba(77,166,255,0.4), rgba(77,166,255,0.8))',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={dotStyle(0)} />
          <div style={dotStyle(0.15)} />
          <div style={dotStyle(0.3)} />
        </div>
      </div>
    </div>
  );
}
