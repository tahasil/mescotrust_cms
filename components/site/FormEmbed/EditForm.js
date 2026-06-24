"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  Alert,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";

const API_PATH = "/api/theme/FormEmbed";

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function buildPayload(values) {
  const mode = normalizeText(values.mode || "formId");
  const formId = normalizeText(values.formId);
  const shortcode = normalizeText(values.shortcode).toLowerCase();

  return {
    mode,
    formId: mode === "formId" ? formId : "",
    shortcode: mode === "shortcode" ? shortcode : "",
    heading: normalizeText(values.heading),
    description: normalizeText(values.description),
    submitLabel: normalizeText(values.submitLabel),
    successMessage: normalizeText(values.successMessage),
  };
}

function normalizeInitial(data) {
  return {
    mode: normalizeText(data?.mode || "formId"),
    formId: normalizeText(data?.formId),
    shortcode: normalizeText(data?.shortcode).toLowerCase(),
    heading: normalizeText(data?.heading),
    description: normalizeText(data?.description),
    submitLabel: normalizeText(data?.submitLabel),
    successMessage: normalizeText(data?.successMessage),
  };
}

function toFormOptionLabel(form) {
  const name = normalizeText(form?.name || "Untitled Form");
  const formId = normalizeText(form?.formId);
  const status = normalizeText(form?.status || "draft");

  return (
    <Space size={8}>
      <Typography.Text>{name}</Typography.Text>
      <Typography.Text code>{formId}</Typography.Text>
      <Tag color={status === "published" ? "green" : status === "archived" ? "orange" : "default"}>
        {status}
      </Tag>
    </Space>
  );
}

function FormEmbedEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState([]);
  const [formsError, setFormsError] = useState("");

  const isPageBlock = source === "page";
  const mode = Form.useWatch("mode", form) || "formId";

  useEffect(() => {
    let cancelled = false;

    async function loadFormList() {
      setFormsError("");
      try {
        const res = await fetch("/api/admin/forms?page=1&limit=100", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load forms list");
        }
        if (!cancelled) {
          setForms(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setFormsError(err?.message || "Failed to load forms list");
          setForms([]);
        }
      }
    }

    loadFormList();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      try {
        if (isPageBlock) {
          const next = normalizeInitial(initialDataProp || {});
          if (!cancelled) form.setFieldsValue(next);
          return;
        }

        const res = await fetch(API_PATH, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const next = normalizeInitial(res.ok ? data : {});
        if (!cancelled) form.setFieldsValue(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [form, initialDataProp, isPageBlock]);

  const publishedCount = useMemo(
    () => forms.filter((item) => normalizeText(item?.status) === "published").length,
    [forms],
  );

  const handleUpdate = async () => {
    const values = await form.validateFields();
    const payload = buildPayload(values);

    if (payload.mode === "formId" && !payload.formId) {
      message.error("Please select a form");
      throw new Error("Form ID is required");
    }
    if (payload.mode === "shortcode" && !payload.shortcode) {
      message.error("Please enter shortcode");
      throw new Error("Shortcode is required");
    }

    if (isPageBlock && onSaveToPage) {
      onSaveToPage(payload);
      message.success("Changes will be saved with the page");
      onSuccess?.(payload);
      return payload;
    }

    setSaving(true);
    try {
      const res = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save Form Embed settings");
      }

      message.success("Form Embed settings saved");
      onSuccess?.(data || payload);
      return data;
    } catch (err) {
      message.error(err?.message || "Failed to save");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" initialValues={normalizeInitial(initialDataProp || {})}>
      {formsError ? (
        <Alert type="warning" showIcon message={formsError} style={{ marginBottom: 12 }} />
      ) : null}

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={`Available forms: ${forms.length} (${publishedCount} published)`}
      />

      <Form.Item name="mode" label="Resolve Form By">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: "Form ID", value: "formId" },
            { label: "Shortcode", value: "shortcode" },
          ]}
        />
      </Form.Item>

      {mode === "formId" ? (
        <Form.Item name="formId" label="Select Form">
          <Select
            showSearch
            placeholder="Choose a form"
            optionFilterProp="label"
            options={forms.map((item) => ({
              value: item.formId,
              label: `${normalizeText(item?.name)} ${normalizeText(item?.formId)} ${normalizeText(item?.status)}`,
              children: toFormOptionLabel(item),
            }))}
            optionRender={(option) => option.data.children || option.data.label}
          />
        </Form.Item>
      ) : (
        <Form.Item name="shortcode" label="Shortcode">
          <Input placeholder="e.g. volunteer-form" />
        </Form.Item>
      )}

      <Form.Item name="heading" label="Heading (optional)">
        <Input placeholder="Displayed above embedded form" />
      </Form.Item>

      <Form.Item name="description" label="Description (optional)">
        <Input.TextArea rows={3} placeholder="Short helper text above form" />
      </Form.Item>

      <Form.Item name="submitLabel" label="Submit Button Label Override (optional)">
        <Input placeholder="Leave empty to use form default" />
      </Form.Item>

      <Form.Item name="successMessage" label="Success Message Override (optional)">
        <Input.TextArea rows={2} placeholder="Leave empty to use form default" />
      </Form.Item>

      {!isPageBlock ? (
        <Alert
          type="warning"
          showIcon
          message={saving ? "Saving..." : "Click Update in the drawer header to save changes"}
        />
      ) : null}
    </Form>
  );
}

export default forwardRef(FormEmbedEditForm);
