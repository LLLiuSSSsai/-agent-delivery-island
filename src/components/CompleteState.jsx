import React, { useEffect, useState } from 'react';

export default function CompleteState() {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2500);
    return () => { clearTimeout(t1); };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      height: '100%',
      fontSize: 14,
      color: 'rgba(140,200,180,0.7)',
      letterSpacing: '0.03em',
      animation: leaving ? 'slideOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill="none" stroke="rgba(80,200,140,0.3)" strokeWidth="0.5" />
        <path d="M5 8l2 2 4-4" stroke="rgba(100,220,160,0.6)" strokeWidth="1.2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>订单已完成</span>
      <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        {leaving ? '收起中...' : '3s 后收起'}
      </span>
    </div>
  );
}
