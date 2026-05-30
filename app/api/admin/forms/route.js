import path from "path";
import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";

const DEFAULT_FORM_UI = {
  sectionBgGradient: "",
  cardBg: "#ffffff",
  cardBorderRadius: 16,
  cardPadding: 24,
  titleColor: "#0b2130",
  labelColor: "#334155",
  labelColorKey: "",
  inputBg: "#ffffff",
  inputBorderColor: "#e5e7eb",
  inputTextColor: "#111827",
  buttonBg: "",
  buttonBgColorKey: "",
  buttonTextColor: "",
  buttonTextColorKey: "",
  buttonHoverBg: "#ffffff",
  buttonHoverBgColorKey: "",
  buttonHoverTextColor: "",
  buttonHoverTextColorKey: "",
  buttonRadius: 24,
  leftContentHtml:
    "<p>If you would like to get involved or collaborate with us, please register your interest here and we will get back to you.</p>",
  leftContentColor: "#1f2933",
  leftContentColorKey: "",
  leftContentAlign: "left",
  leftContentFontSize: 16,
  leftContentLineHeight: 1.6,
  leftContentBottomSpacing: 16,
  leftMapTopSpacing: 18,
  mapEmbedUrl: "",
  mapHeightDesktop: 370,
  mapHeightTablet: 300,
  mapHeightMobile: 260,
  mapBorderRadius: 4,
  mapBorderColor: "#edf0f3",
  mapBorderColorKey: "",
};
const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";
const WORK_WITH_US_FORM_KEY = "form-1";

