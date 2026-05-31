import React from 'react';

export default function IdleState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      fontSize: 11,
      color: 'rgba(180,200,230,0.6)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      <div style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: 'rgba(100,180,240,0.5)',
        boxShadow: '0 0 6px rgba(100,180,240,0.3)',
      }} />
      <span>待命中</span>
      <div style={{
        width: 1,
        height: 10,
        background: 'rgba(255,255,255,0.06)',
      }} />
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, textTransform: 'none' }}>
        Claude Code
      </span>
    </div>
  );
}
