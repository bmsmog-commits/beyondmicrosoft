// Phase 5 — "Start a Project" inquiry (lazy-loaded inside the BMS AI panel).
// Opened only from the Project Brief's "Start a Project" button. Steps:
// contact details → review (edit, consent) → submitted. The project details
// are a copy of the brief: edits here apply to the inquiry only. State lives
// in BMSAI.jsx (in memory), so it survives switching views and failed submits.
import { useEffect, useId, useRef, useState } from 'react';
import { CONSENT_TEXT, CONTACT_METHODS, CONTACT_LIMITS, normaliseContact, validateContact } from '../../ai/inquiry';
import { BriefEditor, getPath } from './ProjectBrief.jsx';
import './ProjectBrief.css';

const CONTACT_FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', autoComplete: 'name', required: true, max: CONTACT_LIMITS.nameMax },
  { key: 'email', label: 'Email address', type: 'email', autoComplete: 'email', required: true, max: CONTACT_LIMITS.emailMax },
  { key: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', required: false, max: CONTACT_LIMITS.phoneMax, hint: 'Optional. Include your country code.' },
];

// Review rows: [label, brief path, kind]. Timeline and budget are always shown.
const PROJECT_ROWS = [
  ['Project', 'project.title'],
  ['Project type', 'project.type', 'derived'],
  ['Business', 'business.type'],
  ['Business name', 'business.name'],
  ['Business description', 'business.description'],
  ['Project description', 'project.description'],
  ['Problem', 'problem'],
  ['Objectives', 'objectives'],
  ['Target audience', 'targetAudience'],
  ['Requirements', 'requirements.confirmed'],
  ['Potential requirements', 'requirements.potential', 'clarify'],
  ['Relevant BMS services', 'services', 'derived'],
  ['Current systems', 'existingSystems'],
  ['Technology', 'preferredTechnology'],
  ['Integrations', 'integrations'],
  ['Constraints', 'constraints'],
  ['Desired timeline', 'timeline', 'always'],
  ['Budget', 'budget', 'always'],
  ['Related BMS projects', 'relatedProjects', 'derived'],
  ['Still to clarify', 'unansweredQuestions', 'clarify'],
  ['Additional notes', 'notes'],
];

const SERVER_FIELD_MESSAGES = {
  name: 'Please enter your full name.',
  email: 'Please enter a valid email address.',
  phone: 'Please enter a valid phone number, including the country code.',
  preferredContactMethod: 'Please choose email, phone or WhatsApp.',
  consent: 'Please confirm the statement above to submit your inquiry.',
};

const methodLabel = (id) => CONTACT_METHODS.find((method) => method.id === id)?.label || 'Email';

function displayValue(brief, path) {
  const value = getPath(brief, path);
  if (path === 'services') return value.map((entry) => (entry.focusArea ? `${entry.serviceName} · ${entry.focusArea}` : entry.serviceName));
  if (path === 'relatedProjects') return value.map((project) => `${project.title} (${project.category}, ${project.status})`);
  return value;
}

function Tag({ kind }) {
  if (kind === 'edited') return <span className="bms-brief-tag is-edited">Edited by you</span>;
  if (kind === 'clarify') return <span className="bms-brief-tag is-clarify">To clarify</span>;
  if (kind === 'ai') return <span className="bms-brief-tag">AI summary</span>;
  return null;
}

