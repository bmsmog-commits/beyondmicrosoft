import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { personal } from '../../data/content';
import { AI_ACTIONS } from '../../ai/actions';
import { portfolioRecordById } from '../../ai/portfolio';
import { AI_EVENTS, trackAIEvent } from './analytics';
import { DISCOVERY_ERROR, FRIENDLY_ERROR, MAX_MESSAGE_CHARS, sendChatMessage } from './chatService';
import { buildContactMessage, publishHandoff } from './handoff';
import RichText from './RichText';
import './BMSAI.css';

const STORAGE_KEY = 'bms-ai-conversation';
const MOBILE_QUERY = '(max-width: 640px)';

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm BMS AI 👋\n\nI'm the AI assistant for Beyond Microsoft.\n\nI can help you explore our services, portfolio, AI automation solutions, and how to start a project.\n\nWhat would you like to explore?",
  actions: [],
};

const SUGGESTED_PROMPTS = [
  'Explore BMS services',
  'Show me your portfolio',
  'Tell me about AI automation',
  'I want to start a project',
  'Who is Gabriel?',
  'Help me find the right service',
];

// Discovery stages (set by the server) at which relevant services have been named.
const MAPPED_STAGES = new Set(['mapping', 'summary', 'ready']);

const isDiscoveryActive = (discovery) => Boolean(discovery && discovery.stage && discovery.stage !== 'none');

/** The assistant's most recent project-discovery notes in a conversation. */
function latestDiscoveryIn(conversation) {
  for (let i = conversation.length - 1; i >= 0; i -= 1) {
    if (conversation[i].role === 'assistant' && conversation[i].discovery) return conversation[i].discovery;
  }
  return null;
}

