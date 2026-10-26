export const CONTENT_STATUSES = Object.freeze({
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
});

export const CONTENT_STATUS_LIST = Object.freeze([
  CONTENT_STATUSES.DRAFT,
  CONTENT_STATUSES.PENDING_REVIEW,
  CONTENT_STATUSES.CHANGES_REQUESTED,
  CONTENT_STATUSES.APPROVED,
  CONTENT_STATUSES.PUBLISHED,
  CONTENT_STATUSES.REJECTED,
]);

export const CONTENT_STATUS_META = Object.freeze({
  [CONTENT_STATUSES.DRAFT]: {
    key: CONTENT_STATUSES.DRAFT,
    label: "Draft",
    tagColor: "default",
    description: "Content is being created or edited.",
  },
  [CONTENT_STATUSES.PENDING_REVIEW]: {
    key: CONTENT_STATUSES.PENDING_REVIEW,
    label: "Pending Review",
    tagColor: "orange",
    description: "Submitted for Admin approval.",
  },
  [CONTENT_STATUSES.CHANGES_REQUESTED]: {
    key: CONTENT_STATUSES.CHANGES_REQUESTED,
    label: "Changes Requested",
    tagColor: "warning",
    description: "Admin requested modifications before approval.",
  },
  [CONTENT_STATUSES.APPROVED]: {
    key: CONTENT_STATUSES.APPROVED,
    label: "Approved",
    tagColor: "cyan",
    description: "Approved by Admin, ready to be published.",
  },
  [CONTENT_STATUSES.PUBLISHED]: {
    key: CONTENT_STATUSES.PUBLISHED,
    label: "Published",
    tagColor: "green",
    description: "Content is live on public website.",
  },
  [CONTENT_STATUSES.REJECTED]: {
    key: CONTENT_STATUSES.REJECTED,
    label: "Rejected",
    tagColor: "error",
    description: "Submission has been rejected by Admin.",
  },
});

export function isValidContentStatus(status) {
  return CONTENT_STATUS_LIST.includes(String(status || "").toLowerCase());
}

export function getContentStatusMeta(status) {
  const key = String(status || "").toLowerCase();
  return CONTENT_STATUS_META[key] || {
    key,
    label: key || "Unknown",
    tagColor: "default",
    description: "",
  };
}
