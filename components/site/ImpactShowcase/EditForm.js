"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Collapse, Form, Input, InputNumber, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT,
  IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES,
  IMPACT_SHOWCASE_DESKTOP_REQUIRED_TEXT,
  createDesktopImageDimensionValidator,
} from "@/lib/helpingpeopleImageConfig";

const API_PATH = "/api/theme/ImpactShowcase";
const PREFIX = "impactShowcase";
const FALLBACK = {
  impactShowcaseSubTitle: "Who We Are",
  impactShowcaseMainTitle: "Education first, *then everything else.*",
  impactShowcaseBody1: "‘Education’ was identified as the core theme for human development, and the work later expanded to medical assistance and poverty relief. Well strategised schemes, programmes and institutions carry the mission.",
  impactShowcaseBody2: "The approach has always been to uphold ethical values in delivering, and to be a channel from those who want to give to those who need it most. MESCO is trusted by individuals, families, foundations, charities and corporates in India and abroad.",
  impactShowcaseStatValue: "15,000+",
  impactShowcaseStatLabel: "families touched every year",
  impactShowcaseImageAlt: "MESCO: helping people live a better tomorrow",
};
const COLOR_FIELDS = [
  "impactShowcaseSubTitleColorKey", "impactShowcaseTitleColorKey",
  "impactShowcaseBodyColorKey", "impactShowcaseStatValueColorKey",
  "impactShowcaseStatLabelColorKey",
];
const DESCRIPTION_FONT_SIZE_DEFAULT = 17;
const CONTENT_FIELDS = Object.keys(FALLBACK);
const clean = (value) => value == null ? "" : String(value).trim();
const numberInRange = (value, fallback, min, max) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const validateDesktopImageDimensions = createDesktopImageDimensionValidator({
  allowedSizes: IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES,
  allowedCompactText: IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT,
});

function ImpactShowcaseEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: suppliedColors = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(suppliedColors);
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";

  const applyValues = (data = {}) => {
    const legacyImage = data.impactShowcaseLeftImageDesktop ?? data.impactShowcaseLeftImage;
    form.setFieldsValue({
      ...FALLBACK,
      ...Object.fromEntries(CONTENT_FIELDS.map((field) => [field, data[field] != null ? clean(data[field]) : FALLBACK[field]])),
      impactShowcaseImageDesktop: clean(data.impactShowcaseImageDesktop ?? legacyImage ?? "/images/about-mesco-1.png"),
      impactShowcaseImageMobile: clean(data.impactShowcaseImageMobile ?? data.impactShowcaseLeftImageMobile),
      ...Object.fromEntries(COLOR_FIELDS.map((field) => [field, clean(data[field])])),
      impactShowcaseBodyFontSize: numberInRange(
        data.impactShowcaseBodyFontSize,
        DESCRIPTION_FONT_SIZE_DEFAULT,
        10,
        32,
      ),
      ...getManageSectionInitialValues(PREFIX, data),
    });
  };
  const applyColors = (theme = {}) => {
    const palette = theme.themePalette || {};
    const custom = Array.isArray(theme.colors) ? theme.colors : [];
    const names = [...new Set([...Object.keys(palette), ...custom.map((item) => item?.name).filter(Boolean)])].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  };

  useEffect(() => {
    if (suppliedColors.length) setThemeColorOptions(suppliedColors);
  }, [suppliedColors]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}).then(applyColors).catch(() => {}).finally(() => setLoading(false));
      } else setLoading(false);
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((r) => r.ok ? r.json() : {}),
    ]).then(([data, theme]) => { applyValues(data); applyColors(theme); })
      .catch(() => message.error("Failed to load Impact Showcase"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  const payloadFrom = (values) => ({
    ...Object.fromEntries([...CONTENT_FIELDS, ...COLOR_FIELDS, "impactShowcaseImageDesktop", "impactShowcaseImageMobile"].map((field) => [field, clean(values[field])])),
    impactShowcaseBodyFontSize: numberInRange(
      values.impactShowcaseBodyFontSize,
      DESCRIPTION_FONT_SIZE_DEFAULT,
      10,
      32,
    ),
    ...getManageSectionPayload(PREFIX, values),
  });
  const handleUpdate = () => form.validateFields().then(() => {
    const payload = payloadFrom(form.getFieldsValue(true));
    if (isPageBlock && onSaveToPage) {
      onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return;
    }
    setSaving(true);
    fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => r.ok ? undefined : r.json().then((data) => Promise.reject(data)))
      .then(() => { message.success("Impact Showcase saved"); onSuccess?.(); })
      .catch((error) => message.error(error?.error || "Failed to save"))
      .finally(() => setSaving(false));
  }).catch(() => {});
  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading || saving) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["content"]} items={[
        { key: "section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} /> },
        { key: "titles", label: "Titles & Colors", children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ImpactShowcase")} /> },
        { key: "typography", label: "Typography", children: (
          <Form.Item name="impactShowcaseBodyFontSize" label="Description font size">
            <InputNumber min={10} max={32} step={0.5} addonAfter="px" style={{ width: "100%" }} />
          </Form.Item>
        ) },
        { key: "content", label: "Content", children: <>
          <Form.Item name="impactShowcaseBody1" label="First paragraph"><RichTextEditor /></Form.Item>
          <Form.Item name="impactShowcaseBody2" label="Second paragraph"><RichTextEditor /></Form.Item>
          <Form.Item name="impactShowcaseStatValue" label="Statistic value"><Input /></Form.Item>
          <Form.Item name="impactShowcaseStatLabel" label="Statistic label"><Input /></Form.Item>
          <Form.Item
            name="impactShowcaseImageDesktop"
            label="Desktop image"
            validateTrigger={["onChange", "onBlur"]}
            rules={[{ validator: validateDesktopImageDimensions }]}
          >
            <MediaPickerInput
              uiVariant="stacked"
              cropWidth={1200}
              cropHeight={1400}
              allowedSizes={IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES}
              hintText={`Required size: ${IMPACT_SHOWCASE_DESKTOP_REQUIRED_TEXT}`}
            />
          </Form.Item>
          <Form.Item name="impactShowcaseImageMobile" label="Mobile image"><MediaPickerInput uiVariant="stacked" hintText="Optional. Desktop image is used when empty." /></Form.Item>
          <Form.Item name="impactShowcaseImageAlt" label="Image alt text"><Input /></Form.Item>
        </> },
      ]} />
    </Form>
  );
}

export default forwardRef(ImpactShowcaseEditForm);
