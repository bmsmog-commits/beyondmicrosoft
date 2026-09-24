// Phase 4 — Project Brief view (lazy-loaded inside the BMS AI panel).
// Shows the brief and lets the visitor correct it. Visitor edits are recorded
// in `visitorEdited`, and the server keeps those values when the brief is
// updated later. "Start a Project" opens the Phase 5 inquiry (ProjectInquiry.jsx),
// which reuses BriefEditor on its own copy of the brief.
import { useEffect, useId, useRef, useState } from 'react';
import './ProjectBrief.css';

const MAX_ITEMS = 10;
const MAX_ITEM_CHARS = 200;

// Editable fields (mirrors the server's EDITABLE_FIELDS; the server validates anyway).
export const FIELDS = [
  { path: 'project.title', label: 'Project title', kind: 'text', max: 120 },
  { path: 'project.description', label: 'Project description', kind: 'textarea', max: 400 },
  { path: 'business.name', label: 'Business name', kind: 'text', max: 120 },
  { path: 'business.type', label: 'Business type', kind: 'text', max: 120 },
  { path: 'business.description', label: 'Business description', kind: 'textarea', max: 400 },
  { path: 'problem', label: 'Problem', kind: 'textarea', max: 400 },
  { path: 'objectives', label: 'Objectives', kind: 'list' },
  { path: 'targetAudience', label: 'Target audience', kind: 'list' },
  { path: 'requirements.confirmed', label: 'Confirmed requirements', kind: 'list' },
  { path: 'requirements.potential', label: 'Potential requirements (to clarify)', kind: 'list' },
  { path: 'existingSystems', label: 'Current systems', kind: 'list' },
  { path: 'integrations', label: 'Integrations mentioned', kind: 'list' },
  { path: 'preferredTechnology', label: 'Preferred technology', kind: 'list' },
  { path: 'constraints', label: 'Constraints', kind: 'list' },
  { path: 'timeline', label: 'Desired timeline', kind: 'text', max: 120 },
  { path: 'budget', label: 'Budget', kind: 'text', max: 120 },
  { path: 'unansweredQuestions', label: 'Still to clarify', kind: 'list' },
  { path: 'notes', label: 'Additional notes', kind: 'list' },
];

export const getPath = (object, path) => path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), object);
const setPath = (object, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((node, key) => node[key], object)[last] = value;
};

