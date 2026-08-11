"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button, Collapse, Form, Input, Select, Space, Spin, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  VOLUNTEER_MESCO_DEFAULT_PROPS,
  VOLUNTEER_MESCO_REQUIRED_IMAGE_HEIGHT,
  VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT,
  VOLUNTEER_MESCO_REQUIRED_IMAGE_WIDTH,
} from "./defaults";

const API_PATH = "/api/theme/VolunteerMesco";
const PREFIX = "volunteerMesco";
const TARGET_OPTIONS = [
  { label: "Same tab", value: "_self" },
  { label: "New tab", value: "_blank" },
];
const VISIBILITY_FIELDS = [
  "volunteerMescoSubTitleVisible",
  "volunteerMescoTitleVisible",
  "volunteerMescoDescriptionVisible",
  "volunteerMescoChipsVisible",
  "volunteerMescoImageVisible",
  "volunteerMescoPrimaryButtonVisible",
  "volunteerMescoSecondaryButtonVisible",
];
const COLOR_FIELDS = [
  "volunteerMescoSubTitleColorKey",
  "volunteerMescoTitleColorKey",
  "volunteerMescoDescriptionColorKey",
  "volunteerMescoChipTextColorKey",
  "volunteerMescoChipBgColorKey",
  "volunteerMescoChipBorderColorKey",
  "volunteerMescoPrimaryButtonBgColorKey",
  "volunteerMescoPrimaryButtonTextColorKey",
  "volunteerMescoPrimaryButtonHoverBgColorKey",
  "volunteerMescoSecondaryButtonTextColorKey",
  "volunteerMescoSecondaryButtonBorderColorKey",
  "volunteerMescoSecondaryButtonHoverBorderColorKey",
  "volunteerMescoImageBgColorKey",
];

