import { CONTENT_STATUSES, isValidContentStatus } from "./constants.js";
import { isAdmin, isAuthor, isSuperAdmin } from "../permissions.js";
import { ROLE_KEYS, normalizeRoleKey } from "../rbac/constants.js";

export function isContentAdmin(sessionLike) {
  if (!sessionLike) return false;
  const roleKey = normalizeRoleKey(sessionLike.roleKey || sessionLike.role);
  if (roleKey === ROLE_KEYS.SUPER_ADMIN || roleKey === ROLE_KEYS.ADMIN) return true;
  return isSuperAdmin(sessionLike) || isAdmin(sessionLike);
}

export function isContentAuthor(sessionLike) {
  if (!sessionLike) return false;
  const roleKey = normalizeRoleKey(sessionLike.roleKey || sessionLike.role);
  return roleKey === ROLE_KEYS.AUTHOR || isAuthor(sessionLike);
}

export function isContentOwner(doc, sessionLike) {
  if (!doc || !sessionLike) return false;
  const sessionEmail = String(sessionLike.email || "").trim().toLowerCase();
  const sessionUserId = String(sessionLike.id || sessionLike.userId || "").trim();

  const docCreatedBy = String(doc.createdBy || "").trim().toLowerCase();
  const docCreatorId = doc.creatorId ? String(doc.creatorId).trim() : "";

  if (sessionEmail && docCreatedBy && sessionEmail === docCreatedBy) return true;
  if (sessionUserId && docCreatorId && sessionUserId === docCreatorId) return true;
  return false;
}

export function canEditContent(doc, sessionLike) {
  if (!doc || !sessionLike) return false;
  if (isContentAdmin(sessionLike)) return true;

  if (isContentAuthor(sessionLike)) {
    if (!isContentOwner(doc, sessionLike)) return false;
    // Authors can edit draft, changes_requested, rejected, or published (which creates a pending revision)
    if (doc.status === CONTENT_STATUSES.PENDING_REVIEW) {
      return false; // locked while under review
    }
    return true;
  }

  // Editors who are not admin can edit if they have general permissions or ownership
  return isContentOwner(doc, sessionLike);
}

export function canDeleteContent(doc, sessionLike) {
  if (!doc || !sessionLike) return false;
  if (isContentAdmin(sessionLike)) return true;

  if (isContentAuthor(sessionLike)) {
    // Authors can NEVER delete content belonging to Admin or other Authors
    if (!isContentOwner(doc, sessionLike)) return false;
    // Authors can only delete non-published own content (draft / rejected)
    if (doc.status === CONTENT_STATUSES.PUBLISHED) return false;
    return true;
  }

  return false;
}

export function canPublishContent(sessionLike) {
  return isContentAdmin(sessionLike);
}

export function canApproveOrRejectContent(sessionLike) {
  return isContentAdmin(sessionLike);
}

export function appendWorkflowHistory(doc, { action, sessionLike, notes = "" }) {
  if (!doc) return;
  if (!Array.isArray(doc.workflowHistory)) {
    doc.workflowHistory = [];
  }
  doc.workflowHistory.push({
    action,
    performedBy: String(sessionLike?.email || "system"),
    performedByRole: String(sessionLike?.roleKey || sessionLike?.role || "system"),
    timestamp: new Date(),
    notes: String(notes || "").trim(),
  });
}