const toFormValue = (field, value) => (field.kind === 'list' ? (value || []).join('\n') : value || '');
const fromFormValue = (field, text) => {
  if (field.kind === 'list') {
    return [...new Set(text.split('\n').map((line) => line.trim().slice(0, MAX_ITEM_CHARS)).filter(Boolean))].slice(0, MAX_ITEMS);
  }
  const value = text.replace(/\s+/g, ' ').trim().slice(0, field.max);
  return value || null;
};
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const statusClass = (status) => `status-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;

function Section({ title, edited, children }) {
  return (
    <section className="bms-brief-section">
      <h4>
        {title}
        {edited && <span className="bms-brief-edited">Edited by you</span>}
      </h4>
      {children}
    </section>
  );
}

function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Labelled edit form for a brief. Calls onSave(next, changedPaths) with an
 * updated copy (the input brief is never mutated); changed paths are added to
 * `visitorEdited`.
 */
export function BriefEditor({ brief, title, hint, submitLabel = 'Save Changes', onSave, onCancel }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((field) => [field.path, toFormValue(field, getPath(brief, field.path))])),
  );
  const firstFieldRef = useRef(null);
  const formId = useId();

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const save = (event) => {
    event.preventDefault();
    const next = structuredClone(brief);
    const changed = [];
    FIELDS.forEach((field) => {
      const value = fromFormValue(field, form[field.path] ?? '');
      if (!same(value, getPath(brief, field.path))) {
        setPath(next, field.path, value);
        changed.push(field.path);
      }
    });
    if (!next.project.title) next.project.title = 'Project Brief';
    next.visitorEdited = [...new Set([...(brief.visitorEdited || []), ...changed])];
    next.updatedAt = new Date().toISOString();
    onSave(next, changed);
  };

  return (
    <div className="bms-brief" role="region" aria-labelledby={`${formId}-title`}>
      <form className="bms-brief-form" onSubmit={save} aria-describedby={`${formId}-hint`}>
        <h3 id={`${formId}-title`}>{title}</h3>
        <p id={`${formId}-hint`} className="bms-brief-hint">
          {hint}
        </p>
        {FIELDS.map((field, index) => {
          const id = `${formId}-${field.path.replace('.', '-')}`;
          const common = {
            id,
            value: form[field.path] ?? '',
            onChange: (event) => setForm((current) => ({ ...current, [field.path]: event.target.value })),
            ref: index === 0 ? firstFieldRef : undefined,
          };
          return (
            // Label is a sibling (not a wrapper) so the field's name is just its label, not its content.
            <div key={field.path} className="bms-brief-field">
              <label htmlFor={id}>{field.label}</label>
              {field.kind === 'text' ? (
                <input type="text" maxLength={field.max} {...common} />
              ) : (
                <textarea rows={field.kind === 'list' ? 3 : 2} maxLength={field.kind === 'list' ? 2400 : field.max} {...common} />
              )}
            </div>
          );
        })}
        <div className="bms-brief-actions">
          <button type="submit" className="bms-ai-action is-primary">
            {submitLabel}
          </button>
          <button type="button" className="bms-ai-action" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectBrief({ brief, inquirySubmitted = false, onBack, onSave, onStartProject, onViewProject }) {
  const [editing, setEditing] = useState(false);
  const editButtonRef = useRef(null);
  const headingRef = useRef(null);
  const formId = useId();
  const edited = new Set(brief.visitorEdited || []);

  // Move focus to the brief heading when it opens (screen readers announce it).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const closeEditor = () => {
    setEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  if (editing) {
    return (
      <BriefEditor
        brief={brief}
        title="Edit project brief"
        hint="Correct anything that isn't right. For lists, put one item per line. Your changes are kept when the brief is updated."
        onSave={(next, changed) => {
          onSave(next, changed);
          closeEditor();
        }}
        onCancel={closeEditor}
      />
    );
  }

  const business = [brief.business?.name, brief.business?.type].filter(Boolean).join(' · ');
  const listSection = (title, path) => {
    const items = getPath(brief, path) || [];
    return items.length > 0 ? (
      <Section title={title} edited={edited.has(path)}>
        <List items={items} />
      </Section>
    ) : null;
  };

  return (
    <div className="bms-brief" role="region" aria-labelledby={`${formId}-title`}>
      <header className="bms-brief-head">
        <span className="bms-brief-eyebrow">Project brief</span>
        <h3 id={`${formId}-title`} ref={headingRef} tabIndex={-1}>
          {brief.project?.title || 'Project Brief'}
        </h3>
        {brief.project?.type?.length > 0 && (
          <ul className="bms-brief-types" aria-label="Project type">
            {brief.project.type.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        )}
      </header>

      {(business || brief.business?.description) && (
        <Section title="Business" edited={edited.has('business.name') || edited.has('business.type') || edited.has('business.description')}>
          {business && <p className="bms-brief-strong">{business}</p>}
          {brief.business?.description && <p>{brief.business.description}</p>}
        </Section>
      )}
      {brief.project?.description && (
        <Section title="Project" edited={edited.has('project.description')}>
          <p>{brief.project.description}</p>
        </Section>
      )}
      {brief.problem && (
        <Section title="Problem" edited={edited.has('problem')}>
          <p>{brief.problem}</p>
        </Section>
      )}
      {listSection('Objectives', 'objectives')}
      {listSection('Target audience', 'targetAudience')}
      {listSection('Confirmed requirements', 'requirements.confirmed')}
      {(brief.requirements?.potential || []).length > 0 && (
        <Section title="Potential requirements" edited={edited.has('requirements.potential')}>
          <p className="bms-brief-hint">Suggested by BMS AI from what you described — to clarify, not confirmed.</p>
          <List items={brief.requirements.potential} />
        </Section>
      )}
      {brief.services?.length > 0 && (
        <Section title="Relevant BMS services">
          <ul className="bms-brief-services">
            {brief.services.map((entry) => (
              <li key={`${entry.service}-${entry.focusArea}`}>
                <strong>{entry.focusArea ? `${entry.serviceName} · ${entry.focusArea}` : entry.serviceName}</strong>
                {entry.reason && <span>{entry.reason}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {listSection('Current systems', 'existingSystems')}
      {listSection('Integrations mentioned', 'integrations')}
      {listSection('Preferred technology', 'preferredTechnology')}
      {listSection('Constraints', 'constraints')}
      <Section title="Timeline & budget" edited={edited.has('timeline') || edited.has('budget')}>
        <dl className="bms-brief-facts">
          <div>
            <dt>Desired timeline</dt>
            <dd className={brief.timeline ? '' : 'is-missing'}>{brief.timeline || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd className={brief.budget ? '' : 'is-missing'}>{brief.budget || 'Not provided'}</dd>
          </div>
        </dl>
      </Section>
      {brief.relatedProjects?.length > 0 && (
        <Section title="Related BMS projects">
          <ul className="bms-brief-related">
            {brief.relatedProjects.map((project) => (
              <li key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <span className="project-category">{project.category}</span>
                  <span className={`project-status ${statusClass(project.status)}`}>{project.status}</span>
                  {project.reason && <p>{project.reason}</p>}
                </div>
                <button type="button" className="bms-ai-action" onClick={() => onViewProject(project.id)} aria-label={`View project: ${project.title}`}>
                  View Project
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Still to clarify" edited={edited.has('unansweredQuestions')}>
        {brief.unansweredQuestions?.length ? <List items={brief.unansweredQuestions} /> : <p className="bms-brief-hint">Nothing noted yet.</p>}
      </Section>
      {listSection('Assumptions', 'assumptions')}
      {listSection('Additional notes', 'notes')}

      <p className="bms-brief-note">
        This brief summarizes the information discussed with BMS AI. Final scope, requirements, timeline and pricing should be
        confirmed with Beyond Microsoft.
      </p>

      {inquirySubmitted && (
        <p className="bms-brief-note" role="status">
          You've submitted a project inquiry from this brief. Beyond Microsoft will review it and follow up using your preferred contact method.
        </p>
      )}

      <div className="bms-brief-actions">
        {/* Phase 5: the only way into the inquiry — always an explicit visitor choice. */}
        <button type="button" className="bms-ai-action is-primary" onClick={onStartProject}>
          {inquirySubmitted ? 'View Inquiry' : 'Start a Project'}
        </button>
        <button type="button" className="bms-ai-action" ref={editButtonRef} onClick={() => setEditing(true)}>
          Edit Brief
        </button>
        <button type="button" className="bms-ai-action" onClick={onBack}>
          Continue Discussion
        </button>
      </div>
    </div>
  );
}
