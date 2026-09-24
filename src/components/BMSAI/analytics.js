// Analytics hooks for BMS AI. No third-party dependency: every event is
// dispatched as a `bms-ai:event` DOM event, so an analytics tool added later
// only needs one listener, e.g.
//
//   window.addEventListener('bms-ai:event', (e) => plausible(e.detail.name, { props: e.detail.props }));
//
// Events carry IDs and labels only — never the visitor's message text.
export const AI_EVENTS = Object.freeze({
  OPENED: 'ai_opened',
  CLOSED: 'ai_closed',
  FIRST_MESSAGE: 'ai_first_message',
  MESSAGE_SENT: 'ai_message_sent',
  SUGGESTED_PROMPT_CLICKED: 'ai_suggested_prompt_clicked',
  QUICK_REPLY_CLICKED: 'ai_quick_reply_clicked',
  DISCOVERY_STARTED: 'ai_discovery_started',
  SERVICE_INQUIRY: 'ai_service_inquiry',
  PROJECT_HANDOFF: 'ai_project_handoff',
  PORTFOLIO_INQUIRY: 'ai_portfolio_inquiry',
  PROJECT_VIEWED: 'ai_project_viewed',
  ACTION_CLICKED: 'ai_action_clicked',
  START_PROJECT_CLICKED: 'ai_start_project_clicked',
  ERROR: 'ai_error',
});

export function trackAIEvent(name, props = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('bms-ai:event', { detail: { name, props, timestamp: Date.now() } }));
    if (import.meta.env.DEV) console.debug('[BMS AI]', name, props);
  } catch {
    // Analytics must never interfere with the chat.
  }
}
