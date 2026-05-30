"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, InputNumber, Select, Spin, notification } from "antd";
import { validateSubmissionAgainstSchema } from "@/lib/formBuilder/submissionValidation";

const NON_DATA_TYPES = new Set(["section_heading", "divider"]);

function buildInitialValues(fields = []) {
  const out = {};
  for (const field of fields) {
    if (!field || NON_DATA_TYPES.has(field.type)) continue;
    const defaultValue = field?.ui?.defaultValue;
    if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
      out[field.fieldKey] = defaultValue;
    } else if (field.type === "checkbox_group") {
      out[field.fieldKey] = [];
    } else {
      out[field.fieldKey] = "";
    }
  }
  return out;
}

function resolveColumnWidth(ui = {}) {
  const preset = String(ui?.columnWidth || "")
    .trim()
    .toLowerCase();
  if (preset === "half" || preset === "third" || preset === "full") return preset;

  const width = String(ui?.width || "")
    .trim()
    .toLowerCase();
  if (width.includes("33")) return "third";
  if (width.includes("50")) return "half";

  const n = Number.parseFloat(width.replace("%", ""));
  if (Number.isFinite(n)) {
    if (n <= 40) return "third";
    if (n <= 66) return "half";
  }
  return "full";
}

function sanitizeCssClass(value) {
  return String(value || "")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join(" ");
}

