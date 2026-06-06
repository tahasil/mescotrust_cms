import { FORM_STATUSES } from "@/lib/forms/constants";

const TRANSITIONS = {
  publish: {
    allowedFrom: [FORM_STATUSES.DRAFT],
    to: FORM_STATUSES.PUBLISHED,
  },
  unpublish: {
    allowedFrom: [FORM_STATUSES.PUBLISHED, FORM_STATUSES.ARCHIVED],
    to: FORM_STATUSES.DRAFT,
  },
  archive: {
    allowedFrom: [FORM_STATUSES.DRAFT, FORM_STATUSES.PUBLISHED],
    to: FORM_STATUSES.ARCHIVED,
  },
};

export function validateLifecycleAction(currentStatus, action) {
  const rule = TRANSITIONS[action];
  if (!rule) {
    return { ok: false, error: `Unknown lifecycle action "${action}"` };
  }
  if (!rule.allowedFrom.includes(currentStatus)) {
    return {
      ok: false,
      error: `Cannot ${action} form from status "${currentStatus}"`,
    };
  }
  return { ok: true, nextStatus: rule.to };
}

