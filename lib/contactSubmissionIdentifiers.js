function normalizeIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const CONTACT_IDENTIFIER_SET = new Set([
  "contact",
  "contactus",
  "contactform",
  "contactusform",
]);

export function isContactSubmissionIdentifier(value) {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return false;
  return CONTACT_IDENTIFIER_SET.has(normalized);
}

export function isContactSubmissionForm(item) {
  const name = String(item?.name || "").trim();
  const formKey = String(item?.formKey || "").trim();
  return isContactSubmissionIdentifier(name) || isContactSubmissionIdentifier(formKey);
}

export function getContactSubmissionIdentifierCandidates() {
  return ["Contact Us", "contact-us", "contactus", "contact", "contact-form"];
}
