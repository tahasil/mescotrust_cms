import mongoose from "mongoose";
import Counter from "@/models/Counter";
import Form from "@/models/Form";
import FormField from "@/models/FormField";
import FormConfiguration from "@/models/FormConfiguration";
import FormSubmission from "@/models/FormSubmission";
import SubmissionFile from "@/models/SubmissionFile";
import {
  FORM_COUNTER_KEY,
  FORM_STATUS,
  FORM_STATUSES,
} from "@/lib/formBuilder/constants";
import { FormBuilderError } from "@/lib/formBuilder/errors";
import {
  fieldSnapshotFromSchema,
  normalizeFieldSchema,
  normalizeFormConfiguration,
} from "@/lib/formBuilder/schema";
import {
  buildFormIdFromSeq,
  buildFormShortcodes,
  normalizeFormId,
  parseFormShortcode,
} from "@/lib/formBuilder/shortcode";

function isTransactionUnsupported(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("transaction numbers are only allowed") ||
    message.includes("replica set") ||
    message.includes("not supported")
  );
}

async function runWithOptionalTransaction(run) {
  const session = await mongoose.startSession();
  try {
    let output;
    await session.withTransaction(async () => {
      output = await run(session);
    });
    return output;
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    return run(null);
  } finally {
    await session.endSession();
  }
}

function toLean(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === "function") return doc.toObject();
  return doc;
}

function withSession(query, session) {
  return session ? query.session(session) : query;
}