const statusClass = (status) => `status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

/** Project card thumbnail with the site's own text fallback (as in AssetImage). */
function ProjectThumb({ src, title }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="bms-ai-project-thumb asset-fallback" aria-hidden="true">
        <span>{title.slice(0, 2)}</span>
      </div>
    );
  }
  return <img className="bms-ai-project-thumb" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

const serviceLabel = (entry) =>
  entry.focusArea && entry.focusArea !== entry.serviceName ? `${entry.serviceName} · ${entry.focusArea}` : entry.serviceName;

const PORTFOLIO_ACTION_IDS = new Set(
  Object.entries(AI_ACTIONS)
    .filter(([, action]) => action.section === 'work' || action.section === 'ai-lab' || action.section === 'copywriting')
    .map(([id]) => id),
);

// Per-tab convenience only: the conversation survives a reload but is never
// sent anywhere except to the BMS AI endpoint, and it is fine if it's lost.
function loadConversation() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length && saved[0]?.id === 'welcome') {
      // Drop a trailing question that never got an answer (reload mid-request).
      return saved[saved.length - 1].role === 'user' ? saved.slice(0, -1) : saved;
    }
  } catch {
    // Storage unavailable or corrupted — start fresh.
  }
  return [WELCOME];
}

function saveConversation(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

const isMobile = () => typeof window !== 'undefined' && window.matchMedia?.(MOBILE_QUERY).matches;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function Glyph({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}

const CLOSE_GLYPH = <path d="M6 6l12 12M18 6 6 18" />;
const RESET_GLYPH = <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />;
const SEND_GLYPH = <path d="M5 12h13M13 6l6 6-6 6" />;

function BMSAI({ open, onClose, onAction }) {
  const [messages, setMessages] = useState(loadConversation);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const requestRef = useRef(null);
  const inputId = useId();
  const hintId = useId();

  const hasUserMessages = messages.some((message) => message.role === 'user');
  const discovery = latestDiscoveryIn(messages);
  const lastAssistantId = [...messages].reverse().find((message) => message.role === 'assistant')?.id;

  useEffect(() => saveConversation(messages), [messages]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Full-screen on phones: stop the page behind from scrolling.
  useEffect(() => {
    if (!open || !isMobile()) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, status, open]);

  // Abort any in-flight request if the panel unmounts.
  useEffect(() => () => requestRef.current?.abort(), []);

  // Auto-grow the textarea up to its CSS max-height.
  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [input]);

  const requestReply = useCallback(async (conversation) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('loading');
    setErrorMessage('');
    const previousDiscovery = latestDiscoveryIn(conversation);
    // Projects shown in the previous reply, for follow-up questions about them.
    const previousAssistant = [...conversation].reverse().find((message) => message.role === 'assistant');
    const projectContext = (previousAssistant?.projects || []).map((project) => project.id);
    try {
      const result = await sendChatMessage(conversation, { signal: controller.signal, discovery: previousDiscovery, projectContext });
      if (controller.signal.aborted) return;
      const actions = result.actions.filter((id) => AI_ACTIONS[id]);
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: 'assistant',
          content: result.reply,
          actions,
          suggestedService: result.suggestedService,
          projects: result.projects,
          quickReplies: result.quickReplies,
          discovery: result.discovery,
        },
      ]);
      setStatus('idle');
      if (isDiscoveryActive(result.discovery) && !isDiscoveryActive(previousDiscovery)) {
        trackAIEvent(AI_EVENTS.DISCOVERY_STARTED);
      }
      const serviceIds = (result.discovery?.relevantServices || []).map((entry) => entry.service);
      const previousIds = (previousDiscovery?.relevantServices || []).map((entry) => entry.service);
      if (serviceIds.length && serviceIds.join() !== previousIds.join()) {
        trackAIEvent(AI_EVENTS.SERVICE_INQUIRY, { services: serviceIds });
      }
      if (actions.some((id) => PORTFOLIO_ACTION_IDS.has(id)) || result.projects.length) {
        trackAIEvent(AI_EVENTS.PORTFOLIO_INQUIRY, {
          actions: actions.filter((id) => PORTFOLIO_ACTION_IDS.has(id)),
          projects: result.projects.map((project) => project.id),
        });
      }
    } catch (error) {
      if (controller.signal.aborted || error?.kind === 'aborted') return;
      setStatus('error');
      // Validation and rate-limit messages are specific; anything else gets the
      // discovery-specific wording when the visitor is mid project discussion.
      const specific = error?.kind === 'rate_limited' || error?.kind === 'invalid';
      setErrorMessage(specific ? error.message : isDiscoveryActive(previousDiscovery) ? DISCOVERY_ERROR : FRIENDLY_ERROR);
      trackAIEvent(AI_EVENTS.ERROR, { kind: error?.kind || 'unknown' });
    }
  }, []);

  const send = (text, { source = 'typed' } = {}) => {
    const content = text.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!content || status === 'loading') return;
    const userMessage = { id: newId(), role: 'user', content };
    // If the previous message never got a reply (after an error), replace it
    // so the conversation keeps strict user/assistant alternation.
    const base = messages[messages.length - 1]?.role === 'user' ? messages.slice(0, -1) : messages;
    const conversation = [...base, userMessage];
    if (!hasUserMessages) trackAIEvent(AI_EVENTS.FIRST_MESSAGE, { source });
    trackAIEvent(AI_EVENTS.MESSAGE_SENT, { source });
    setMessages(conversation);
    setInput('');
    requestReply(conversation);
  };

  const retry = () => {
    if (messages[messages.length - 1]?.role === 'user') requestReply(messages);
  };

  const reset = () => {
    requestRef.current?.abort();
    setMessages([WELCOME]);
    setStatus('idle');
    setErrorMessage('');
    setInput('');
    inputRef.current?.focus();
  };

  const handleAction = (id, message) => {
    const action = AI_ACTIONS[id];
    if (!action) return;
    const suggestedService = message?.suggestedService || null;
    let contactMessage = '';
    trackAIEvent(AI_EVENTS.ACTION_CLICKED, { action: id });
    if (id === 'start-project') {
      trackAIEvent(AI_EVENTS.START_PROJECT_CLICKED, { service: suggestedService });
      // Carry what the visitor told BMS AI into the existing contact form (pre-fill only).
      contactMessage = buildContactMessage(discovery);
      if (isDiscoveryActive(discovery)) {
        publishHandoff(discovery);
        trackAIEvent(AI_EVENTS.PROJECT_HANDOFF, {
          services: discovery.relevantServices.map((entry) => entry.service),
          prefilled: Boolean(contactMessage),
        });
      }
    }
    if (action.section) {
      onAction?.(action, { suggestedService, contactMessage });
      // On phones the panel covers the page, so get out of the way.
      if (isMobile()) onClose({ restoreFocus: false });
    }
  };

  // Opens the project in the site's existing project modal (same as clicking its portfolio card).
  const viewProject = (id) => {
    const record = portfolioRecordById(id);
    if (!record) return;
    trackAIEvent(AI_EVENTS.PROJECT_VIEWED, { project: id });
    onAction?.({ project: record.source }, {});
    // On phones the panel covers the page (and the modal), so get out of the way.
    if (isMobile()) onClose({ restoreFocus: false });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      // A site overlay opened from the chat (e.g. a project modal) closes first,
      // via the site's own Escape handler; only then does Escape close the chat.
      if (document.querySelector('.modal-backdrop, .search-overlay, .mobile-nav-overlay')) return;
      event.stopPropagation();
      onClose();
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(input);
    }
  };

  const remaining = MAX_MESSAGE_CHARS - input.length;

  return (
    <section
      id="bms-ai-panel"
      className="bms-ai-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="bms-ai-title"
      aria-describedby="bms-ai-subtitle"
      hidden={!open}
      onKeyDown={handleKeyDown}
    >
      <header className="bms-ai-header">
        <img className="bms-ai-logo" src={personal.logo} alt="" width="36" height="36" />
        <div className="bms-ai-heading">
          <h2 id="bms-ai-title">BMS AI</h2>
          <p id="bms-ai-subtitle">{isDiscoveryActive(discovery) ? 'Exploring your project' : `Your ${personal.brand} guide`}</p>
        </div>
        <button
          type="button"
          className="bms-ai-icon-btn"
          onClick={reset}
          aria-label="Start a new conversation"
          title="New conversation"
          disabled={!hasUserMessages && status === 'idle'}
        >
          <Glyph path={RESET_GLYPH} />
        </button>
        <button type="button" className="bms-ai-icon-btn" onClick={() => onClose()} aria-label="Close BMS AI" title="Close">
          <Glyph path={CLOSE_GLYPH} />
        </button>
      </header>

      <div className="bms-ai-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with BMS AI">
        {messages.map((message) => (
          <div key={message.id} className={`bms-ai-message is-${message.role}`}>
            <span className="visually-hidden">{message.role === 'user' ? 'You said:' : 'BMS AI said:'}</span>
            <div className="bms-ai-bubble">
              {message.role === 'assistant' ? <RichText text={message.content} /> : <p>{message.content}</p>}
            </div>
            {message.projects?.length > 0 && (
              <ul className="bms-ai-projects" aria-label="Portfolio projects">
                {message.projects.map((project) => {
                  const openable = Boolean(portfolioRecordById(project.id));
                  return (
                    <li key={project.id} className="bms-ai-project">
                      <ProjectThumb src={project.image} title={project.title} />
                      <div className="bms-ai-project-body">
                        <span className="project-category">{project.category}</span>
                        <h3>{project.title}</h3>
                        <span className={`project-status ${statusClass(project.status)}`}>{project.status}</span>
                        {project.summary && <p>{project.summary}</p>}
                        {project.reason && <p className="bms-ai-project-reason">{project.reason}</p>}
                        {(openable || (project.labCaseStudy && AI_ACTIONS['view-ai-lab'])) && (
                          <div className="bms-ai-project-actions">
                            {openable && (
                              <button
                                type="button"
                                className="bms-ai-action is-primary"
                                onClick={() => viewProject(project.id)}
                                aria-label={`View project: ${project.title}`}
                              >
                                View Project
                              </button>
                            )}
                            {project.labCaseStudy && AI_ACTIONS['view-ai-lab'] && (
                              <button
                                type="button"
                                className="bms-ai-action"
                                onClick={() => handleAction('view-ai-lab', message)}
                                aria-label={`AI & Automation Lab case study: ${project.title}`}
                              >
                                Lab Case Study
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {message.actions?.length > 0 && (
              <div className="bms-ai-actions" role="group" aria-label="Suggested next steps">
                {message.actions.map((id) => {
                  const action = AI_ACTIONS[id];
                  if (!action) return null;
                  const className = `bms-ai-action ${action.primary ? 'is-primary' : ''}`;
                  return action.href ? (
                    <a
                      key={id}
                      className={className}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noopener noreferrer' : undefined}
                      onClick={() => handleAction(id, message)}
                    >
                      {action.label}
                    </a>
                  ) : (
                    <button key={id} type="button" className={className} onClick={() => handleAction(id, message)}>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
            {message.id === lastAssistantId && MAPPED_STAGES.has(message.discovery?.stage) && message.discovery.relevantServices?.length > 0 && (
              <div className="bms-ai-services">
                <span className="bms-ai-services-label" id={`${message.id}-services`}>
                  Service areas discussed
                </span>
                <ul aria-labelledby={`${message.id}-services`}>
                  {message.discovery.relevantServices.map((entry) => (
                    <li key={`${entry.service}-${entry.focusArea}`}>{serviceLabel(entry)}</li>
                  ))}
                </ul>
              </div>
            )}
            {message.id === lastAssistantId && status === 'idle' && message.quickReplies?.length > 0 && (
              <div className="bms-ai-quick-replies" role="group" aria-label="Quick replies">
                {message.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    className="bms-ai-quick-reply"
                    onClick={() => {
                      trackAIEvent(AI_EVENTS.QUICK_REPLY_CLICKED);
                      send(reply, { source: 'quick-reply' });
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {!hasUserMessages && (
          <div className="bms-ai-suggestions" role="group" aria-label="Suggested questions">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="bms-ai-suggestion"
                onClick={() => {
                  trackAIEvent(AI_EVENTS.SUGGESTED_PROMPT_CLICKED, { prompt });
                  send(prompt, { source: 'suggestion' });
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && (
          <div className="bms-ai-message is-assistant" role="status">
            <div className="bms-ai-bubble bms-ai-typing">
              <span className="visually-hidden">BMS AI is typing</span>
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bms-ai-error" role="alert">
            <p>{errorMessage}</p>
            <div className="bms-ai-actions">
              <button type="button" className="bms-ai-action is-primary" onClick={retry}>
                Try again
              </button>
              {AI_ACTIONS['contact-email'] && (
                <a className="bms-ai-action" href={AI_ACTIONS['contact-email'].href}>
                  {AI_ACTIONS['contact-email'].label}
                </a>
              )}
              {AI_ACTIONS['contact-whatsapp'] && (
                <a className="bms-ai-action" href={AI_ACTIONS['contact-whatsapp'].href} target="_blank" rel="noopener noreferrer">
                  {AI_ACTIONS['contact-whatsapp'].label}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <form
        className="bms-ai-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          Message BMS AI
        </label>
        <textarea
          id={inputId}
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={MAX_MESSAGE_CHARS}
          placeholder="Ask about services, work or your project..."
          aria-describedby={hintId}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button type="submit" className="bms-ai-send" aria-label="Send message" disabled={!input.trim() || status === 'loading'}>
          <Glyph path={SEND_GLYPH} />
        </button>
      </form>
      <p id={hintId} className="bms-ai-note">
        {remaining <= 100 ? `${remaining} characters left. ` : ''}
        BMS AI can make mistakes. For project details, contact {personal.brand} directly.
      </p>
    </section>
  );
}

export default BMSAI;