function ReviewRow({ label, value, tag }) {
  const items = Array.isArray(value) ? value : null;
  const missing = items ? !items.length : !value;
  return (
    <div>
      <dt>
        {label}
        {!missing && <Tag kind={tag} />}
      </dt>
      <dd className={missing ? 'is-missing' : ''}>
        {missing ? 'Not provided' : items ? items.length === 1 ? items[0] : (
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : value}
      </dd>
    </div>
  );
}

export default function ProjectInquiry({ inquiry, onChange, onSubmit, onBack, onExplore }) {
  const { step, contact, draft, status } = inquiry;
  const [errors, setErrors] = useState({});
  const [editingProject, setEditingProject] = useState(false);
  const headingRef = useRef(null);
  const fieldRefs = useRef({});
  const id = useId();
  const submitting = status === 'submitting';

  // Announce each step by moving focus to its heading.
  useEffect(() => {
    if (!editingProject) headingRef.current?.focus();
  }, [step, editingProject]);

  // Server-side validation errors come back through the shared state.
  useEffect(() => {
    if (!inquiry.serverFields?.length) return;
    const next = Object.fromEntries(inquiry.serverFields.filter((field) => SERVER_FIELD_MESSAGES[field]).map((field) => [field, SERVER_FIELD_MESSAGES[field]]));
    setErrors(next);
    const contactError = CONTACT_FIELDS.find((field) => next[field.key]);
    if (contactError) onChange({ step: 'details' });
  }, [inquiry.serverFields, onChange]);

  const setContact = (key, value) => {
    onChange({ contact: { ...contact, [key]: value } });
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const continueToReview = (event) => {
    event.preventDefault();
    const normalised = normaliseContact(contact);
    const found = validateContact(normalised);
    setErrors(found);
    const first = CONTACT_FIELDS.find((field) => found[field.key]);
    if (first) {
      fieldRefs.current[first.key]?.focus();
      return;
    }
    if (found.preferredContactMethod) return;
    onChange({ contact: { ...normalised, website: contact.website }, step: 'review' });
  };

  const submit = (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!inquiry.consent) {
      setErrors({ consent: SERVER_FIELD_MESSAGES.consent });
      fieldRefs.current.consent?.focus();
      return;
    }
    setErrors({});
    onSubmit();
  };

  const fieldError = (key) =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} className="bms-brief-error">
        {errors[key]}
      </p>
    ) : null;

  if (editingProject) {
    return (
      <BriefEditor
        brief={draft}
        title="Edit project details"
        hint="Changes here apply to this inquiry only; your project brief stays as it was. For lists, put one item per line."
        submitLabel="Save Details"
        onSave={(next) => {
          onChange({ draft: next });
          setEditingProject(false);
        }}
        onCancel={() => setEditingProject(false)}
      />
    );
  }

  const heading = (text) => (
    <h3 id={`${id}-title`} ref={headingRef} tabIndex={-1}>
      {text}
    </h3>
  );

  if (step === 'submitted') {
    return (
      <div className="bms-brief" role="region" aria-labelledby={`${id}-title`}>
        <header className="bms-brief-head">
          <span className="bms-brief-eyebrow">Start a project</span>
          {heading('Project inquiry received.')}
        </header>
        <p>
          Thank you for sharing the details of your project. Beyond Microsoft will review the information and follow up using your
          preferred contact method ({methodLabel(contact.preferredContactMethod)}).
        </p>
        <p>You can also continue exploring the BMS portfolio while you wait.</p>
        <div className="bms-brief-actions">
          <button type="button" className="bms-ai-action is-primary" onClick={onExplore}>
            Explore the Portfolio
          </button>
          <button type="button" className="bms-ai-action" onClick={onBack}>
            Back to Brief
          </button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="bms-brief" role="region" aria-labelledby={`${id}-title`}>
        <form className="bms-brief-form" onSubmit={continueToReview} noValidate>
          <header className="bms-brief-head">
            <span className="bms-brief-eyebrow">Start a project · Step 1 of 2</span>
            {heading('Your contact details')}
          </header>
          <p className="bms-brief-hint">
            Your project details come from your brief; you can check and edit them on the next step. Nothing is sent until you
            submit. Fields marked * are required.
          </p>
          {/* Honeypot: hidden from people and assistive technology; bots that fill it are ignored server-side. */}
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Leave this field empty</label>
            <input
              id={`${id}-website`}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={contact.website || ''}
              onChange={(event) => setContact('website', event.target.value)}
            />
          </div>
          {CONTACT_FIELDS.map((field) => {
            const describedBy = [field.hint && `${id}-${field.key}-hint`, errors[field.key] && `${id}-${field.key}-error`].filter(Boolean).join(' ');
            return (
              <div key={field.key} className="bms-brief-field">
                <label htmlFor={`${id}-${field.key}`}>
                  {field.label}
                  {field.required && <span aria-hidden="true"> *</span>}
                </label>
                {field.hint && (
                  <p id={`${id}-${field.key}-hint`} className="bms-brief-hint">
                    {field.hint}
                  </p>
                )}
                <input
                  id={`${id}-${field.key}`}
                  ref={(node) => {
                    fieldRefs.current[field.key] = node;
                  }}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  maxLength={field.max}
                  required={field.required}
                  aria-required={field.required || undefined}
                  aria-invalid={errors[field.key] ? true : undefined}
                  aria-describedby={describedBy || undefined}
                  value={contact[field.key] || ''}
                  onChange={(event) => setContact(field.key, event.target.value)}
                />
                {fieldError(field.key)}
              </div>
            );
          })}
          <fieldset className="bms-brief-field bms-brief-choices" aria-describedby={errors.preferredContactMethod ? `${id}-preferredContactMethod-error` : undefined}>
            <legend>Preferred contact method</legend>
            {CONTACT_METHODS.map((method) => (
              <label key={method.id} className="bms-brief-choice">
                <input
                  type="radio"
                  name={`${id}-method`}
                  value={method.id}
                  checked={contact.preferredContactMethod === method.id}
                  onChange={() => setContact('preferredContactMethod', method.id)}
                />
                {method.label}
              </label>
            ))}
            {fieldError('preferredContactMethod')}
          </fieldset>
          <div className="bms-brief-actions">
            <button type="submit" className="bms-ai-action is-primary">
              Continue to Review
            </button>
            <button type="button" className="bms-ai-action" onClick={onBack}>
              Back to Brief
            </button>
          </div>
        </form>
      </div>
    );
  }

  // step === 'review'
  const edited = new Set(draft.visitorEdited || []);
  return (
    <div className="bms-brief" role="region" aria-labelledby={`${id}-title`}>
      <form className="bms-brief-form" onSubmit={submit} noValidate aria-busy={submitting || undefined}>
        <header className="bms-brief-head">
          <span className="bms-brief-eyebrow">Start a project · Step 2 of 2</span>
          {heading('Review your project inquiry')}
        </header>

        <section className="bms-brief-section" aria-labelledby={`${id}-contact`}>
          <h4 id={`${id}-contact`}>Contact</h4>
          <dl className="bms-brief-review">
            <ReviewRow label="Name" value={contact.name} />
            <ReviewRow label="Email" value={contact.email} />
            <ReviewRow label="Phone" value={contact.phone} />
            <ReviewRow label="Preferred contact method" value={methodLabel(contact.preferredContactMethod)} />
          </dl>
          <button type="button" className="bms-ai-action bms-brief-inline-action" onClick={() => onChange({ step: 'details' })} disabled={submitting}>
            Edit contact details
          </button>
        </section>

        <section className="bms-brief-section" aria-labelledby={`${id}-project`}>
          <h4 id={`${id}-project`}>Project</h4>
          <p className="bms-brief-hint">
            <strong>AI summary</strong> marks details BMS AI wrote from your conversation; <strong>To clarify</strong> marks
            suggestions that aren't confirmed. Please check them before submitting.
          </p>
          <dl className="bms-brief-review">
            {PROJECT_ROWS.map(([label, path, kind]) => {
              const value = displayValue(draft, path);
              const empty = Array.isArray(value) ? !value.length : !value;
              if (empty && kind !== 'always') return null;
              const tag = edited.has(path) ? 'edited' : kind === 'clarify' ? 'clarify' : 'ai';
              return <ReviewRow key={path} label={label} value={value} tag={tag} />;
            })}
          </dl>
          <button type="button" className="bms-ai-action bms-brief-inline-action" onClick={() => setEditingProject(true)} disabled={submitting}>
            Edit project details
          </button>
        </section>

        <div className={`bms-brief-consent ${errors.consent ? 'has-error' : ''}`}>
          <input
            id={`${id}-consent`}
            ref={(node) => {
              fieldRefs.current.consent = node;
            }}
            type="checkbox"
            checked={Boolean(inquiry.consent)}
            required
            aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
            disabled={submitting}
            onChange={(event) => {
              onChange({ consent: event.target.checked });
              if (event.target.checked) setErrors((current) => ({ ...current, consent: undefined }));
            }}
          />
          <label htmlFor={`${id}-consent`}>{CONSENT_TEXT}</label>
        </div>
        {fieldError('consent')}

        {status === 'error' && (
          <p className="bms-brief-alert" role="alert">
            {inquiry.errorMessage}
          </p>
        )}

        <p className="bms-brief-note">
          This is a project inquiry, not a quotation or contract. Scope, timeline and pricing are confirmed with Beyond Microsoft.
        </p>

        <div className="bms-brief-actions">
          <button type="submit" className="bms-ai-action is-primary" disabled={submitting} aria-disabled={submitting || undefined}>
            {submitting ? 'Submitting…' : 'Submit Project Inquiry'}
          </button>
          <button type="button" className="bms-ai-action" onClick={onBack} disabled={submitting}>
            Back to Brief
          </button>
        </div>
        <p className="visually-hidden" role="status">
          {submitting ? 'Submitting your project inquiry…' : ''}
        </p>
      </form>
    </div>
  );
}
