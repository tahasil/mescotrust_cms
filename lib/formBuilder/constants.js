export const FORM_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const FORM_STATUSES = Object.values(FORM_STATUS);

export const FORM_COUNTER_KEY = "form_builder";

export const FORM_ID_PREFIX = "FORM_";

export const FORM_FIELD_TYPE = {
  TEXT: "text",
  EMAIL: "email",
  NUMBER: "number",
  MOBILE: "mobile",
  PASSWORD: "password",
  TEXTAREA: "textarea",
  SELECT: "select",
  RADIO_GROUP: "radio_group",
  CHECKBOX_GROUP: "checkbox_group",
  DATE: "date",
  FILE: "file",
  URL: "url",
  HIDDEN: "hidden",
  SECTION_HEADING: "section_heading",
  DIVIDER: "divider",
};

export const FORM_FIELD_TYPES = Object.values(FORM_FIELD_TYPE);

export const NON_DATA_FIELD_TYPES = new Set([
  FORM_FIELD_TYPE.SECTION_HEADING,
  FORM_FIELD_TYPE.DIVIDER,
]);

export const OPTION_FIELD_TYPES = new Set([
  FORM_FIELD_TYPE.SELECT,
  FORM_FIELD_TYPE.RADIO_GROUP,
  FORM_FIELD_TYPE.CHECKBOX_GROUP,
]);

export const FILE_FIELD_TYPES = new Set([FORM_FIELD_TYPE.FILE]);

