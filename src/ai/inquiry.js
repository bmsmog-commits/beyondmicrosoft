// Phase 5 — project inquiry rules shared by the browser (instant feedback)
// and netlify/functions/bms-lead.mjs (the authority). No secrets here.

export const INQUIRY_SCHEMA_VERSION = 1;

export const CONTACT_METHODS = Object.freeze([
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'whatsapp', label: 'WhatsApp' },
]);
export const CONTACT_METHOD_IDS = Object.freeze(CONTACT_METHODS.map((method) => method.id));

// Shown next to the checkbox and stored with the submission (the server uses
// its own copy, never text sent by the browser). Project contact only — not marketing.
export const CONSENT_TEXT =
  'I confirm that the information above is accurate and I agree that Beyond Microsoft may use these details to contact me about this project inquiry.';

export const CONTACT_LIMITS = Object.freeze({ nameMin: 2, nameMax: 100, emailMax: 254, phoneMax: 30 });

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:".]+(\.[^\s@<>()[\]\\,;:".]+)+$/;
// International-friendly: optional leading +, digits and common separators; 7–15 digits (E.164 maximum).
const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

const clean = (value) => (typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim() : '');

/** Trims contact fields to their normalised form (strings only; anything else becomes empty). */
export function normaliseContact(raw = {}) {
  return {
    name: clean(raw.name),
    email: clean(raw.email).toLowerCase(),
    phone: clean(raw.phone),
    preferredContactMethod: clean(raw.preferredContactMethod) || 'email',
  };
}

/** Returns { field: message } for invalid fields (empty object when valid). */
export function validateContact(contact) {
  const errors = {};
  if (contact.name.length < CONTACT_LIMITS.nameMin || contact.name.length > CONTACT_LIMITS.nameMax) {
    errors.name = contact.name ? `Please enter your full name (${CONTACT_LIMITS.nameMin}–${CONTACT_LIMITS.nameMax} characters).` : 'Please enter your full name.';
  }
  if (!contact.email) errors.email = 'Please enter your email address.';
  else if (contact.email.length > CONTACT_LIMITS.emailMax || !EMAIL_PATTERN.test(contact.email)) {
    errors.email = 'Please enter a valid email address, for example name@example.com.';
  }
  if (!CONTACT_METHOD_IDS.includes(contact.preferredContactMethod)) {
    errors.preferredContactMethod = 'Please choose email, phone or WhatsApp.';
  }
  const digits = contact.phone.replace(/\D/g, '').length;
  if (contact.phone && (contact.phone.length > CONTACT_LIMITS.phoneMax || !PHONE_PATTERN.test(contact.phone) || digits < 7 || digits > 15)) {
    errors.phone = 'Please enter a valid phone number, including the country code (for example +234 801 234 5678).';
  } else if (!contact.phone && contact.preferredContactMethod !== 'email' && !errors.preferredContactMethod) {
    errors.phone = `Please add a phone number so Beyond Microsoft can reach you by ${contact.preferredContactMethod === 'whatsapp' ? 'WhatsApp' : 'phone'}.`;
  }
  return errors;
}
