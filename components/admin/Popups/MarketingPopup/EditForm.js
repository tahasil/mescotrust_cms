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

const DEFAULT_POPUP_COMPONENT_ID = "MarketingPopup";
const HOME_ROUTE_OPTION = { label: "Home / Landing", value: "/home" };
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

function normalizePopupLinkTarget(raw) {
  return String(raw || "").trim().toLowerCase() === "_blank" ? "_blank" : "_self";
}

function isValidPopupLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("#")) return true;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
  return false;
}

function buildPopupLinkFromData(data) {
  const linkData =
    data?.link && typeof data.link === "object" ? data.link : {};
  const enabled = data?.linkEnabled === true || linkData?.enabled === true;
  const url =
    String(
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

function MarketingPopupEditForm(
  {
    componentId,
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onLivePreviewChange,
  },
  ref,
) {
  // The system popup defaults to "MarketingPopup"; custom popups pass their own
  // componentId so load/save target /api/theme/<componentId> (their own Popup doc).
  // encodeURIComponent guards against path traversal from an unexpected id.
  const apiPath = `/api/theme/${encodeURIComponent(
    componentId || DEFAULT_POPUP_COMPONENT_ID,
  )}`;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageOptions, setPageOptions] = useState([HOME_ROUTE_OPTION]);
  const lastPreviewPayloadRef = useRef("");
  const preservedCtaButtonsRef = useRef([]);
  const isPageBlock = source === "page";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/pages?limit=200")
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
    setLoading(true);
    const applyValues = (rawData) => {
      const data = rawData && typeof rawData === "object" ? rawData : {};
      const normalizedTargets = normalizePopupTargetRoutes(data.targetRoutes);
      const animation =
        data.animation && typeof data.animation === "object" ? data.animation : {};
      const link = buildPopupLinkFromData(data);
      const ctaButtons = buildPopupCtaButtonsFromData(data);
      preservedCtaButtonsRef.current = ctaButtons;
      form.setFieldsValue({
        targetRoutes: normalizedTargets,
        imageUrl: String(data.imageUrl || ""),
        title: String(data.title || ""),
        description: String(data.description || ""),
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
    };

    if (isPageBlock) {
      applyValues(initialDataProp || {});
      setLoading(false);
      return;
    }

    fetch(apiPath, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyValues(data))
      .catch(() => message.error("Failed to load popup settings"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock, apiPath]);

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
  const watchedModalWidthPreset = Form.useWatch("modalWidthPreset", form);
  const watchedCustomModalWidthPx = Form.useWatch("customModalWidthPx", form);
  const watchedLinkEnabled = Form.useWatch("linkEnabled", form);
  const watchedLinkUrl = Form.useWatch("linkUrl", form);
  const watchedLinkTarget = Form.useWatch("linkTarget", form);

  useEffect(() => {
    if (typeof onLivePreviewChange !== "function") return;
    const payload = {
      imageUrl: String(watchedImageUrl || "").trim(),
      title: String(watchedTitle || "").trim(),
      description: String(watchedDescription || "").trim(),
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
    watchedModalWidthPreset,
    watchedCustomModalWidthPx,
    watchedLinkEnabled,
    watchedLinkUrl,
    watchedLinkTarget,
  ]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(async () => {
        const values = form.getFieldsValue(true);
        const targetRoutes = normalizePopupTargetRoutes(values.targetRoutes);
        if (targetRoutes.length === 0) {
          message.error("Please select at least one target page");
          return;
        }

        const payload = {
          targetRoutes,
          imageUrl: String(values.imageUrl || "").trim(),
          title: String(values.title || "").trim(),
          description: String(values.description || "").trim(),
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
          message.error("Please enter a valid popup link URL");
          return;
        }

        if (!payload.imageUrl) {
          message.error("Please select a popup image");
          return;
        }

        if (isPageBlock && onSaveToPage) {
          onSaveToPage(payload);
          message.success("Changes will be saved with the page");
          onSuccess?.();
          return;
        }

        setSaving(true);
        const res = await fetch(apiPath, {
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
            window.localStorage.setItem(
              "popup_config_updated_at",
              String(Date.now()),
            );
          }
        } catch {}
        message.success("Popup settings saved");
        onSuccess?.();
      })
      .catch((err) => {
        if (err?.errorFields) return;
        message.error(err?.message || "Failed to save popup settings");
      })
      .finally(() => setSaving(false));
  };

  // Re-bind when apiPath changes: this editor instance can be reused across
  // popups (same [slug] route) without remounting, so an empty-deps handle would
  // keep saving to the previously-edited popup's endpoint (stale closure).
  useImperativeHandle(ref, () => ({ update: handleUpdate }), [apiPath]);

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
        defaultActiveKey={[
          "targets",
          "content",
          "link",
          "visibility",
          "behavior",
        ]}
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
                  name="imageUrl"
                  label="Popup image"
                  rules={[{ required: true, message: "Please select an image" }]}
                >
                  <MediaPickerInput
                    placeholder="/media/{id}"
                    uiVariant="stacked"
                    showVariants
                    allowManual
                    mediaLibraryType="image"
                  />
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

export default forwardRef(MarketingPopupEditForm);
