"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Collapse,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
  Space,
  Spin,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import Form1Preview from "@/components/admin/forms/Form1/Preview";
import NewsletterPreview from "@/components/admin/forms/Newsletter/Preview";
import PartnerWithUsPreview from "@/components/admin/forms/PartnerWithUs/Preview";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { buildThemePaletteData } from "@/lib/themeColors";
import { isValidMapEmbedInput, normalizeMapEmbedInput } from "@/lib/mapEmbed";

const DEFAULT_FORM_UI = {
  labelColor: "#334155",
  labelColorKey: "",
  buttonBg: "#cf372f",
  buttonBgColorKey: "",
  buttonTextColor: "#ffffff",
  buttonTextColorKey: "",
  buttonHoverBg: "#ffffff",
  buttonHoverBgColorKey: "",
  buttonHoverTextColor: "#cf372f",
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
  mapEmbedUrl:
    "",
  mapHeightDesktop: 370,
  mapHeightTablet: 300,
  mapHeightMobile: 260,
  mapBorderRadius: 4,
  mapBorderColor: "#edf0f3",
  mapBorderColorKey: "",
};
const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeColorString(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildThemeColorOptions(paletteData = {}) {
  const paletteKeys = Object.keys(paletteData?.themePalette || {});
  const customKeys = Array.isArray(paletteData?.colors)
    ? paletteData.colors
        .map((item) => String(item?.name || "").trim())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...paletteKeys, ...customKeys]))
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({ label: key, value: key }));
}

