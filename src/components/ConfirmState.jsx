import React, { useRef, useCallback } from 'react';

export default function ConfirmState({
  command = '',
  task = '',
  toolType = '',
  toolLabel = '',
  expanded = false,
  onExpandedChange,
}) {
  const leaveTimer = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    onExpandedChange(true);
  }, [onExpandedChange]);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      onExpandedChange(false);
    }, 200);
  }, [onExpandedChange]);

  const handleConfirm = () => {
    onExpandedChange(false);
    if (window.agentState) window.agentState.confirmAction();
  };

  const handleIgnore = () => {
    onExpandedChange(false);
    if (window.agentState) window.agentState.ignoreAction();
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 紧凑态胶囊栏 — 44px */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '0 18px',
        height: 44,
        WebkitAppRegion: 'no-drag',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#ff7a3a',
          boxShadow: '0 0 10px rgba(255,122,58,0.6), 0 0 20px rgba(255,122,58,0.2)',
          animation: 'breathe-warn 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{
          color: '#ffc4a0',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.01em',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          有新的确认请求 — {task || '点击查看详情'}
        </span>
        <span style={{ color: 'rgba(255,180,140,0.35)', fontSize: 10 }}>
          悬停查看 ↓
        </span>
      </div>

      {/* 展开确认面板 — 仅 expanded 时渲染，保证尺寸测量准确 */}
      {expanded && <div style={{
        padding: '12px 18px 16px',
        WebkitAppRegion: 'no-drag',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 380,
      }}>
        {/* 操作类型标签 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,130,60,0.15)',
            color: '#ff8c50',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 8,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            border: '0.5px solid rgba(255,130,60,0.25)',
          }}>
            {toolType || '确认操作'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>
            {toolLabel || ''}
          </span>
        </div>

        {/* 操作摘要 */}
        <div style={{
          color: '#ffc4a0',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 10,
          lineHeight: 1.5,
        }}>
          {task || 'Claude 需要您的确认'}
        </div>

        {/* 详细内容展示区 — 可滚动 */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 10,
          padding: '10px 14px',
          fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
          fontSize: 11,
          lineHeight: 1.6,
          color: '#e0c0a0',
          border: '0.5px solid rgba(255,130,60,0.15)',
          marginBottom: 14,
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          maxHeight: 220,
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          {command || '等待中...'}
        </div>

        {/* 操作说明 + Yes / No 按钮 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{
            color: 'rgba(255,255,255,0.18)',
            fontSize: 9,
            flex: 1,
          }}>
            选择 Yes 将执行操作，选择 No 将取消本次操作
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
            style={{
              background: 'rgba(255,130,60,0.2)',
              color: '#ff8c50',
              padding: '7px 28px',
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.02em',
              border: '0.5px solid rgba(255,130,60,0.35)',
              cursor: 'pointer',
              outline: 'none',
              WebkitAppRegion: 'no-drag',
            }}
          >
            Yes 同意执行
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleIgnore(); }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.35)',
              padding: '7px 28px',
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 500,
              border: '0.5px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              outline: 'none',
              WebkitAppRegion: 'no-drag',
            }}
          >
            No 取消操作
          </button>
        </div>
      </div>}
    </div>
  );
}
