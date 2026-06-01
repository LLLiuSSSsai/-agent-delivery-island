import React, { useEffect } from 'react';

const CONFIG = {
  idle:      { width: 200, height: 34 },
  delivering:{ width: 360, height: 38 },
  confirm:   { width: 500, height: 44 },
  confirmExpanded: { width: 520, height: 420 },
  complete:  { width: 260, height: 38 },
};

const STYLE = {
  idle: {
    background: 'linear-gradient(135deg, rgba(20,30,50,0.85) 0%, rgba(10,15,28,0.9) 100%)',
    border: '0.5px solid rgba(100,140,200,0.15)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  delivering: {
    background: 'linear-gradient(135deg, rgba(20,32,55,0.88) 0%, rgba(8,14,28,0.92) 100%)',
    border: '0.5px solid rgba(80,140,220,0.2)',
    boxShadow: '0 2px 24px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(80,160,240,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  confirm: {
    background: 'linear-gradient(135deg, rgba(30,18,22,0.9) 0%, rgba(15,8,26,0.94) 100%)',
    border: '0.5px solid rgba(255,130,60,0.3)',
    boxShadow: '0 0 30px rgba(255,100,40,0.06), 0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  complete: {
    background: 'linear-gradient(135deg, rgba(20,32,50,0.85) 0%, rgba(10,16,28,0.9) 100%)',
    border: '0.5px solid rgba(80,200,140,0.15)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
};

export default function IslandBar({ status, animating, children, expanded }) {
  const isConfirm = status === 'confirm';
  const cfgKey = (isConfirm && expanded) ? 'confirmExpanded' : status;
  const cfg = CONFIG[cfgKey] || CONFIG.idle;
  const stl = STYLE[isConfirm ? 'confirm' : status] || STYLE.idle;

  useEffect(() => {
    if (window.agentState) {
      window.agentState.resize(cfg.width, cfg.height);
      if (status === 'idle') {
        window.agentState.setIgnoreMouse(true);
        window.agentState.setFocusable(false);
      } else if (isConfirm) {
        window.agentState.setIgnoreMouse(false);
        window.agentState.setFocusable(true);
      } else {
        window.agentState.setIgnoreMouse(false);
        window.agentState.setFocusable(false);
      }
    }
  }, [status, isConfirm, cfg.width, cfg.height]);

  // 紧凑态用 overflow:hidden 裁剪圆角；展开态用 visible 放下拉面板
  const overflow = (isConfirm && expanded) ? 'visible' : 'hidden';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow,
        animation: animating ? 'slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        WebkitAppRegion: 'drag',
        ...stl,
      }}
    >
      {/* 顶部微光渐变线 — 只在胶囊区域 */}
      {!expanded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: 0.5,
          background: isConfirm
            ? 'linear-gradient(90deg, transparent, rgba(255,140,80,0.35), transparent)'
            : status === 'delivering'
              ? 'linear-gradient(90deg, transparent, rgba(80,160,240,0.3), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(100,160,220,0.2), transparent)',
        }} />
      )}
      {children}
    </div>
  );
}