function resolveThemeColorFromPalette(paletteData, key) {
  if (!key) return "";
  const k = String(key).trim();
  const palette = paletteData?.themePalette || {};
  if (palette[k] != null && String(palette[k]).trim() !== "") {
    return String(palette[k]).trim();
  }
  const custom = Array.isArray(paletteData?.colors) ? paletteData.colors : [];
  const found = custom.find((item) => String(item?.name || "").trim() === k);
  if (found && found.value != null && String(found.value).trim() !== "") {
    return String(found.value).trim();
  }
  if (/^(#|rgb|rgba|hsl|hsla|linear-gradient|radial-gradient)/i.test(k))
    return k;
  return "";
}

function detectColorKeyFromValue(colorValue, paletteData = {}) {
  const normalized = normalizeColorString(colorValue);
  if (!normalized) return "";
  const palette = paletteData?.themePalette || {};
  const fromPalette = Object.keys(palette).find(
    (key) => normalizeColorString(palette[key]) === normalized,
  );
  if (fromPalette) return fromPalette;
  const custom = Array.isArray(paletteData?.colors) ? paletteData.colors : [];
  const fromCustom = custom.find(
    (item) => normalizeColorString(item?.value) === normalized,
  );
  return String(fromCustom?.name || "").trim();
}

function resolveColorFromTheme({ key, directValue, paletteData, fallback }) {
  const paletteColor = resolveThemeColorFromPalette(paletteData, key);
  if (paletteColor) return paletteColor;
  const direct = String(directValue || "").trim();
  return direct || fallback;
}

export default function FormEditPage() {
  const params = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themePaletteData, setThemePaletteData] = useState({
    themePalette: {},
    colors: [],
  });
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [formName, setFormName] = useState("Edit Form");
  const [formKey, setFormKey] = useState("");
  const [formFolderName, setFormFolderName] = useState("");
  const [dynamicPreviewComponent, setDynamicPreviewComponent] = useState(null);
  const [pendingFormName, setPendingFormName] = useState("Edit Form");
  const [editingFormName, setEditingFormName] = useState(false);
  const [hoveringFormName, setHoveringFormName] = useState(false);
  const id = String(params?.id || "");

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/forms/${encodeURIComponent(id)}`, {
        cache: "no-store",
      }),
      fetch("/api/theme", { cache: "no-store" }),
    ])
      .then(async ([formRes, themeRes]) => {
        const formData = await formRes.json().catch(() => ({}));
        if (!formRes.ok) {
          throw new Error(formData?.error || "Failed to load form");
        }

        const themeData = themeRes.ok
          ? await themeRes.json().catch(() => ({}))
          : {};
        const paletteData = buildThemePaletteData(themeData || {});
        const options = buildThemeColorOptions(paletteData);
        if (!mounted) return;

        setThemePaletteData(paletteData);
        setThemeColorOptions(options);
        const nextName = String(formData?.name || "").trim() || "Edit Form";
        const nextFormKey = String(formData?.formKey || "").trim();
        const nextFolderName = String(formData?.scaffold?.folderName || "").trim();
        setFormName(nextName);
        setFormKey(nextFormKey);
        setFormFolderName(nextFolderName);
        setPendingFormName(nextName);

        const mergedUi = { ...DEFAULT_FORM_UI, ...(formData?.ui || {}) };
        form.setFieldsValue({
          successMessage:
            String(formData?.successMessage || "").trim() ||
            DEFAULT_SUCCESS_MESSAGE,
          ui: {
            ...mergedUi,
            labelColorKey:
              mergedUi.labelColorKey ||
              detectColorKeyFromValue(mergedUi.labelColor, paletteData),
            buttonBgColorKey:
              mergedUi.buttonBgColorKey ||
              detectColorKeyFromValue(mergedUi.buttonBg, paletteData),
            buttonTextColorKey:
              mergedUi.buttonTextColorKey ||
              detectColorKeyFromValue(mergedUi.buttonTextColor, paletteData),
            buttonHoverBgColorKey:
              mergedUi.buttonHoverBgColorKey ||
              detectColorKeyFromValue(mergedUi.buttonHoverBg, paletteData),
            buttonHoverTextColorKey:
              mergedUi.buttonHoverTextColorKey ||
              detectColorKeyFromValue(
                mergedUi.buttonHoverTextColor,
                paletteData,
              ),
            leftContentColorKey:
              mergedUi.leftContentColorKey ||
              detectColorKeyFromValue(mergedUi.leftContentColor, paletteData),
            mapBorderColorKey:
              mergedUi.mapBorderColorKey ||
              detectColorKeyFromValue(mergedUi.mapBorderColor, paletteData),
          },
        });
      })
      .catch((err) => {
        if (mounted) message.error(err.message || "Failed to load form");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [form, id]);

  useEffect(() => {
    let cancelled = false;
    setDynamicPreviewComponent(null);

    const safeFolderName = /^[a-zA-Z0-9_-]+$/.test(formFolderName)
      ? formFolderName
      : "";
    if (!safeFolderName) {
      return () => {
        cancelled = true;
      };
    }

    import(`@/components/admin/forms/${safeFolderName}/Preview`)
      .then((mod) => {
        if (cancelled) return;
        const Comp = typeof mod?.default === "function" ? mod.default : null;
        setDynamicPreviewComponent(() => Comp);
      })
      .catch(() => {
        if (cancelled) return;
        setDynamicPreviewComponent(null);
      });

    return () => {
      cancelled = true;
    };
  }, [formFolderName]);

  const watchedUi = Form.useWatch("ui", form) || {};
  const isNewsletterPreview =
    /^newsletter$/i.test(String(formName || "").trim()) ||
    /^newsletter$/i.test(String(pendingFormName || "").trim()) ||
    /^form-2$/i.test(String(formKey || "").trim());
  const isPartnerWithUsPreview =
    /^partner with us$/i.test(String(formName || "").trim()) ||
    /^partner with us$/i.test(String(pendingFormName || "").trim()) ||
    /^partnerwithus(?:-.+)?$/i.test(String(formFolderName || "").trim()) ||
    /^form-3$/i.test(String(formKey || "").trim());
  const isContactUsPreview =
    /^contact us$/i.test(String(formName || "").trim()) ||
    /^contact us$/i.test(String(pendingFormName || "").trim()) ||
    /^contactus(?:-.+)?$/i.test(String(formFolderName || "").trim());
  const previewUi = useMemo(
    () => ({
      ...DEFAULT_FORM_UI,
      ...watchedUi,
      labelColor: resolveColorFromTheme({
        key: watchedUi.labelColorKey,
        directValue: watchedUi.labelColor,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.labelColor,
      }),
      buttonBg: resolveColorFromTheme({
        key: watchedUi.buttonBgColorKey,
        directValue: watchedUi.buttonBg,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.buttonBg,
      }),
      buttonTextColor: resolveColorFromTheme({
        key: watchedUi.buttonTextColorKey,
        directValue: watchedUi.buttonTextColor,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.buttonTextColor,
      }),
      buttonHoverBg: resolveColorFromTheme({
        key: watchedUi.buttonHoverBgColorKey,
        directValue: watchedUi.buttonHoverBg,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.buttonHoverBg,
      }),
      buttonHoverTextColor: resolveColorFromTheme({
        key: watchedUi.buttonHoverTextColorKey,
        directValue: watchedUi.buttonHoverTextColor,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.buttonHoverTextColor,
      }),
      leftContentColor: resolveColorFromTheme({
        key: watchedUi.leftContentColorKey,
        directValue: watchedUi.leftContentColor,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.leftContentColor,
      }),
      mapBorderColor: resolveColorFromTheme({
        key: watchedUi.mapBorderColorKey,
        directValue: watchedUi.mapBorderColor,
        paletteData: themePaletteData,
        fallback: DEFAULT_FORM_UI.mapBorderColor,
      }),
      leftContentFontSize: toFiniteNumber(
        watchedUi.leftContentFontSize,
        DEFAULT_FORM_UI.leftContentFontSize,
      ),
      leftContentLineHeight: toFiniteNumber(
        watchedUi.leftContentLineHeight,
        DEFAULT_FORM_UI.leftContentLineHeight,
      ),
      leftContentBottomSpacing: toFiniteNumber(
        watchedUi.leftContentBottomSpacing,
        DEFAULT_FORM_UI.leftContentBottomSpacing,
      ),
      leftMapTopSpacing: toFiniteNumber(
        watchedUi.leftMapTopSpacing,
        DEFAULT_FORM_UI.leftMapTopSpacing,
      ),
      mapHeightDesktop: toFiniteNumber(
        watchedUi.mapHeightDesktop,
        DEFAULT_FORM_UI.mapHeightDesktop,
      ),
      mapHeightTablet: toFiniteNumber(
        watchedUi.mapHeightTablet,
        DEFAULT_FORM_UI.mapHeightTablet,
      ),
      mapHeightMobile: toFiniteNumber(
        watchedUi.mapHeightMobile,
        DEFAULT_FORM_UI.mapHeightMobile,
      ),
      mapBorderRadius: toFiniteNumber(
        watchedUi.mapBorderRadius,
        DEFAULT_FORM_UI.mapBorderRadius,
      ),
    }),
    [themePaletteData, watchedUi],
  );

  const saveStyleChanges = async () => {
    try {
      const nameToSave = String(pendingFormName || "").trim();
      if (!nameToSave) {
        message.error("Form name is required");
        return;
      }

      const values = await form.validateFields();
      const uiValues = values?.ui || {};
      const successMessage =
        String(values?.successMessage || "").trim() || DEFAULT_SUCCESS_MESSAGE;

      const payloadUi = {
        labelColorKey: String(uiValues.labelColorKey || ""),
        labelColor: resolveColorFromTheme({
          key: uiValues.labelColorKey,
          directValue: uiValues.labelColor,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.labelColor,
        }),
        buttonBgColorKey: String(uiValues.buttonBgColorKey || ""),
        buttonBg: resolveColorFromTheme({
          key: uiValues.buttonBgColorKey,
          directValue: uiValues.buttonBg,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.buttonBg,
        }),
        buttonTextColorKey: String(uiValues.buttonTextColorKey || ""),
        buttonTextColor: resolveColorFromTheme({
          key: uiValues.buttonTextColorKey,
          directValue: uiValues.buttonTextColor,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.buttonTextColor,
        }),
        buttonHoverBgColorKey: String(uiValues.buttonHoverBgColorKey || ""),
        buttonHoverBg: resolveColorFromTheme({
          key: uiValues.buttonHoverBgColorKey,
          directValue: uiValues.buttonHoverBg,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.buttonHoverBg,
        }),
        buttonHoverTextColorKey: String(uiValues.buttonHoverTextColorKey || ""),
        buttonHoverTextColor: resolveColorFromTheme({
          key: uiValues.buttonHoverTextColorKey,
          directValue: uiValues.buttonHoverTextColor,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.buttonHoverTextColor,
        }),
        buttonRadius: toFiniteNumber(
          uiValues.buttonRadius,
          DEFAULT_FORM_UI.buttonRadius,
        ),
        leftContentHtml:
          String(uiValues.leftContentHtml || "").trim() ||
          DEFAULT_FORM_UI.leftContentHtml,
        leftContentColorKey: String(uiValues.leftContentColorKey || ""),
        leftContentColor: resolveColorFromTheme({
          key: uiValues.leftContentColorKey,
          directValue: uiValues.leftContentColor,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.leftContentColor,
        }),
        leftContentAlign: ["left", "center", "right"].includes(
          String(uiValues.leftContentAlign || "").trim().toLowerCase(),
        )
          ? String(uiValues.leftContentAlign || "").trim().toLowerCase()
          : DEFAULT_FORM_UI.leftContentAlign,
        leftContentFontSize: toFiniteNumber(
          uiValues.leftContentFontSize,
          DEFAULT_FORM_UI.leftContentFontSize,
        ),
        leftContentLineHeight: toFiniteNumber(
          uiValues.leftContentLineHeight,
          DEFAULT_FORM_UI.leftContentLineHeight,
        ),
        leftContentBottomSpacing: toFiniteNumber(
          uiValues.leftContentBottomSpacing,
          DEFAULT_FORM_UI.leftContentBottomSpacing,
        ),
        leftMapTopSpacing: toFiniteNumber(
          uiValues.leftMapTopSpacing,
          DEFAULT_FORM_UI.leftMapTopSpacing,
        ),
        mapEmbedUrl:
          normalizeMapEmbedInput(uiValues.mapEmbedUrl) ||
          DEFAULT_FORM_UI.mapEmbedUrl,
        mapHeightDesktop: toFiniteNumber(
          uiValues.mapHeightDesktop,
          DEFAULT_FORM_UI.mapHeightDesktop,
        ),
        mapHeightTablet: toFiniteNumber(
          uiValues.mapHeightTablet,
          DEFAULT_FORM_UI.mapHeightTablet,
        ),
        mapHeightMobile: toFiniteNumber(
          uiValues.mapHeightMobile,
          DEFAULT_FORM_UI.mapHeightMobile,
        ),
        mapBorderRadius: toFiniteNumber(
          uiValues.mapBorderRadius,
          DEFAULT_FORM_UI.mapBorderRadius,
        ),
        mapBorderColorKey: String(uiValues.mapBorderColorKey || ""),
        mapBorderColor: resolveColorFromTheme({
          key: uiValues.mapBorderColorKey,
          directValue: uiValues.mapBorderColor,
          paletteData: themePaletteData,
          fallback: DEFAULT_FORM_UI.mapBorderColor,
        }),
      };

      setSaving(true);
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameToSave,
          successMessage,
          ui: payloadUi,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data?.error || "Failed to update styles");
        return;
      }

      form.setFieldsValue({
        successMessage,
        ui: {
          ...payloadUi,
        },
      });
      setFormName(nameToSave);
      setPendingFormName(nameToSave);
      setEditingFormName(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("admin-forms-updated"));
      }
      message.success("Styles updated");
      setDrawerOpen(false);
    } catch (err) {
      if (!err?.errorFields)
        message.error(err.message || "Failed to update styles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeAdminCard
      title={
        <>
          <Link href="/admin/forms" style={{ marginRight: 8 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              aria-label="Back to forms"
            />
          </Link>
          {editingFormName ? (
            <Input
              autoFocus
              size="small"
              value={pendingFormName}
              onChange={(e) => setPendingFormName(e.target.value)}
              onBlur={() => setEditingFormName(false)}
              onPressEnter={() => setEditingFormName(false)}
              style={{ width: 240, fontSize: 18, fontWeight: 600 }}
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setEditingFormName(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setEditingFormName(true);
              }}
              onMouseEnter={() => setHoveringFormName(true)}
              onMouseLeave={() => setHoveringFormName(false)}
              title="Click to edit name"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <span>{pendingFormName || formName}</span>
              {hoveringFormName ? (
                <EditOutlined style={{ fontSize: 14, opacity: 0.75 }} />
              ) : null}
            </div>
          )}
        </>
      }
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setDrawerOpen(true)}>
            Edit
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={saveStyleChanges}
          >
            Save
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        (() => {
          const FallbackPreview = isNewsletterPreview
            ? NewsletterPreview
            : isPartnerWithUsPreview
              ? PartnerWithUsPreview
              : Form1Preview;
          const ActivePreview = dynamicPreviewComponent || FallbackPreview;
          return (
            <ActivePreview
              ui={previewUi}
              previewOnly
              formKey={formKey}
            />
          );
        })()
      )}

      <Drawer
        title="Edit Styles"
        placement="right"
        width={500}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" loading={saving} onClick={saveStyleChanges}>
            Apply
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Collapse
            defaultActiveKey={["colors"]}
            items={[
              ...(isContactUsPreview
                ? [
                    {
                      key: "content",
                      label: "Content & Map",
                      children: (
                        <Row gutter={[16, 10]}>
                          <Col span={24}>
                            <Form.Item
                              name={["ui", "leftContentHtml"]}
                              label="Left Content (Rich Text)"
                              className="mb-0"
                              rules={[
                                {
                                  validator: async (_, value) => {
                                    if (stripHtml(value).length > 0) return;
                                    throw new Error(
                                      "Left content cannot be empty",
                                    );
                                  },
                                },
                              ]}
                            >
                              <RichTextEditor
                                placeholder="Enter the left-side content text..."
                                minHeight={220}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name={["ui", "mapEmbedUrl"]}
                              label="Map Embed URL (or iframe embed code)"
                              className="mb-0"
                              rules={[
                                {
                                  validator: async (_, value) => {
                                    const raw = String(value || "").trim();
                                    if (!raw) return;
                                    if (isValidMapEmbedInput(raw)) return;
                                    throw new Error(
                                      "Enter a valid map embed URL or iframe embed snippet",
                                    );
                                  },
                                },
                              ]}
                            >
                              <Input.TextArea
                                rows={3}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "contentStyles",
                      label: "Content Style",
                      children: (
                        <Row gutter={[16, 8]}>
                          <Col span={24}>
                            <Form.Item
                              name={["ui", "leftContentColorKey"]}
                              label="Content text color"
                              className="mb-0"
                            >
                              <Select
                                placeholder="Select theme color"
                                options={themeColorOptions}
                                showSearch
                                allowClear
                                optionFilterProp="label"
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "leftContentAlign"]}
                              label="Text align"
                              className="mb-0"
                            >
                              <Select
                                options={[
                                  { label: "Left", value: "left" },
                                  { label: "Center", value: "center" },
                                  { label: "Right", value: "right" },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "leftContentFontSize"]}
                              label="Font size (px)"
                              className="mb-0"
                            >
                              <InputNumber min={12} max={48} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "leftContentLineHeight"]}
                              label="Line height"
                              className="mb-0"
                            >
                              <InputNumber
                                min={1}
                                max={3}
                                step={0.1}
                                style={{ width: "100%" }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "leftContentBottomSpacing"]}
                              label="Paragraph spacing (px)"
                              className="mb-0"
                            >
                              <InputNumber min={0} max={80} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "leftMapTopSpacing"]}
                              label="Map top spacing (px)"
                              className="mb-0"
                            >
                              <InputNumber min={0} max={120} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "mapStyles",
                      label: "Map Style",
                      children: (
                        <Row gutter={[16, 8]}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "mapHeightDesktop"]}
                              label="Desktop height (px)"
                              className="mb-0"
                            >
                              <InputNumber min={180} max={720} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "mapHeightTablet"]}
                              label="Tablet height (px)"
                              className="mb-0"
                            >
                              <InputNumber min={160} max={640} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "mapHeightMobile"]}
                              label="Mobile height (px)"
                              className="mb-0"
                            >
                              <InputNumber min={140} max={560} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name={["ui", "mapBorderRadius"]}
                              label="Map radius (px)"
                              className="mb-0"
                            >
                              <InputNumber min={0} max={40} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name={["ui", "mapBorderColorKey"]}
                              label="Map border color"
                              className="mb-0"
                            >
                              <Select
                                placeholder="Select theme color"
                                options={themeColorOptions}
                                showSearch
                                allowClear
                                optionFilterProp="label"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      ),
                    },
                  ]
                : []),
              {
                key: "colors",
                label: "Colors",
                children: (
                  <Row gutter={[16, 8]}>
                    <Col span={24}>
                      <Form.Item
                        name={["ui", "labelColorKey"]}
                        label="Label Color"
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select theme color"
                          options={themeColorOptions}
                          showSearch
                          allowClear
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name={["ui", "buttonBgColorKey"]}
                        label="Button background"
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select theme color"
                          options={themeColorOptions}
                          showSearch
                          allowClear
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name={["ui", "buttonTextColorKey"]}
                        label="Button text"
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select theme color"
                          options={themeColorOptions}
                          showSearch
                          allowClear
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name={["ui", "buttonHoverBgColorKey"]}
                        label="Button hover background"
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select theme color"
                          options={themeColorOptions}
                          showSearch
                          allowClear
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name={["ui", "buttonHoverTextColorKey"]}
                        label="Button hover text"
                        className="mb-0"
                      >
                        <Select
                          placeholder="Select theme color"
                          options={themeColorOptions}
                          showSearch
                          allowClear
                          optionFilterProp="label"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "submission",
                label: "Submission",
                children: (
                  <Row gutter={[16, 8]}>
                    <Col span={24}>
                      <Form.Item
                        name="successMessage"
                        label="Success Message"
                        className="mb-0"
                        rules={[
                          {
                            required: true,
                            message: "Success message is required",
                          },
                        ]}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Form submitted successfully."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
    </ThemeAdminCard>
  );
}
