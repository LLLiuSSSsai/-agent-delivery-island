import React, { useState, useEffect } from 'react';
import { useAgentState } from './hooks/useAgentState';
import { useSpeech } from './hooks/useSpeech';
import IslandBar from './components/IslandBar';
import IdleState from './components/IdleState';
import DeliveringState from './components/DeliveringState';
import ConfirmState from './components/ConfirmState';
import CompleteState from './components/CompleteState';

export default function App() {
  const { state, animating, transition } = useAgentState();
  const [expanded, setExpanded] = useState(false);
  useSpeech(state.status);

  useEffect(() => {
    if (state.status === 'complete') {
      const timer = setTimeout(() => transition('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.status, transition]);

  // 切换状态时重置展开
  useEffect(() => {
    setExpanded(false);
  }, [state.status]);

  const renderState = () => {
    switch (state.status) {
      case 'delivering':
        return <DeliveringState task={state.task} elapsed={state.elapsed} />;
      case 'confirm':
        return <ConfirmState
          command={state.command}
          task={state.task}
          toolType={state.toolType}
          toolLabel={state.toolLabel}
          onExpandedChange={setExpanded}
        />;
      case 'complete':
        return <CompleteState />;
      default:
        return <IdleState />;
    }
  };

  return (
    <IslandBar status={state.status} animating={animating} expanded={expanded}>
      {renderState()}
    </IslandBar>
  );
}