const clean = (value) => value == null ? "" : String(value).trim();
const normalizeTarget = (value) => value === "_blank" ? "_blank" : "_self";
const normalizeChips = (items) => Array.isArray(items) ? items.map(clean).filter(Boolean) : [];

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({
      width: Number(image.naturalWidth) || 0,
      height: Number(image.naturalHeight) || 0,
    });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateImageDimensions(_, value) {
  const imageUrl = clean(value);
  if (!imageUrl) return Promise.resolve();
  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (width === VOLUNTEER_MESCO_REQUIRED_IMAGE_WIDTH && height === VOLUNTEER_MESCO_REQUIRED_IMAGE_HEIGHT) {
      return Promise.resolve();
    }
    return Promise.reject(new Error(
      `Image must be exactly ${VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
    ));
  } catch {
    return Promise.reject(new Error(
      `Unable to validate image size. Required size: ${VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT}.`,
    ));
  }
}

function VolunteerMescoEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: suppliedColors = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(suppliedColors);
  const fetchedColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const imageVisible = Form.useWatch("volunteerMescoImageVisible", form) !== false;

  const applyColors = useCallback((theme = {}) => {
    const palette = theme?.themePalette || {};
    const custom = Array.isArray(theme?.colors) ? theme.colors : [];
    const names = [...new Set([...Object.keys(palette), ...custom.map((item) => item?.name).filter(Boolean)])].sort();
    setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
  }, []);

  const applyValues = useCallback((data = {}) => {
    const merged = { ...VOLUNTEER_MESCO_DEFAULT_PROPS, ...(data || {}) };
    form.setFieldsValue({
      ...merged,
      ...getManageSectionInitialValues(PREFIX, merged),
      titleHighlightColorKey: clean(merged.titleHighlightColorKey) || VOLUNTEER_MESCO_DEFAULT_PROPS.titleHighlightColorKey,
      volunteerMescoChips: normalizeChips(merged.volunteerMescoChips),
      volunteerMescoPrimaryButtonTarget: normalizeTarget(merged.volunteerMescoPrimaryButtonTarget),
      volunteerMescoSecondaryButtonTarget: normalizeTarget(merged.volunteerMescoSecondaryButtonTarget),
      ...Object.fromEntries(VISIBILITY_FIELDS.map((field) => [field, merged[field] !== false])),
      ...Object.fromEntries(COLOR_FIELDS.map((field) => [field, clean(merged[field])])),
    });
  }, [form]);

  useEffect(() => {
    if (suppliedColors.length > 0) setThemeColorOptions(suppliedColors);
  }, [suppliedColors]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp || {});
      if (suppliedColors.length > 0 || fetchedColorsRef.current) {
        setLoading(false);
        return;
      }
      fetchedColorsRef.current = true;
      fetch("/api/theme", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : {})
        .then(applyColors)
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : {})
      .then((data) => {
        applyValues(data);
        applyColors(data);
      })
      .catch(() => message.error("Failed to load Volunteer MESCO"))
      .finally(() => setLoading(false));
  }, [applyColors, applyValues, initialDataProp, isPageBlock, suppliedColors.length]);

  const payloadFrom = useCallback((values) => ({
    ...getManageSectionPayload(PREFIX, values),
    volunteerMescoSubTitle: clean(values.volunteerMescoSubTitle),
    volunteerMescoTitle: clean(values.volunteerMescoTitle),
    volunteerMescoDescription: clean(values.volunteerMescoDescription),
    volunteerMescoChips: normalizeChips(values.volunteerMescoChips),
    volunteerMescoImage: clean(values.volunteerMescoImage),
    volunteerMescoImageAlt: clean(values.volunteerMescoImageAlt),
    volunteerMescoPrimaryButtonText: clean(values.volunteerMescoPrimaryButtonText),
    volunteerMescoPrimaryButtonLink: clean(values.volunteerMescoPrimaryButtonLink),
    volunteerMescoPrimaryButtonTarget: normalizeTarget(values.volunteerMescoPrimaryButtonTarget),
    volunteerMescoSecondaryButtonText: clean(values.volunteerMescoSecondaryButtonText),
    volunteerMescoSecondaryButtonLink: clean(values.volunteerMescoSecondaryButtonLink),
    volunteerMescoSecondaryButtonTarget: normalizeTarget(values.volunteerMescoSecondaryButtonTarget),
    ...Object.fromEntries(VISIBILITY_FIELDS.map((field) => [field, values[field] !== false])),
    ...Object.fromEntries(COLOR_FIELDS.map((field) => [field, clean(values[field])])),
  }), []);

  const handleUpdate = useCallback(() => form.validateFields().then(() => {
    const payload = payloadFrom(form.getFieldsValue(true));
    if (isPageBlock && onSaveToPage) {
      onSaveToPage(payload);
      message.success("Changes will be saved with the page");
      onSuccess?.();
      return;
    }
    setSaving(true);
    fetch(API_PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.ok ? undefined : response.json().then((data) => Promise.reject(data)))
      .then(() => { message.success("Volunteer MESCO saved"); onSuccess?.(); })
      .catch((error) => message.error(error?.error || "Failed to save Volunteer MESCO"))
      .finally(() => setSaving(false));
  }).catch(() => {}), [form, isPageBlock, onSaveToPage, onSuccess, payloadFrom]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading || saving) return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;

  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["content"]} items={[
        {
          key: "section",
          label: "Manage Section",
          children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
        },
        {
          key: "title-colors",
          label: "Title & Colors",
          children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("VolunteerMesco")} />,
        },
        {
          key: "visibility",
          label: "Visibility",
          children: <SwitchSettingsCard items={[
            { name: "volunteerMescoSubTitleVisible", label: "Show subtitle" },
            { name: "volunteerMescoTitleVisible", label: "Show title" },
            { name: "volunteerMescoDescriptionVisible", label: "Show description" },
            { name: "volunteerMescoChipsVisible", label: "Show chips" },
            { name: "volunteerMescoImageVisible", label: "Show image" },
            { name: "volunteerMescoPrimaryButtonVisible", label: "Show primary button" },
            { name: "volunteerMescoSecondaryButtonVisible", label: "Show secondary button" },
          ]} />,
        },
        {
          key: "content",
          label: "Content",
          children: <Form.Item name="volunteerMescoDescription" label="Description"><RichTextEditor /></Form.Item>,
        },
        {
          key: "buttons",
          label: "Buttons",
          children: <>
            <Form.Item name="volunteerMescoPrimaryButtonText" label="Primary button text"><Input /></Form.Item>
            <Form.Item name="volunteerMescoPrimaryButtonLink" label="Primary button link"><Input /></Form.Item>
            <Form.Item name="volunteerMescoPrimaryButtonTarget" label="Primary button target"><Select options={TARGET_OPTIONS} /></Form.Item>
            <Form.Item name="volunteerMescoSecondaryButtonText" label="Secondary button text"><Input /></Form.Item>
            <Form.Item name="volunteerMescoSecondaryButtonLink" label="Secondary button link"><Input /></Form.Item>
            <Form.Item name="volunteerMescoSecondaryButtonTarget" label="Secondary button target"><Select options={TARGET_OPTIONS} /></Form.Item>
          </>,
        },
        {
          key: "chips",
          label: "Chips",
          children: <Form.List name="volunteerMescoChips">{(fields, { add, remove }) => <Space direction="vertical" style={{ width: "100%" }}>
            {fields.map((field, index) => <Space.Compact key={field.key} style={{ width: "100%" }}>
              <Form.Item {...field} name={field.name} rules={[{ required: true, message: "Chip text is required" }]} style={{ flex: 1, marginBottom: 0 }}><Input placeholder={`Chip ${index + 1}`} /></Form.Item>
              <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} aria-label={`Delete chip ${index + 1}`} />
            </Space.Compact>)}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add("")} block>Add chip</Button>
          </Space>}</Form.List>,
        },
        {
          key: "image",
          label: "Image",
          children: <>
            <Form.Item
              name="volunteerMescoImage"
              label="Image"
              validateTrigger={["onChange", "onBlur"]}
              rules={[
                ...(imageVisible ? [{ required: true, message: "Image is required when it is visible" }] : []),
                { validator: validateImageDimensions },
              ]}
            >
              <MediaPickerInput uiVariant="stacked" hintText={`Required size: ${VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT}`} />
            </Form.Item>
            <Form.Item name="volunteerMescoImageAlt" label="Image alt text"><Input /></Form.Item>
          </>,
        },
      ]} />
    </Form>
  );
}

export default forwardRef(VolunteerMescoEditForm);
