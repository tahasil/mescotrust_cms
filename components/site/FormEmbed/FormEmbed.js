"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";

const { Paragraph, Text, Title } = Typography;

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function sortByOrder(items) {
  return [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
  );
}

function getRuntimeTarget({ mode, formId, shortcode }) {
  const cleanFormId = normalizeText(formId);
  const cleanShortcode = normalizeText(shortcode).toLowerCase();

  if (mode === "shortcode" && cleanShortcode) {
    return {
      type: "shortcode",
      key: cleanShortcode,
      url: `/api/public/forms/resolve?shortcode=${encodeURIComponent(cleanShortcode)}`,
    };
  }
  if (cleanFormId) {
    return {
      type: "formId",
      key: cleanFormId,
      url: `/api/public/forms/${encodeURIComponent(cleanFormId)}`,
    };
  }
  if (cleanShortcode) {
    return {
      type: "shortcode",
      key: cleanShortcode,
      url: `/api/public/forms/resolve?shortcode=${encodeURIComponent(cleanShortcode)}`,
    };
  }
  return null;
}

export default function FormEmbed(props = {}) {
  const mode = normalizeText(props.mode || "formId");
  const configuredFormId = normalizeText(props.formId);
  const configuredShortcode = normalizeText(props.shortcode).toLowerCase();
  const heading = normalizeText(props.heading);
  const description = normalizeText(props.description);
  const submitLabelOverride = normalizeText(props.submitLabel);
  const successMessageOverride = normalizeText(props.successMessage);
  const prefillByFieldName = isPlainObject(props.prefillByFieldName)
    ? props.prefillByFieldName
    : null;

  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState("");
  const [runtimeForm, setRuntimeForm] = useState(null);

  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [uploadingField, setUploadingField] = useState("");

  const target = useMemo(
    () =>
      getRuntimeTarget({
        mode,
        formId: configuredFormId,
        shortcode: configuredShortcode,
      }),
    [mode, configuredFormId, configuredShortcode],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRuntime() {
      if (!target) {
        setRuntimeForm(null);
        setRuntimeError("Form is not configured. Select a form or provide shortcode in Form Embed settings.");
        setRuntimeLoading(false);
        return;
      }

      setRuntimeLoading(true);
      setRuntimeError("");
      setRuntimeForm(null);
      setSuccessMessage("");
      setFieldErrors({});

      try {
        const res = await fetch(target.url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load form");
        }

        if (cancelled) return;

        const schema = data?.schema || data?.formSchema || { sections: [], questions: [] };
        setRuntimeForm({
          formId: normalizeText(data?.formId),
          name: normalizeText(data?.name),
          schema,
          defaults: {
            submitLabel: normalizeText(data?.defaults?.submitLabel || "Submit"),
            successMessage: normalizeText(
              data?.defaults?.successMessage || "Thank you for your response.",
            ),
          },
        });

        const nextAnswers = {};
        const orderedQuestions = sortByOrder(schema?.questions || []);
        const prefillSource = prefillByFieldName || {};
        orderedQuestions.forEach((question) => {
          const fieldKey = normalizeText(question?.fieldKey);
          const fieldName = normalizeText(question?.fieldName);
          const type = normalizeText(question?.type);
          if (!fieldKey) return;

          if (prefillSource[fieldName] !== undefined) {
            nextAnswers[fieldKey] = prefillSource[fieldName];
            return;
          }

          if (type === "hidden") {
            const hiddenDefault = question?.rules?.defaultValue;
            nextAnswers[fieldKey] = hiddenDefault != null ? hiddenDefault : "";
            return;
          }

          if (type === "multiple_choice") {
            nextAnswers[fieldKey] = [];
            return;
          }

          if (type === "file") {
            nextAnswers[fieldKey] = [];
            return;
          }

          nextAnswers[fieldKey] = "";
        });

        setAnswers(nextAnswers);
      } catch (err) {
        if (!cancelled) {
          setRuntimeError(err?.message || "Failed to load form");
        }
      } finally {
        if (!cancelled) setRuntimeLoading(false);
      }
    }

    loadRuntime();
    return () => {
      cancelled = true;
    };
  }, [target, prefillByFieldName]);

  const orderedSections = useMemo(
    () => sortByOrder(runtimeForm?.schema?.sections || []),
    [runtimeForm?.schema?.sections],
  );

  const orderedQuestions = useMemo(
    () => sortByOrder(runtimeForm?.schema?.questions || []),
    [runtimeForm?.schema?.questions],
  );

  const questionsBySection = useMemo(() => {
    const map = new Map();
    orderedSections.forEach((section) => map.set(section.sectionId, []));
    orderedQuestions.forEach((question) => {
      const sectionId = normalizeText(question?.sectionId);
      if (!map.has(sectionId)) map.set(sectionId, []);
      map.get(sectionId).push(question);
    });
    return map;
  }, [orderedSections, orderedQuestions]);

  const submitLabel =
    submitLabelOverride || runtimeForm?.defaults?.submitLabel || "Submit";

  function setAnswer(fieldKey, value) {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: "" }));
  }

  async function uploadFile(question, file) {
    const currentFormId = normalizeText(runtimeForm?.formId);
    const fieldKey = normalizeText(question?.fieldKey);
    if (!currentFormId || !fieldKey || !file) return null;

    const formData = new FormData();
    formData.append("fieldKey", fieldKey);
    formData.append("file", file);

    const res = await fetch(
      `/api/public/forms/${encodeURIComponent(currentFormId)}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "File upload failed");
    }

    return {
      submissionFileId: normalizeText(data?.submissionFileId),
      filename: normalizeText(data?.filename || file.name),
      mimeType: normalizeText(data?.mimeType || file.type),
      size: Number(data?.size || file.size || 0),
      url: normalizeText(data?.url),
    };
  }

  async function handleFileChange(question, fileList) {
    const fieldKey = normalizeText(question?.fieldKey);
    if (!fieldKey) return;

    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const maxFiles = Math.max(1, Number(question?.rules?.maxFiles) || 1);
    const filesToUpload = files.slice(0, maxFiles);

    setUploadingField(fieldKey);
    try {
      const uploaded = [];
      for (const file of filesToUpload) {
        const ref = await uploadFile(question, file);
        if (ref) uploaded.push(ref);
      }
      setAnswer(fieldKey, uploaded);
    } catch (err) {
      message.error(err?.message || "File upload failed");
      setFieldErrors((prev) => ({
        ...prev,
        [fieldKey]: err?.message || "File upload failed",
      }));
    } finally {
      setUploadingField("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!runtimeForm?.formId || submitting) return;

    setSubmitting(true);
    setSuccessMessage("");
    setFieldErrors({});

    const pagePath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "";

    try {
      const res = await fetch(
        `/api/public/forms/${encodeURIComponent(runtimeForm.formId)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answersByFieldKey: answers,
            source: "FormEmbed",
            pagePath,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400 && Array.isArray(data?.errors)) {
          const nextErrors = {};
          data.errors.forEach((entry) => {
            const key = normalizeText(entry?.fieldKey);
            const errorText = normalizeText(entry?.error);
            if (key && errorText) nextErrors[key] = errorText;
          });
          setFieldErrors(nextErrors);
          throw new Error(data?.error || "Validation failed");
        }
        throw new Error(data?.error || "Failed to submit form");
      }

      const nextSuccess =
        successMessageOverride ||
        normalizeText(data?.message) ||
        runtimeForm?.defaults?.successMessage ||
        "Thank you for your response.";
      setSuccessMessage(nextSuccess);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("new-form-submission"));
      }
    } catch (err) {
      message.error(err?.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestionField(question) {
    const fieldKey = normalizeText(question?.fieldKey);
    const type = normalizeText(question?.type);
    const label = normalizeText(question?.label || question?.fieldName || fieldKey);
    const descriptionText = normalizeText(question?.description);
    const required = Boolean(question?.required);
    const options = sortByOrder(question?.options || []);
    const value = answers[fieldKey];
    const errorText = normalizeText(fieldErrors[fieldKey]);

    if (type === "divider") {
      return (
        <div key={fieldKey} style={{ marginBottom: 16 }}>
          {label ? <Text strong>{label}</Text> : null}
          <Divider style={{ margin: "8px 0" }} />
        </div>
      );
    }

    if (type === "hidden") {
      return null;
    }

    return (
      <div key={fieldKey} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong>
            {label}
            {required ? <Text type="danger"> *</Text> : null}
          </Text>
          {descriptionText ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {descriptionText}
            </Text>
          ) : null}

          {type === "short_text" || type === "email" || type === "phone" || type === "url" ? (
            <Input
              type={type === "email" ? "email" : type === "url" ? "url" : "text"}
              value={normalizeText(value)}
              onChange={(e) => setAnswer(fieldKey, e.target.value)}
              placeholder={label}
            />
          ) : null}

          {type === "paragraph" ? (
            <Input.TextArea
              rows={4}
              value={normalizeText(value)}
              onChange={(e) => setAnswer(fieldKey, e.target.value)}
              placeholder={label}
            />
          ) : null}

          {type === "number" ? (
            <Input
              type="number"
              value={value === null || value === undefined ? "" : String(value)}
              onChange={(e) => setAnswer(fieldKey, e.target.value)}
              placeholder={label}
            />
          ) : null}

          {type === "date" ? (
            <Input
              type="date"
              value={normalizeText(value)}
              onChange={(e) => setAnswer(fieldKey, e.target.value)}
            />
          ) : null}

          {type === "single_choice" ? (
            <Radio.Group
              value={normalizeText(value) || undefined}
              onChange={(e) => setAnswer(fieldKey, e.target.value)}
            >
              <Space direction="vertical">
                {options.map((option) => (
                  <Radio key={option.key} value={option.key}>
                    {option.label || option.key}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          ) : null}

          {type === "multiple_choice" ? (
            <Checkbox.Group
              options={options.map((option) => ({
                label: option.label || option.key,
                value: option.key,
              }))}
              value={Array.isArray(value) ? value : []}
              onChange={(next) => setAnswer(fieldKey, next)}
            />
          ) : null}

          {type === "file" ? (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <input
                type="file"
                onChange={(e) => handleFileChange(question, e.target.files)}
                multiple={Math.max(1, Number(question?.rules?.maxFiles) || 1) > 1}
              />
              {uploadingField === fieldKey ? <Text type="secondary">Uploading...</Text> : null}
              {Array.isArray(value) && value.length > 0 ? (
                <Space direction="vertical" size={4}>
                  {value.map((fileRef, idx) => {
                    const fileName = normalizeText(fileRef?.filename || `file_${idx + 1}`);
                    return (
                      <Space key={`${fieldKey}_${idx}`} size={8}>
                        {fileRef?.url ? (
                          <a href={fileRef.url} target="_blank" rel="noopener noreferrer">
                            {fileName}
                          </a>
                        ) : (
                          <Text>{fileName}</Text>
                        )}
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => {
                            const next = (Array.isArray(value) ? value : []).filter(
                              (_, itemIndex) => itemIndex !== idx,
                            );
                            setAnswer(fieldKey, next);
                          }}
                        >
                          Remove
                        </Button>
                      </Space>
                    );
                  })}
                </Space>
              ) : null}
            </Space>
          ) : null}

          {errorText ? (
            <Text type="danger" style={{ fontSize: 12 }}>
              {errorText}
            </Text>
          ) : null}
        </Space>
      </div>
    );
  }

  if (runtimeLoading) {
    return (
      <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin />
      </div>
    );
  }

  if (runtimeError) {
    return <Alert type="warning" showIcon message={runtimeError} />;
  }

  if (!runtimeForm) {
    return <Alert type="warning" showIcon message="Form configuration is missing" />;
  }

  return (
    <div>
      {heading ? (
        <Title level={4} style={{ marginTop: 0 }}>
          {heading}
        </Title>
      ) : null}
      {description ? <Paragraph>{description}</Paragraph> : null}

      {successMessage ? (
        <Alert
          type="success"
          showIcon
          message={successMessage}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setSuccessMessage("")}
        />
      ) : null}

      <form onSubmit={handleSubmit}>
        {orderedSections.map((section, sectionIndex) => {
          const sectionId = normalizeText(section?.sectionId);
          const sectionQuestions = questionsBySection.get(sectionId) || [];
          const sectionTitle = normalizeText(section?.title);
          const sectionDescription = normalizeText(section?.description);

          return (
            <div key={sectionId || `section_${sectionIndex}`} style={{ marginBottom: 20 }}>
              {sectionTitle ? (
                <Title level={5} style={{ marginBottom: 4 }}>
                  {sectionTitle}
                </Title>
              ) : null}
              {sectionDescription ? (
                <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                  {sectionDescription}
                </Paragraph>
              ) : null}
              {sectionQuestions.map((question) => renderQuestionField(question))}
            </div>
          );
        })}

        <Button htmlType="submit" type="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}
