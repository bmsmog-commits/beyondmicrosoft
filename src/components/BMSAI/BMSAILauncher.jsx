import { Component, Suspense, lazy, useCallback, useRef, useState } from 'react';
import { AI_EVENTS, trackAIEvent } from './analytics';
import './BMSAILauncher.css';

// The chat panel (and its CSS) is a separate chunk, fetched only when a
// visitor shows interest (hover/focus) or opens the assistant, so it adds
// nothing to the site's initial load.
const loadPanel = () => import('./BMSAI.jsx');
const BMSAIPanel = lazy(loadPanel);

// If the chat chunk fails to load or the panel throws, the assistant quietly
// disappears — the rest of the website is unaffected.
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    trackAIEvent(AI_EVENTS.ERROR, { kind: 'render' });
    console.error('[BMS AI] disabled after an error:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </svg>
  );
}

/**
 * Floating BMS AI entry point.
 * @param {{ onAction: (action: object, context: { suggestedService: string | null }) => void }} props
 *   `onAction` performs in-site navigation for an action from src/ai/actions.js.
 */
function BMSAILauncher({ onAction }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const launcherRef = useRef(null);

  const openPanel = () => {
    setMounted(true);
    setOpen(true);
    trackAIEvent(AI_EVENTS.OPENED);
  };

  const closePanel = useCallback(({ restoreFocus = true } = {}) => {
    setOpen(false);
    trackAIEvent(AI_EVENTS.CLOSED);
    if (restoreFocus) launcherRef.current?.focus();
  }, []);

  return (
    <AIErrorBoundary>
      <button
        ref={launcherRef}
        type="button"
        className={`bms-ai-launcher ${open ? 'is-open' : ''}`}
        aria-label={open ? 'Close BMS AI assistant' : 'Open BMS AI assistant'}
        aria-expanded={open}
        aria-controls={mounted ? 'bms-ai-panel' : undefined}
        onClick={() => (open ? closePanel() : openPanel())}
        onMouseEnter={loadPanel}
        onFocus={loadPanel}
      >
        <SparkIcon />
        <span>BMS AI</span>
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <BMSAIPanel open={open} onClose={closePanel} onAction={onAction} />
        </Suspense>
      )}
    </AIErrorBoundary>
  );
}

export default BMSAILauncher;
