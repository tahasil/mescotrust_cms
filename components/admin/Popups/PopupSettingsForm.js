"use client";

import {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Collapse,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
  message,
} from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  normalizePopupRoute,
  normalizePopupTargetRoutes,
} from "@/lib/popupRouteUtils";
import {
  isValidPopupLinkUrl,
  normalizePopupLinkTarget,
} from "@/lib/popupValidation";

const HOME_ROUTE_OPTION = { label: "Home / Landing", value: "/home" };
const REQUIRED_POPUP_IMAGE_WIDTH = 600;
const REQUIRED_POPUP_IMAGE_HEIGHT = 600;
const POPUP_IMAGE_REQUIRED_TEXT = "If uploaded, required size: 600 × 600 PX";
const POPUP_IMAGE_INVALID_MESSAGE =
  "Invalid image resolution. Please select an image with size 600 × 600 PX.";
const POPUP_WIDTH_PRESET_OPTIONS = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "Full Width", value: "full" },
  { label: "Custom", value: "custom" },
];
const POPUP_LINK_TARGET_OPTIONS = [
  { label: "Open in Same Tab", value: "_self" },
  { label: "Open in New Tab", value: "_blank" },
];

function normalizeWidthPreset(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "full" ||
    value === "custom"
  ) {
    return value;
  }
  return "medium";
}

function normalizeCustomWidthPx(raw, fallback = 560) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(280, Math.min(1600, Math.round(value)));
}

function buildPopupLinkFromData(data) {
  const linkData = data?.link && typeof data.link === "object" ? data.link : {};
  const enabled = data?.linkEnabled === true || linkData?.enabled === true;
  const url = String(
    linkData?.url != null && String(linkData.url).trim()
      ? linkData.url
      : data?.linkUrl || "",
  ).trim();
  const target = normalizePopupLinkTarget(linkData?.target || data?.linkTarget);
  return {
    enabled,
    url,
    target,
  };
}

function normalizePopupCtaStyle(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "secondary" || value === "outline") return value;
  return "primary";
}

function sanitizePopupCtaButtonsForPayload(rawButtons) {
  const list = Array.isArray(rawButtons) ? rawButtons : [];
  return list
    .slice(0, 3)
    .map((button, index) => {
      const label = String(button?.label || "").trim();
      if (!label) return null;
      return {
        id: String(button?.id || `cta_${index + 1}`),
        label: label.slice(0, 48),
        enabled: button?.enabled !== false,
        style: normalizePopupCtaStyle(button?.style),
      };
    })
    .filter(Boolean);
}

function buildPopupCtaButtonsFromData(data) {
  return sanitizePopupCtaButtonsForPayload(data?.ctaButtons);
}

function parseMediaIdFromPopupImageUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  const match = value.match(/\/media\/([a-fA-F0-9]{24})(?:$|[/?#])/);
  return match?.[1] ? String(match[1]) : "";
}

function getPopupImageCacheKey(rawUrl) {
  const value = String(rawUrl || "").trim();
  const mediaId = parseMediaIdFromPopupImageUrl(value);
  if (mediaId) return `media:${mediaId}`;
  return `url:${value}`;
}

function VisibilitySwitchRow({ label, name }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 32,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 16, color: "#111827" }}>{label}</span>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch size="small" />
      </Form.Item>
    </div>
  );
}

