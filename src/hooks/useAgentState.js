import { useState, useEffect, useCallback } from 'react';

const DEFAULT_STATE = { status: 'idle', task: '', elapsed: '00:00', command: '', timestamp: 0 };

export function useAgentState() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!window.agentState) return;

    const handler = (newState) => {
      setAnimating(true);
      setState(newState);
      setTimeout(() => setAnimating(false), 400);
    };

    window.agentState.onStateChange(handler);
    return () => { try { window.agentState?.removeListener(); } catch {} };
  }, []);

  const transition = useCallback((newStatus, extra = {}) => {
    setAnimating(true);
    setState((prev) => ({ ...prev, status: newStatus, ...extra, timestamp: Date.now() }));
    setTimeout(() => setAnimating(false), 400);
  }, []);

  return { state, animating, transition };
}