export default function FormRenderer({
  formId: formIdProp,
  shortcode = "",
  page = "",
  source = "FormRenderer",
  className = "",
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFieldKey, setUploadingFieldKey] = useState("");
  const [resolvedFormId, setResolvedFormId] = useState("");
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [values, setValues] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const sortedFields = useMemo(
    () =>
      [...(Array.isArray(fields) ? fields : [])].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      ),
    [fields],
  );

  const resolveAndLoad = async () => {
    setLoading(true);
    try {
      let formId = String(formIdProp || "").trim();
      if (!formId && shortcode) {
        const resolveRes = await fetch(
          `/api/public/forms/resolve?shortcode=${encodeURIComponent(shortcode)}`,
          { cache: "no-store" },
        );
        const resolveData = await resolveRes.json().catch(() => ({}));
        if (!resolveRes.ok) {
          throw new Error(resolveData.error || "Failed to resolve shortcode");
        }
        formId = resolveData?.form?.formId || "";
      }
      if (!formId) throw new Error("Form reference not provided");

      const res = await fetch(`/api/public/forms/${encodeURIComponent(formId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load form");
      }
      setResolvedFormId(formId);
      setForm(data.form || null);
      setFields(Array.isArray(data.fields) ? data.fields : []);
      setConfiguration(data.configuration || null);
      setValues(buildInitialValues(data.fields || []));
      setUploadedFiles({});
    } catch (error) {
      setResolvedFormId("");
      setForm(null);
      setFields([]);
      setConfiguration(null);
      notification.error({
        message: "Form unavailable",
        description: error?.message || "Unable to load this form right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formIdProp, shortcode]);

  const setValue = (fieldKey, value) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleFileUpload = async (field, fileList) => {
    const files = Array.from(fileList || []);
    if (!resolvedFormId || files.length === 0) return;
    setUploadingFieldKey(field.fieldKey);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("fieldKey", field.fieldKey);
        fd.append("file", file);
        const res = await fetch(
          `/api/public/forms/${encodeURIComponent(resolvedFormId)}/upload`,
          {
            method: "POST",
            body: fd,
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
        if (data?.file) uploaded.push(data.file);
      }
      setUploadedFiles((prev) => ({
        ...prev,
        [field.fieldKey]: [...(prev[field.fieldKey] || []), ...uploaded],
      }));
      notification.success({
        message: "File uploaded",
        description: `${uploaded.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      notification.error({
        message: "Upload failed",
        description: error?.message || "Unable to upload file.",
      });
    } finally {
      setUploadingFieldKey("");
    }
  };

  const removeUploadedFile = (fieldKey, uploadToken) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || []).filter((item) => item.uploadToken !== uploadToken),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resolvedFormId || submitting) return;

    const filesByFieldKey = Object.fromEntries(
      Object.entries(uploadedFiles).map(([fieldKey, list]) => [fieldKey, list || []]),
    );

    const validation = validateSubmissionAgainstSchema({
      fields: sortedFields,
      payloadByFieldKey: values,
      filesByFieldKey,
    });
    if (!validation.ok) {
      notification.error({
        message: "Please fix the highlighted issues",
        description: validation.errors[0] || "Validation failed",
      });
      return;
    }

    const fileTokenPayload = {};
    for (const [fieldKey, list] of Object.entries(uploadedFiles)) {
      fileTokenPayload[fieldKey] = (list || [])
        .map((item) => item.uploadToken)
        .filter(Boolean);
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/forms/${encodeURIComponent(resolvedFormId)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payloadByFieldKey: values,
            filesByFieldKey: fileTokenPayload,
            page: page || (typeof window !== "undefined" ? window.location.pathname : ""),
            source,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = Array.isArray(data.details) ? data.details[0] : "";
        throw new Error(details || data.error || "Failed to submit form");
      }

      notification.success({
        message: "Submitted",
        description:
          data.message ||
          configuration?.successMessage ||
          "Thanks! Your submission has been received.",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("new-form-submission"));
      }
      setValues(buildInitialValues(sortedFields));
      setUploadedFiles({});
    } catch (error) {
      notification.error({
        message: "Submission failed",
        description: error?.message || "Unable to submit at the moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!form || sortedFields.length === 0) {
    return null;
  }

  const formClassName = ["fb-runtime-form", className].filter(Boolean).join(" ");

  return (
    <>
      <style>{`
        .fb-runtime-form .fb-runtime-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
          align-items: start;
        }
        .fb-runtime-form .fb-runtime-field {
          grid-column: span 12;
          min-width: 0;
        }
        .fb-runtime-form .fb-runtime-half {
          grid-column: span 6;
        }
        .fb-runtime-form .fb-runtime-third {
          grid-column: span 4;
        }
        @media (max-width: 1024px) {
          .fb-runtime-form .fb-runtime-third {
            grid-column: span 6;
          }
        }
        @media (max-width: 768px) {
          .fb-runtime-form .fb-runtime-half,
          .fb-runtime-form .fb-runtime-third {
            grid-column: span 12;
          }
        }
      `}</style>
      <form className={formClassName} onSubmit={handleSubmit}>
        <div className="fb-runtime-grid">
        {sortedFields.map((field) => {
          if (!field) return null;

          const columnWidth = resolveColumnWidth(field.ui || {});
          const wrapperClass = [
            "fb-runtime-field",
            `fb-runtime-${columnWidth}`,
            sanitizeCssClass(field?.ui?.cssClass),
          ]
            .filter(Boolean)
            .join(" ");

          if (field.type === "divider") {
            return (
              <div key={field.fieldKey} className="fb-runtime-field">
                <hr style={{ borderColor: "#e5e7eb" }} />
              </div>
            );
          }

          if (field.type === "section_heading") {
            return (
              <div key={field.fieldKey} className="fb-runtime-field">
                <h3 style={{ marginTop: 0 }}>{field.label || "Section"}</h3>
              </div>
            );
          }

          if (field.flags?.hidden) return null;

          const value = values[field.fieldKey];
          const readOnly = field.flags?.readOnly === true;
          const required = field.flags?.required === true;

          return (
            <div key={field.fieldKey} className={wrapperClass}>
              <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
                {field.label || field.name || "Field"}
                {required ? <span style={{ color: "#ff4d4f" }}> *</span> : null}
              </label>

              {field.type === "textarea" ? (
                <Input.TextArea
                  rows={4}
                  value={value}
                  required={required}
                  readOnly={readOnly}
                  placeholder={field?.ui?.placeholder || ""}
                  onChange={(event) => setValue(field.fieldKey, event.target.value)}
                />
              ) : field.type === "select" ? (
                <Select
                  value={value || undefined}
                  disabled={readOnly}
                  style={{ width: "100%" }}
                  onChange={(next) => setValue(field.fieldKey, next)}
                  options={(field.options || []).map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                />
              ) : field.type === "radio_group" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {(field.options || []).map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name={field.fieldKey}
                        value={option.value}
                        checked={value === option.value}
                        disabled={readOnly}
                        required={required}
                        onChange={() => setValue(field.fieldKey, option.value)}
                        style={{ marginRight: 8 }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : field.type === "checkbox_group" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {(field.options || []).map((option) => (
                    <label key={option.value}>
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={Array.isArray(value) && value.includes(option.value)}
                        disabled={readOnly}
                        onChange={(event) => {
                          const prev = Array.isArray(value) ? value : [];
                          if (event.target.checked) {
                            setValue(field.fieldKey, [...prev, option.value]);
                          } else {
                            setValue(
                              field.fieldKey,
                              prev.filter((item) => item !== option.value),
                            );
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : field.type === "number" ? (
                <InputNumber
                  style={{ width: "100%" }}
                  value={value}
                  readOnly={readOnly}
                  placeholder={field?.ui?.placeholder || ""}
                  onChange={(next) => setValue(field.fieldKey, next)}
                />
              ) : field.type === "file" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    type="file"
                    disabled={readOnly || uploadingFieldKey === field.fieldKey}
                    multiple
                    onChange={(event) => handleFileUpload(field, event.target.files)}
                  />
                  {(uploadedFiles[field.fieldKey] || []).map((file) => (
                    <div
                      key={file.uploadToken}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: "6px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12 }}>
                        {file.originalName} ({(Number(file.size || 0) / 1024).toFixed(1)} KB)
                      </span>
                      <Button
                        size="small"
                        type="text"
                        danger
                        onClick={() => removeUploadedFile(field.fieldKey, file.uploadToken)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Input
                  value={value}
                  required={required}
                  readOnly={readOnly}
                  type={field.type === "mobile" ? "tel" : field.type}
                  placeholder={field?.ui?.placeholder || ""}
                  onChange={(event) => setValue(field.fieldKey, event.target.value)}
                />
              )}

              {field?.ui?.helpText ? (
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{field.ui.helpText}</div>
              ) : null}
            </div>
          );
        })}
        </div>
        <div style={{ marginTop: 16 }}>
          <Button htmlType="submit" type="primary" loading={submitting || !!uploadingFieldKey}>
            {configuration?.submitText || "Submit"}
          </Button>
        </div>
      </form>
    </>
  );
}