export async function getNextFormId(session = null) {
  const query = Counter.findOneAndUpdate(
    { key: FORM_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const doc = await withSession(query, session);
  return buildFormIdFromSeq(doc.seq);
}

export async function getFormBundle(formId, { session = null } = {}) {
  const normalizedFormId = normalizeFormId(formId);
  if (!normalizedFormId) return null;

  const [formDoc, fieldDocs, configDoc] = await Promise.all([
    withSession(Form.findOne({ formId: normalizedFormId }), session).lean(),
    withSession(FormField.find({ formId: normalizedFormId }).sort({ order: 1, createdAt: 1 }), session).lean(),
    withSession(FormConfiguration.findOne({ formId: normalizedFormId }), session).lean(),
  ]);

  if (!formDoc) return null;

  const config = configDoc
    ? {
        ...configDoc,
      }
    : {
        formId: normalizedFormId,
        submitText: "Submit",
        successMessage: "Thanks! Your submission has been received.",
        behaviorFlags: {},
        allowArchivedRender: false,
        schemaVersion: 1,
      };

  return {
    form: formDoc,
    fields: Array.isArray(fieldDocs) ? fieldDocs : [],
    configuration: config,
  };
}

export async function listForms({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  includeArchived = true,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
  const query = {};

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    query.$or = [
      { formId: { $regex: trimmedSearch, $options: "i" } },
      { name: { $regex: trimmedSearch, $options: "i" } },
      { shortcode: { $regex: trimmedSearch, $options: "i" } },
    ];
  }

  const statusFilter = String(status || "").trim().toLowerCase();
  if (FORM_STATUSES.includes(statusFilter)) {
    query.status = statusFilter;
  } else if (!includeArchived) {
    query.status = { $ne: FORM_STATUS.ARCHIVED };
  }

  const [items, total] = await Promise.all([
    Form.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Form.countDocuments(query),
  ]);

  return {
    items: Array.isArray(items) ? items : [],
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    limit: safeLimit,
  };
}

export async function createForm({
  name,
  status = FORM_STATUS.DRAFT,
  actor = "",
} = {}) {
  const formName = String(name || "").trim();
  if (!formName) {
    throw new FormBuilderError("Form name is required", 400);
  }

  const safeStatus = FORM_STATUSES.includes(String(status || "").toLowerCase())
    ? String(status).toLowerCase()
    : FORM_STATUS.DRAFT;

  const payload = await runWithOptionalTransaction(async (session) => {
    const formId = await getNextFormId(session);
    const { shortcode, shortcodeAlt } = buildFormShortcodes(formId);

    const formDoc = await Form.create(
      [
        {
          formId,
          name: formName,
          status: safeStatus,
          shortcode,
          shortcodeAlt,
          createdBy: actor || "",
          updatedBy: actor || "",
        },
      ],
      session ? { session } : undefined,
    );

    await FormConfiguration.create(
      [
        {
          formId,
          submitText: "Submit",
          successMessage: "Thanks! Your submission has been received.",
          behaviorFlags: {},
          allowArchivedRender: false,
          schemaVersion: 1,
          createdBy: actor || "",
          updatedBy: actor || "",
        },
      ],
      session ? { session } : undefined,
    );

    return toLean(formDoc[0]);
  });

  return getFormBundle(payload.formId);
}

export async function updateFormMeta(formId, updates = {}, actor = "") {
  const normalizedFormId = normalizeFormId(formId);
  if (!normalizedFormId) throw new FormBuilderError("Invalid formId", 400);

  const formDoc = await Form.findOne({ formId: normalizedFormId });
  if (!formDoc) throw new FormBuilderError("Form not found", 404);

  if (updates.name !== undefined) {
    const nextName = String(updates.name || "").trim();
    if (!nextName) throw new FormBuilderError("Form name is required", 400);
    formDoc.name = nextName;
  }

  if (updates.status !== undefined) {
    const nextStatus = String(updates.status || "").trim().toLowerCase();
    if (!FORM_STATUSES.includes(nextStatus)) {
      throw new FormBuilderError(
        `Status must be one of ${FORM_STATUSES.join(", ")}`,
        400,
      );
    }
    formDoc.status = nextStatus;
  }

  if (actor) formDoc.updatedBy = actor;
  await formDoc.save();
  return getFormBundle(normalizedFormId);
}

export async function saveFormSchema(formId, payload = {}, actor = "") {
  const normalizedFormId = normalizeFormId(formId);
  if (!normalizedFormId) throw new FormBuilderError("Invalid formId", 400);

  const existingBundle = await getFormBundle(normalizedFormId);
  if (!existingBundle) throw new FormBuilderError("Form not found", 404);

  const nextName =
    payload.name !== undefined
      ? String(payload.name || "").trim()
      : String(existingBundle.form.name || "").trim();
  if (!nextName) throw new FormBuilderError("Form name is required", 400);

  const nextStatusRaw =
    payload.status !== undefined
      ? String(payload.status || "").trim().toLowerCase()
      : String(existingBundle.form.status || FORM_STATUS.DRAFT).toLowerCase();
  if (!FORM_STATUSES.includes(nextStatusRaw)) {
    throw new FormBuilderError(
      `Status must be one of ${FORM_STATUSES.join(", ")}`,
      400,
    );
  }

  const { fields: normalizedFields, errors } = normalizeFieldSchema(payload.fields);
  if (errors.length > 0) {
    throw new FormBuilderError("Invalid field schema", 400, errors);
  }

  const normalizedConfig = normalizeFormConfiguration(
    payload.configuration || {},
    existingBundle.configuration || {},
  );
  const nextVersion = Math.max(
    1,
    Number(existingBundle.configuration?.schemaVersion || 1) + 1,
  );

  await runWithOptionalTransaction(async (session) => {
    const formDoc = await withSession(Form.findOne({ formId: normalizedFormId }), session);
    if (!formDoc) throw new FormBuilderError("Form not found", 404);
    formDoc.name = nextName;
    formDoc.status = nextStatusRaw;
    formDoc.updatedBy = actor || formDoc.updatedBy || "";
    await formDoc.save(session ? { session } : undefined);

    await withSession(FormField.deleteMany({ formId: normalizedFormId }), session);

    if (normalizedFields.length > 0) {
      const docs = normalizedFields.map((field) => ({
        ...field,
        formId: normalizedFormId,
      }));
      await FormField.insertMany(docs, session ? { session } : undefined);
    }

    await withSession(
      FormConfiguration.findOneAndUpdate(
        { formId: normalizedFormId },
        {
          $set: {
            ...normalizedConfig,
            schemaVersion: nextVersion,
            updatedBy: actor || existingBundle.configuration?.updatedBy || "",
          },
          $setOnInsert: {
            createdBy: actor || "",
          },
        },
        { upsert: true, new: true },
      ),
      session,
    );
  });

  return getFormBundle(normalizedFormId);
}

export async function deleteForm(formId) {
  const normalizedFormId = normalizeFormId(formId);
  if (!normalizedFormId) throw new FormBuilderError("Invalid formId", 400);

  const form = await Form.findOne({ formId: normalizedFormId }).lean();
  if (!form) throw new FormBuilderError("Form not found", 404);

  await runWithOptionalTransaction(async (session) => {
    await withSession(Form.deleteOne({ formId: normalizedFormId }), session);
    await withSession(FormField.deleteMany({ formId: normalizedFormId }), session);
    await withSession(FormConfiguration.deleteMany({ formId: normalizedFormId }), session);
    await withSession(FormSubmission.deleteMany({ formId: normalizedFormId }), session);
    await withSession(SubmissionFile.deleteMany({ formId: normalizedFormId }), session);
  });

  return { deleted: true, formId: normalizedFormId };
}

export async function resolveFormIdFromShortcode(shortcode) {
  const parsed = parseFormShortcode(shortcode);
  if (!parsed.matched || !parsed.formId) return null;
  const form = await Form.findOne({ formId: parsed.formId }).select("formId").lean();
  return form?.formId || null;
}

export async function resolveFormByShortcode(shortcode) {
  const parsed = parseFormShortcode(shortcode);
  if (!parsed.matched || !parsed.formId) return null;

  const form = await Form.findOne({
    $or: [
      { formId: parsed.formId },
      { shortcode: shortcode },
      { shortcodeAlt: shortcode },
    ],
  }).lean();

  return form || null;
}

export function submissionSnapshotFromFields(fields = []) {
  return fieldSnapshotFromSchema(fields);
}