function buildFormFolderName(name = "") {
  const cleaned = String(name || "").replace(/[^a-zA-Z0-9]+/g, "").trim();
  return (cleaned || "Form").slice(0, 80);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeMetaFormRecord(rawMeta = {}) {
  const name = String(rawMeta?.name || "").trim();
  const formKey = String(rawMeta?.formKey || "").trim();
  const shortcode = String(rawMeta?.shortcode || "").trim();
  const folderName = String(rawMeta?.folderName || "").trim();
  if (!name || !formKey || !shortcode || !folderName) return null;
  return { name, formKey, shortcode, folderName };
}

async function listFileBackedFormMetas() {
  const root = process.cwd();
  const formsRoot = path.join(root, "components", "admin", "forms");
  const hasFormsRoot = await pathExists(formsRoot);
  if (!hasFormsRoot) return [];

  let entries = [];
  try {
    entries = await readdir(formsRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const rows = [];
  for (const entry of entries) {
    if (!entry?.isDirectory?.()) continue;
    const folderName = String(entry.name || "").trim();
    if (!folderName) continue;

    const metaPath = path.join(formsRoot, folderName, "form.meta.json");
    // eslint-disable-next-line no-await-in-loop
    const hasMeta = await pathExists(metaPath);
    if (!hasMeta) continue;

    try {
      // eslint-disable-next-line no-await-in-loop
      const raw = await readFile(metaPath, "utf8");
      const parsed = JSON.parse(raw);
      const normalized = normalizeMetaFormRecord(parsed);
      if (!normalized) continue;
      rows.push({
        ...normalized,
        relativePath: path.join("components", "admin", "forms", folderName),
      });
    } catch {
      // Ignore invalid metadata file.
    }
  }

  return rows;
}

async function ensureFileBackedFormsInDb(updatedBy = "") {
  const metas = await listFileBackedFormMetas();
  if (!metas.length) return;

  for (const meta of metas) {
    const existing = await Form.findOne({ formKey: meta.formKey })
      .select({ _id: 1, scaffold: 1 })
      .lean();

    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Form.create({
        name: meta.name,
        formKey: meta.formKey,
        shortcode: meta.shortcode,
        successMessage: DEFAULT_SUCCESS_MESSAGE,
        isActive: true,
        ui: { ...DEFAULT_FORM_UI },
        scaffold: {
          folderName: meta.folderName,
          relativePath: meta.relativePath,
          generatedAt: new Date(),
        },
        createdBy: updatedBy,
        updatedBy,
      });
      continue;
    }

    const currentFolderName = String(existing?.scaffold?.folderName || "").trim();
    const currentRelativePath = String(existing?.scaffold?.relativePath || "").trim();
    if (
      currentFolderName === meta.folderName &&
      currentRelativePath === meta.relativePath
    ) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await Form.updateOne(
      { _id: existing._id },
      {
        $set: {
          "scaffold.folderName": meta.folderName,
          "scaffold.relativePath": meta.relativePath,
          updatedBy,
        },
      },
    );
  }
}

async function scaffoldFormFiles({ name, formKey, shortcode }) {
  const root = process.cwd();
  const formsRoot = path.join(root, "components", "admin", "forms");
  await mkdir(formsRoot, { recursive: true });

  const baseFolderName = buildFormFolderName(name);
  let folderName = baseFolderName;
  let folderPath = path.join(formsRoot, folderName);
  if (await pathExists(folderPath)) {
    folderName = `${baseFolderName}-${formKey}`;
    folderPath = path.join(formsRoot, folderName);
  }

  await mkdir(folderPath, { recursive: true });
  const isNewsletterForm =
    /^newsletter$/i.test(String(name || "").trim()) ||
    /^form-2$/i.test(String(formKey || "").trim());
  const isPartnerWithUsForm = /^partner with us$/i.test(
    String(name || "").trim(),
  );
  const formImports = isNewsletterForm
    ? `import { Col, Form, Input, Row, message } from "antd";`
    : `import { Col, Form, Input, Row, Select, message } from "antd";`;
  const selectIconImport = isNewsletterForm
    ? ""
    : `import { DownOutlined } from "@ant-design/icons";`;
  const nameColumnSpan = isNewsletterForm || isPartnerWithUsForm ? 12 : 8;
  const emailColumnSpan = isNewsletterForm || isPartnerWithUsForm ? 12 : 8;
  const optionalFormFields = isNewsletterForm
    ? ""
    : isPartnerWithUsForm
      ? `
          <Col xs={24} md={12}>
            <Form.Item
              name="profileType"
              label={<span style={{ color: styles.labelColor }}>Type</span>}
              rules={[{ required: true, message: "Type is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                placeholder="Individual / Organization"
                style={{ width: "100%" }}
                suffixIcon={<DownOutlined className="generated-work-form__chevron" />}
                dropdownClassName="generated-work-form-select-dropdown"
                popupClassName="generated-work-form-select-dropdown"
                options={[
                  { label: "Individual", value: "Individual" },
                  { label: "Organization", value: "Organization" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="investmentInterest"
              label={<span style={{ color: styles.labelColor }}>Area of Interest</span>}
              rules={[{ required: true, message: "Area of Interest is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Area of Interest*" style={commonControlStyle} />
            </Form.Item>
          </Col>`
    : `
          <Col xs={24} md={8}>
            <Form.Item
              name="phone"
              label={<span style={{ color: styles.labelColor }}>Phone</span>}
              rules={[{ required: true, message: "Phone is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Phone*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="profileType"
              label={<span style={{ color: styles.labelColor }}>Type</span>}
              rules={[{ required: true, message: "Type is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Select
                placeholder="Individual / Organization"
                style={{ width: "100%" }}
                suffixIcon={<DownOutlined className="generated-work-form__chevron" />}
                dropdownClassName="generated-work-form-select-dropdown"
                popupClassName="generated-work-form-select-dropdown"
                options={[
                  { label: "Individual", value: "Individual" },
                  { label: "Organization", value: "Organization" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="expertise"
              label={<span style={{ color: styles.labelColor }}>Expertise</span>}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Your area of expertise / work" style={commonControlStyle} />
            </Form.Item>
          </Col>`;

const formTemplate = `"use client";

import { useState } from "react";
${formImports}
${selectIconImport}
import styled, { createGlobalStyle } from "styled-components";
import { ThemeButton, getColor } from "@/styles/Theme";

const FORM_KEY = "${formKey}";
const DEFAULT_SUCCESS_MESSAGE = ${JSON.stringify(DEFAULT_SUCCESS_MESSAGE)};
const GeneratedFormButton = styled(ThemeButton)\`
  && {
    background: var(--generated-form-btn-bg) !important;
    color: var(--generated-form-btn-text) !important;
  }

  &&:hover,
  &&:active,
  &&:focus {
    background: var(--generated-form-btn-hover-bg) !important;
    color: var(--generated-form-btn-hover-text) !important;
  }
\`;

function isDirectCssColor(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return false;
  return (
    raw.startsWith("#") ||
    raw.startsWith("rgb(") ||
    raw.startsWith("rgba(") ||
    raw.startsWith("hsl(") ||
    raw.startsWith("hsla(") ||
    raw.startsWith("linear-gradient(") ||
    raw.startsWith("radial-gradient(") ||
    raw.startsWith("conic-gradient(") ||
    raw.startsWith("var(")
  );
}

function resolveThemeColorValue(rawValue, fallbackKey = "") {
  const value = String(rawValue || "").trim();
  if (!value) return fallbackKey ? getColor(fallbackKey) : "";
  if (isDirectCssColor(value)) return value;
  return getColor(value) || value;
}
const GeneratedWorkFormGlobalStyle = createGlobalStyle\`
  .generated-work-form .ant-select-single {
    height: 56px !important;
  }
  .generated-work-form .ant-select-single .ant-select-selector {
    height: 56px !important;
    min-height: 56px !important;
    border-radius: 999px !important;
    border-color: #e5e7eb !important;
    background: #ffffff !important;
    display: flex;
    align-items: center;
    box-shadow: none !important;
    padding: 0 44px 0 14px !important;
  }
  .generated-work-form .ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
    padding-right: 40px !important;
  }
  .generated-work-form .ant-select-single .ant-select-selector .ant-select-selection-wrap {
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
  }
  .generated-work-form .ant-select-selection-placeholder,
  .generated-work-form .ant-select-selection-item {
    color: #111827 !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    font-size: 16px;
  }
  .generated-work-form .ant-select-arrow {
    color: #334155 !important;
    font-size: 16px !important;
    inset-inline-end: 16px !important;
    right: 16px !important;
    inset-block-start: 50% !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    height: auto !important;
    display: flex !important;
    align-items: center !important;
  }
  .generated-work-form .generated-work-form__chevron {
    transition: transform 0.2s ease;
    display: block;
    line-height: 1;
  }
  .generated-work-form .ant-select-open .generated-work-form__chevron {
    transform: rotate(180deg);
  }
  .generated-work-form .ant-form-item-with-help {
    margin-bottom: 30px !important;
  }
  .generated-work-form .ant-form-item-explain {
    position: relative;
    z-index: 2;
    min-height: 20px;
  }
  .generated-work-form .ant-form-item-explain-error {
    line-height: 20px !important;
    margin-top: 4px !important;
  }
  .generated-work-form-select-dropdown {
    border-radius: 22px !important;
    border: 1px solid #e6ebf0 !important;
    box-shadow: 0 12px 28px rgba(15, 47, 58, 0.12) !important;
    overflow: hidden !important;
    padding: 8px 0 !important;
  }
  .generated-work-form-select-dropdown .ant-select-item {
    min-height: 52px !important;
    border-radius: 0 !important;
    display: flex !important;
    align-items: center !important;
    padding: 12px 28px !important;
    font-size: 16px;
    color: #1e293b !important;
  }
  .generated-work-form-select-dropdown
    .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background: #f8fafc !important;
  }
  .generated-work-form-select-dropdown
    .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background: transparent !important;
    font-weight: 500 !important;
  }
\`;

/**
 * Auto-generated form component for "${name}".
 * Shortcode: ${shortcode}
 * Form Key: ${formKey}
 */
export default function GeneratedForm({
  ui = {},
  successMessage = DEFAULT_SUCCESS_MESSAGE,
  previewOnly = false,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const styles = {
    labelColor:
      resolveThemeColorValue(ui?.labelColorKey, "") ||
      resolveThemeColorValue(ui?.labelColor, "") ||
      "#334155",
    buttonBg:
      resolveThemeColorValue(ui?.buttonBgColorKey, "") ||
      resolveThemeColorValue(ui?.buttonBg, "secondary") ||
      "#cf372f",
    buttonTextColor:
      resolveThemeColorValue(ui?.buttonTextColorKey, "") ||
      resolveThemeColorValue(ui?.buttonTextColor, "primary") ||
      "#ffffff",
    buttonHoverBg:
      resolveThemeColorValue(ui?.buttonHoverBgColorKey, "") ||
      resolveThemeColorValue(ui?.buttonHoverBg, "white") ||
      "#ffffff",
    buttonHoverTextColor:
      resolveThemeColorValue(ui?.buttonHoverTextColorKey, "") ||
      resolveThemeColorValue(ui?.buttonHoverTextColor, "primary") ||
      "#cf372f",
    buttonRadius: Number(ui?.buttonRadius ?? 24),
  };

  const commonControlStyle = {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#111827",
    borderRadius: 999,
    minHeight: 48,
    paddingInline: 14,
    boxShadow: "none",
  };

  const textAreaStyle = {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#111827",
    borderRadius: 22,
    padding: "12px 14px",
    boxShadow: "none",
  };

  const buttonBgValue = String(styles.buttonBg || "").trim();
  const isGradientButton = /gradient\\(/i.test(buttonBgValue);
  const buttonVars = {
    "--generated-form-btn-bg": styles.buttonBg,
    "--generated-form-btn-text": styles.buttonTextColor,
    "--generated-form-btn-hover-bg": styles.buttonHoverBg,
    "--generated-form-btn-hover-text": styles.buttonHoverTextColor,
  };
  const buttonStyle = {
    display: "block",
    margin: "8px auto 0",
    borderRadius: \`\${Math.max(0, styles.buttonRadius)}px\`,
    minWidth: 120,
    minHeight: 44,
    fontWeight: 700,
    boxShadow: "0 3px 10px rgba(247, 183, 51, 0.45)",
    borderColor: isGradientButton ? "transparent" : buttonBgValue,
    background: isGradientButton ? undefined : buttonBgValue,
    backgroundImage: isGradientButton ? buttonBgValue : undefined,
    cursor: previewOnly ? "not-allowed" : "pointer",
  };

  const handleFinish = async (values) => {
    if (previewOnly) return;
    try {
      setSubmitting(true);
      const res = await fetch(\`/api/public/forms/\${encodeURIComponent(FORM_KEY)}/submit\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: values,
          source: "generated-form",
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Submission failed");
        return;
      }
      message.success(data?.message || successMessage || DEFAULT_SUCCESS_MESSAGE);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("new-form-submission"));
      }
      form.resetFields();
    } catch {
      message.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Form
        form={form}
        className="generated-work-form"
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={${nameColumnSpan}}>
            <Form.Item
              name="name"
              label={<span style={{ color: styles.labelColor }}>Name</span>}
              rules={[{ required: true, message: "Name is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Name*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          ${optionalFormFields}
          <Col xs={24} md={${emailColumnSpan}}>
            <Form.Item
              name="email"
              label={<span style={{ color: styles.labelColor }}>Email</span>}
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter valid email" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="Email*" style={commonControlStyle} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="message"
              label={<span style={{ color: styles.labelColor }}>Message</span>}
              style={{ marginBottom: 12 }}
            >
              <Input.TextArea
                placeholder="Message"
                autoSize={{ minRows: 4, maxRows: 6 }}
                style={textAreaStyle}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <GeneratedFormButton
              type="default"
              htmlType={previewOnly ? "button" : "submit"}
              style={{ ...buttonStyle, ...buttonVars }}
              loading={previewOnly ? false : submitting}
            >
              Submit
            </GeneratedFormButton>
          </Col>
        </Row>
      </Form>
      <GeneratedWorkFormGlobalStyle />
    </>
  );
}
`;

  const editFormTemplate = `"use client";

/**
 * Auto-generated admin edit form placeholder for "${name}".
 * Main editable controls are handled in /admin/forms/[id]/edit.
 */
export default function EditForm() {
  return null;
}
`;

  const previewTemplate = formTemplate;

  const meta = {
    name,
    formKey,
    shortcode,
    folderName,
    generatedAt: new Date().toISOString(),
  };

  await Promise.all([
    writeFile(path.join(folderPath, "EditForm.js"), editFormTemplate, "utf8"),
    writeFile(path.join(folderPath, "Preview.js"), previewTemplate, "utf8"),
    writeFile(path.join(folderPath, "form.meta.json"), JSON.stringify(meta, null, 2), "utf8"),
  ]);

  return {
    folderName,
    relativePath: path.join("components", "admin", "forms", folderName),
  };
}

async function getNextSequentialFormIdentity() {
  const docs = await Form.find()
    .select({ formKey: 1 })
    .lean();

  let maxIndex = 0;
  const matchers = [/^form-(\d+)$/i];

  for (const doc of docs) {
    const candidates = [doc?.formKey];
    for (const raw of candidates) {
      const value = String(raw || "").trim();
      if (!value) continue;
      for (const regex of matchers) {
        const m = value.match(regex);
        if (!m) continue;
        const parsed = Number(m[1]);
        if (Number.isFinite(parsed) && parsed > maxIndex) {
          maxIndex = parsed;
        }
      }
    }
  }

  let next = maxIndex + 1;
  let formKey = `form-${next}`;
  // eslint-disable-next-line no-await-in-loop
  while (await Form.exists({ formKey })) {
    next += 1;
    formKey = `form-${next}`;
  }

  return { formKey };
}

async function getWorkWithUsTemplate() {
  const doc = await Form.findOne({
    $or: [
      { formKey: WORK_WITH_US_FORM_KEY },
      { name: /^work with us$/i },
    ],
  })
    .select({ ui: 1, successMessage: 1, isActive: 1 })
    .sort({ createdAt: 1 })
    .lean();

  if (!doc) return null;

  const safeUi =
    doc?.ui && typeof doc.ui === "object" && !Array.isArray(doc.ui)
      ? doc.ui
      : {};
  const safeSuccessMessage = String(doc?.successMessage || "").trim();
  const safeIsActive = doc?.isActive !== false;

  return {
    ui: safeUi,
    successMessage: safeSuccessMessage || DEFAULT_SUCCESS_MESSAGE,
    isActive: safeIsActive,
  };
}

export async function GET(req) {
  const session = await requirePermission(req, "forms.view");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    await connectDB();
    await ensureFileBackedFormsInDb(session?.email || "");
    const [items, total] = await Promise.all([
      Form.find()
        .select({ submissions: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Form.countDocuments(),
    ]);
    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load forms" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "forms.create");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json().catch(() => ({}));
    const requestedName = String(body?.name || "").trim();

    await connectDB();
    const workWithUsTemplate = await getWorkWithUsTemplate();

    const { formKey } = await getNextSequentialFormIdentity();
    const name = requestedName || formKey;
    if (name.length > 120) {
      return NextResponse.json({ error: "Form name must be 120 characters or less" }, { status: 400 });
    }
    const successMessage =
      String(body?.successMessage || "").trim() ||
      workWithUsTemplate?.successMessage ||
      DEFAULT_SUCCESS_MESSAGE;
    const ui = {
      ...DEFAULT_FORM_UI,
      ...(workWithUsTemplate?.ui || {}),
    };
    const isActive = workWithUsTemplate?.isActive !== false;

    const shortcode = `[form id="${formKey}"]`;
    const generatedFiles = await scaffoldFormFiles({ name, formKey, shortcode });

    const doc = await Form.create({
      name,
      formKey,
      shortcode,
      successMessage,
      isActive,
      ui,
      scaffold: {
        ...generatedFiles,
        generatedAt: new Date(),
      },
      createdBy: session?.email || "",
      updatedBy: session?.email || "",
    });

    return NextResponse.json(
      {
        ...doc.toObject(),
        generatedFiles,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create form" }, { status: 500 });
  }
}