function PopupSettingsForm({ componentId, onSuccess, onLivePreviewChange }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageOptions, setPageOptions] = useState([HOME_ROUTE_OPTION]);
  const [imageResolutionError, setImageResolutionError] = useState("");
  const lastPreviewPayloadRef = useRef("");
  const preservedCtaButtonsRef = useRef([]);
  const popupImageSizeCacheRef = useRef(new Map());
  const popupImageValidationSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/pages?limit=200&fields=title,slug&includeTotal=0")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const options = items
          .map((page) => {
            const slug = String(page?.slug || "").trim();
            if (!slug) return null;
            const route = normalizePopupRoute(`/${slug}`);
            const title = String(page?.title || slug).trim();
            return {
              label: `${title} (${route})`,
              value: route,
            };
          })
          .filter(Boolean);
        const map = new Map([[HOME_ROUTE_OPTION.value, HOME_ROUTE_OPTION]]);
        options.forEach((option) => map.set(option.value, option));
        setPageOptions(Array.from(map.values()));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!componentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/popups/${encodeURIComponent(componentId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Popup not found"))))
      .then((popup) => {
        const data =
          popup?.defaultProps && typeof popup.defaultProps === "object"
            ? popup.defaultProps
            : {};
        const normalizedTargets = normalizePopupTargetRoutes(data.targetRoutes);
        const animation =
          data.animation && typeof data.animation === "object"
            ? data.animation
            : {};
        const link = buildPopupLinkFromData(data);
        const ctaButtons = buildPopupCtaButtonsFromData(data);
        preservedCtaButtonsRef.current = ctaButtons;

        form.setFieldsValue({
          targetRoutes: normalizedTargets,
          imageUrl: String(data.imageUrl || ""),
          title: String(data.title || ""),
          description: String(data.description || ""),
          formShortcode: String(data.formShortcode || ""),
          openOnPageLoad: data.openOnPageLoad !== false,
          dismissible: data.dismissible !== false,
          reShowBehavior:
            data.reShowBehavior === "session_until_browser_close"
              ? "session_until_browser_close"
              : "always",
          priority:
            Number.isFinite(Number(data.priority)) ? Number(data.priority) : 100,
          animationDurationMs:
            Number.isFinite(Number(animation.durationMs))
              ? Number(animation.durationMs)
              : 280,
          modalWidthPreset: normalizeWidthPreset(data.modalWidthPreset),
          customModalWidthPx: normalizeCustomWidthPx(data.customModalWidthPx, 560),
          linkEnabled: link.enabled,
          linkUrl: link.url,
          linkTarget: link.target,
        });
      })
      .catch((err) => message.error(err?.message || "Failed to load popup settings"))
      .finally(() => setLoading(false));
  }, [componentId, form]);

  const routeSelectOptions = useMemo(() => {
    const map = new Map();
    pageOptions.forEach((option) => {
      map.set(option.value, option);
    });
    return Array.from(map.values());
  }, [pageOptions]);

  const watchedImageUrl = Form.useWatch("imageUrl", form);
  const watchedTitle = Form.useWatch("title", form);
  const watchedDescription = Form.useWatch("description", form);
  const watchedFormShortcode = Form.useWatch("formShortcode", form);
  const watchedModalWidthPreset = Form.useWatch("modalWidthPreset", form);
  const watchedCustomModalWidthPx = Form.useWatch("customModalWidthPx", form);
  const watchedLinkEnabled = Form.useWatch("linkEnabled", form);
  const watchedLinkUrl = Form.useWatch("linkUrl", form);
  const watchedLinkTarget = Form.useWatch("linkTarget", form);

  const resolvePopupImageDimensions = async (rawUrl) => {
    const value = String(rawUrl || "").trim();
    if (!value) return null;

    const mediaId = parseMediaIdFromPopupImageUrl(value);
    if (mediaId) {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const width = Number(data?.width);
        const height = Number(data?.height);
        if (
          Number.isFinite(width) &&
          width > 0 &&
          Number.isFinite(height) &&
          height > 0
        ) {
          return { width, height };
        }
      }
    }

    const src = `${value}${value.includes("?") ? "&" : "?"}popupCheck=${Date.now()}`;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Unable to validate popup image resolution"));
      img.src = src;
    });
  };

  const validatePopupImageResolution = async (rawUrl, { silent = false } = {}) => {
    const value = String(rawUrl || "").trim();
    if (!value) {
      setImageResolutionError("");
      return { valid: false, reason: "empty" };
    }

    const cacheKey = getPopupImageCacheKey(value);
    let dimensions = popupImageSizeCacheRef.current.get(cacheKey);
    if (!dimensions) {
      dimensions = await resolvePopupImageDimensions(value);
      if (dimensions && Number.isFinite(dimensions.width) && Number.isFinite(dimensions.height)) {
        popupImageSizeCacheRef.current.set(cacheKey, dimensions);
      }
    }

    const width = Number(dimensions?.width);
    const height = Number(dimensions?.height);
    const isValid =
      width === REQUIRED_POPUP_IMAGE_WIDTH && height === REQUIRED_POPUP_IMAGE_HEIGHT;

    if (isValid) {
      setImageResolutionError("");
      return { valid: true, dimensions: { width, height } };
    }

    setImageResolutionError(POPUP_IMAGE_INVALID_MESSAGE);
    if (!silent) {
      message.error(POPUP_IMAGE_INVALID_MESSAGE);
    }
    return { valid: false, dimensions: { width, height } };
  };

  const handlePopupImageChange = async (nextValue) => {
    const next = String(nextValue || "").trim();
    const current = String(form.getFieldValue("imageUrl") || "").trim();
    const mediaId = parseMediaIdFromPopupImageUrl(next);

    popupImageValidationSeqRef.current += 1;
    const validationSeq = popupImageValidationSeqRef.current;

    if (!next) {
      setImageResolutionError("");
      form.setFieldsValue({ imageUrl: "" });
      form.setFields([{ name: "imageUrl", errors: [] }]);
      return;
    }

    // For non-media raw/manual values, keep input responsive and validate on Save.
    if (!mediaId) {
      setImageResolutionError("");
      form.setFieldsValue({ imageUrl: next });
      form.setFields([{ name: "imageUrl", errors: [] }]);
      return;
    }

    try {
      const result = await validatePopupImageResolution(next, { silent: false });
      if (validationSeq !== popupImageValidationSeqRef.current) return;

      if (result.valid) {
        form.setFieldsValue({ imageUrl: next });
        form.setFields([{ name: "imageUrl", errors: [] }]);
        return;
      }

      form.setFieldsValue({ imageUrl: current });
      form.setFields([{ name: "imageUrl", errors: [POPUP_IMAGE_INVALID_MESSAGE] }]);
    } catch (err) {
      if (validationSeq !== popupImageValidationSeqRef.current) return;
      const errMsg = err?.message || "Unable to validate popup image resolution";
      setImageResolutionError(errMsg);
      message.error(errMsg);
      form.setFieldsValue({ imageUrl: current });
      form.setFields([{ name: "imageUrl", errors: [errMsg] }]);
    }
  };

  useEffect(() => {
    if (typeof onLivePreviewChange !== "function") return;
    const payload = {
      imageUrl: String(watchedImageUrl || "").trim(),
      title: String(watchedTitle || "").trim(),
      description: String(watchedDescription || "").trim(),
      formShortcode: String(watchedFormShortcode || "").trim(),
      modalWidthPreset: normalizeWidthPreset(watchedModalWidthPreset),
      customModalWidthPx: normalizeCustomWidthPx(watchedCustomModalWidthPx, 560),
      link: {
        enabled: watchedLinkEnabled === true,
        url: String(watchedLinkUrl || "").trim(),
        target: normalizePopupLinkTarget(watchedLinkTarget),
      },
      ctaButtons: sanitizePopupCtaButtonsForPayload(
        preservedCtaButtonsRef.current,
      ),
    };
    const encoded = JSON.stringify(payload);
    if (encoded === lastPreviewPayloadRef.current) return;
    lastPreviewPayloadRef.current = encoded;
    onLivePreviewChange(payload);
  }, [
    onLivePreviewChange,
    watchedImageUrl,
    watchedTitle,
    watchedDescription,
    watchedFormShortcode,
    watchedModalWidthPreset,
    watchedCustomModalWidthPx,
    watchedLinkEnabled,
    watchedLinkUrl,
    watchedLinkTarget,
  ]);

  const handleUpdate = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const targetRoutes = normalizePopupTargetRoutes(values.targetRoutes);
      if (targetRoutes.length === 0) {
        throw new Error("Please select at least one target page");
      }

      const payload = {
        targetRoutes,
        imageUrl: String(values.imageUrl || "").trim(),
        title: String(values.title || "").trim(),
        description: String(values.description || "").trim(),
        formShortcode: String(values.formShortcode || "").trim(),
        openOnPageLoad: values.openOnPageLoad !== false,
        dismissible: values.dismissible !== false,
        reShowBehavior:
          values.reShowBehavior === "session_until_browser_close"
            ? "session_until_browser_close"
            : "always",
        priority:
          Number.isFinite(Number(values.priority))
            ? Math.max(0, Math.min(9999, Number(values.priority)))
            : 100,
        animation: {
          durationMs:
            Number.isFinite(Number(values.animationDurationMs))
              ? Math.max(120, Math.min(1500, Number(values.animationDurationMs)))
              : 280,
        },
        modalWidthPreset: normalizeWidthPreset(values.modalWidthPreset),
        customModalWidthPx: normalizeCustomWidthPx(values.customModalWidthPx, 560),
        link: {
          enabled: values.linkEnabled === true,
          url: String(values.linkUrl || "").trim(),
          target: normalizePopupLinkTarget(values.linkTarget),
        },
        ctaButtons: sanitizePopupCtaButtonsForPayload(
          values.ctaButtons ?? preservedCtaButtonsRef.current,
        ),
      };

      if (payload.link.enabled && !isValidPopupLinkUrl(payload.link.url)) {
        throw new Error("Please enter a valid popup URL");
      }
      if (payload.imageUrl) {
        const imageCheck = await validatePopupImageResolution(payload.imageUrl, {
          silent: true,
        });
        if (!imageCheck.valid) {
          throw new Error(POPUP_IMAGE_INVALID_MESSAGE);
        }
      }

      setSaving(true);
      const res = await fetch(`/api/admin/popups/${encodeURIComponent(componentId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save popup settings");
      }
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("popup_config_updated_at", String(Date.now()));
        }
      } catch {}
      message.success("Popup settings saved");
      await onSuccess?.(data);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to save popup settings");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={["targets", "content", "link", "visibility", "behavior"]}
        items={[
          {
            key: "targets",
            label: "Target Pages",
            children: (
              <Form.Item
                name="targetRoutes"
                label="Show popup on"
                rules={[
                  {
                    validator: (_, value) =>
                      Array.isArray(value) && value.length > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error("Select at least one page")),
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select pages"
                  options={routeSelectOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            ),
          },
          {
            key: "content",
            label: "Popup Content",
            children: (
              <>
                <Form.Item
                  label="Popup image"
                  validateStatus={imageResolutionError ? "error" : undefined}
                  help={imageResolutionError || undefined}
                  extra={POPUP_IMAGE_REQUIRED_TEXT}
                >
                  <MediaPickerInput
                    value={watchedImageUrl || ""}
                    onChange={handlePopupImageChange}
                    placeholder="/media/{id}"
                    uiVariant="stacked"
                    showVariants
                    allowManual
                    mediaLibraryType="image"
                    cropWidth={REQUIRED_POPUP_IMAGE_WIDTH}
                    cropHeight={REQUIRED_POPUP_IMAGE_HEIGHT}
                    hintText={POPUP_IMAGE_REQUIRED_TEXT}
                  />
                </Form.Item>
                <Form.Item
                  name="imageUrl"
                  hidden
                  rules={[
                    {
                      validator: async (_, value) => {
                        const str = String(value || "").trim();
                        if (!str) return Promise.resolve();
                        const result = await validatePopupImageResolution(str, {
                          silent: true,
                        });
                        return result.valid
                          ? Promise.resolve()
                          : Promise.reject(new Error(POPUP_IMAGE_INVALID_MESSAGE));
                      },
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="title" label="Title">
                  <Input placeholder="Optional popup title" />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Optional popup description" />
                </Form.Item>
                <Form.Item
                  name="formShortcode"
                  label="Shortcode"
                  extra='Form Builder shortcode (e.g. [shortcode="form-name"]).'
                >
                  <Input placeholder='[shortcode="form-name"]' />
                </Form.Item>
              </>
            ),
          },
          {
            key: "visibility",
            label: "Visibility Settings",
            children: (
              <>
                <VisibilitySwitchRow
                  name="openOnPageLoad"
                  label="Auto-open on page load"
                />
                <VisibilitySwitchRow
                  name="dismissible"
                  label="Allow manual close"
                />
              </>
            ),
          },
          {
            key: "link",
            label: "Redirect Link",
            children: (
              <>
                <VisibilitySwitchRow
                  name="linkEnabled"
                  label="Enable popup redirect link"
                />
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, next) =>
                    prev.linkEnabled !== next.linkEnabled
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("linkEnabled") === true ? (
                      <>
                        <Form.Item
                          name="linkUrl"
                          label="Popup URL"
                          rules={[
                            {
                              required: true,
                              message: "Please enter a popup URL",
                            },
                            {
                              validator: (_, value) => {
                                const trimmed = String(value || "").trim();
                                if (!trimmed) {
                                  return Promise.reject(
                                    new Error("Please enter a popup URL"),
                                  );
                                }
                                return isValidPopupLinkUrl(trimmed)
                                  ? Promise.resolve()
                                  : Promise.reject(
                                      new Error(
                                        "Use /path, #anchor, http(s)://, mailto:, or tel:",
                                      ),
                                    );
                              },
                            },
                          ]}
                        >
                          <Input placeholder="e.g. /apply or https://example.com/apply" />
                        </Form.Item>
                        <Form.Item
                          name="linkTarget"
                          label="Link Target"
                          rules={[
                            {
                              required: true,
                              message: "Please select link target",
                            },
                          ]}
                        >
                          <Select
                            options={POPUP_LINK_TARGET_OPTIONS}
                            placeholder="Select target"
                          />
                        </Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>
              </>
            ),
          },
          {
            key: "behavior",
            label: "Behavior",
            children: (
              <>
                <Form.Item
                  name="reShowBehavior"
                  label="Re-show behavior"
                  rules={[{ required: true, message: "Please select a behavior" }]}
                >
                  <Select
                    options={[
                      {
                        label: "Always show on matched page visits",
                        value: "always",
                      },
                      {
                        label:
                          "Hide after close until browser is closed (session)",
                        value: "session_until_browser_close",
                      },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="priority" label="Priority (lower shows first)">
                  <InputNumber min={0} max={9999} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="animationDurationMs"
                  label="Animation duration (ms)"
                >
                  <InputNumber min={120} max={1500} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="modalWidthPreset"
                  label="Modal width"
                  rules={[{ required: true, message: "Please select modal width" }]}
                >
                  <Select
                    options={POPUP_WIDTH_PRESET_OPTIONS}
                    placeholder="Select modal width"
                  />
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, next) =>
                    prev.modalWidthPreset !== next.modalWidthPreset
                  }
                >
                  {({ getFieldValue }) =>
                    normalizeWidthPreset(getFieldValue("modalWidthPreset")) ===
                    "custom" ? (
                      <Form.Item
                        name="customModalWidthPx"
                        label="Custom modal width (px)"
                      >
                        <InputNumber
                          min={280}
                          max={1600}
                          style={{ width: "100%" }}
                          placeholder="e.g. 640"
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(PopupSettingsForm);
