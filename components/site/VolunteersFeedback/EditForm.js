"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Col, Collapse, Form, Input, InputNumber, Row, Select, Spin, Switch, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { DEFAULT_VOLUNTEERS_FEEDBACK_PROPS } from "./constants";

const API_PATH = "/api/theme/VolunteersFeedback";
const PREFIX = "volunteersFeedback";

const TITLE_LIST_ITEMS = [
  {
    key: "subtitle",
    type: "input",
    name: "subTitle",
    label: "Subtitle",
    tooltip: "Small heading above the main title.",
    placeholder: "Volunteers' feedback",
  },
  {
    key: "main-title",
    type: "input",
    name: "mainTitle",
    label: "Main title",
    tooltip: "Main heading text shown above the form.",
    placeholder: "MESCO values your input...",
  },
  {
    key: "subtitle-enabled",
    type: "switch",
    name: "volunteersFeedbackSubTitleEnabled",
    label: "Show subtitle",
    tooltip: "Show or hide the subtitle.",
  },
  {
    key: "title-enabled",
    type: "switch",
    name: "volunteersFeedbackTitleEnabled",
    label: "Show main title",
    tooltip: "Show or hide the main title.",
  },
  {
    key: "description-enabled",
    type: "switch",
    name: "volunteersFeedbackDescriptionEnabled",
    label: "Show description",
    tooltip: "Show or hide the description line.",
  },
];

const COLOR_LIST_ITEMS = [
  {
    name: "volunteersFeedbackSubTitleColorKey",
    label: "Subtitle color",
    tooltip: "Theme color for subtitle text.",
  },
  {
    name: "titleColorKey",
    label: "Main title color",
    tooltip: "Theme color for main title text.",
  },
  {
    name: "volunteersFeedbackDescriptionColorKey",
    label: "Description color",
    tooltip: "Theme color for description text.",
  },
];

const BOOLEAN_KEYS = [
  "volunteersFeedbackTitleEnabled",
  "volunteersFeedbackSubTitleEnabled",
  "volunteersFeedbackDescriptionEnabled",
];

const NUMBER_KEYS = [
  "volunteersFeedbackMessageMinLength",
  "volunteersFeedbackHeroMinHeight",
  "volunteersFeedbackHeroMinHeightMobile",
  "volunteersFeedbackCardMaxWidth",
  "volunteersFeedbackCardOverlap",
  "volunteersFeedbackCardRadius",
  "volunteersFeedbackCardPadding",
  "volunteersFeedbackFieldGap",
  "volunteersFeedbackGridColumnGap",
  "volunteersFeedbackGridRowGap",
  "volunteersFeedbackInputHeight",
  "volunteersFeedbackTextAreaMinHeight",
  "volunteersFeedbackSubmitRadius",
  "volunteersFeedbackSubmitPaddingY",
  "volunteersFeedbackSubmitPaddingX",
  "volunteersFeedbackSubTitleSize",
  "volunteersFeedbackSubTitleWeight",
  "volunteersFeedbackTitleSize",
  "volunteersFeedbackTitleLineHeight",
  "volunteersFeedbackDescriptionSize",
  "volunteersFeedbackDescriptionLineHeight",
  "volunteersFeedbackLabelSize",
  "volunteersFeedbackInputFontSize",
  "volunteersFeedbackButtonFontSize",
];

function parseNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeData(data) {
  const src = data && typeof data === "object" ? data : {};
  const out = {};

  for (const key of Object.keys(DEFAULT_VOLUNTEERS_FEEDBACK_PROPS)) {
    if (BOOLEAN_KEYS.includes(key)) {
      out[key] =
        src[key] === undefined
          ? DEFAULT_VOLUNTEERS_FEEDBACK_PROPS[key]
          : src[key] !== false;
      continue;
    }
    if (NUMBER_KEYS.includes(key)) {
      out[key] = parseNumber(src[key], DEFAULT_VOLUNTEERS_FEEDBACK_PROPS[key]);
      continue;
    }
    out[key] =
      src[key] != null
        ? String(src[key]).trim()
        : String(DEFAULT_VOLUNTEERS_FEEDBACK_PROPS[key] ?? "").trim();
  }

  return {
    ...out,
    ...getManageSectionInitialValues(PREFIX, src),
  };
}

function getPayload(values) {
  const payload = {};

  for (const key of Object.keys(DEFAULT_VOLUNTEERS_FEEDBACK_PROPS)) {
    if (BOOLEAN_KEYS.includes(key)) {
      payload[key] = values[key] !== false;
      continue;
    }
    if (NUMBER_KEYS.includes(key)) {
      payload[key] = parseNumber(values[key], DEFAULT_VOLUNTEERS_FEEDBACK_PROPS[key]);
      continue;
    }
    payload[key] = String(values[key] ?? "").trim();
  }

  return payload;
}

function VolunteersFeedbackEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onDataLoad,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);

    if (isPageBlock) {
      const normalized = normalizeData(initialDataProp);
      setInitialData(normalized);
      onDataLoad?.(normalized);

      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [
              ...new Set([
                ...Object.keys(palette),
                ...customColors.map((c) => c?.name).filter(Boolean),
              ]),
            ].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    setInitialData(null);
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const normalized = normalizeData(data);
        setInitialData(normalized);
        onDataLoad?.(normalized);

        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Volunteers Feedback"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp, onDataLoad]);

  useEffect(() => {
    if (initialData) form.setFieldsValue(initialData);
  }, [form, initialData]);

  const handleUpdate = () =>
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...getPayload(values),
        ...getManageSectionPayload(PREFIX, values),
      };

      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.(payload);
        return;
      }

      setSaving(true);
      return fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d?.error || d));
          return res.json();
        })
        .then((saved) => {
          message.success("Volunteers Feedback saved");
          onSuccess?.(saved || payload);
        })
        .catch((err) => {
          message.error(err?.error || "Failed to save Volunteers Feedback");
          throw err;
        })
        .finally(() => setSaving(false));
    });

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const renderThemeColorSelect = (name, label, placeholder = "From theme (default)") => (
    <Form.Item name={name} label={label}>
      <Select
        options={themeColorOptions}
        placeholder={placeholder}
        allowClear
        showSearch
        optionFilterProp="label"
      />
    </Form.Item>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialData}
      key="volunteers-feedback-edit-form"
    >
      <Collapse
        defaultActiveKey={["section", "title-colors", "content"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                titleListItems={TITLE_LIST_ITEMS}
                colorListItems={COLOR_LIST_ITEMS}
              />
            ),
          },
          {
            key: "content",
            label: "Form Content",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="volunteersFeedbackDescription" label="Description">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteersFeedbackNameLabel" label="Name label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteersFeedbackEmailLabel" label="Email label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteersFeedbackPhoneLabel" label="Phone label">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteersFeedbackMessageLabel" label="Message label">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteersFeedbackNamePlaceholder" label="Name placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteersFeedbackEmailPlaceholder" label="Email placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item name="volunteersFeedbackPhonePlaceholder" label="Phone placeholder">
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackMessagePlaceholder"
                    label="Message placeholder"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteersFeedbackSubmitText" label="Submit button text">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteersFeedbackSubmittingText" label="Submitting text">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteersFeedbackRequiredMarker" label="Required marker">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="volunteersFeedbackPageValue"
                    label="Submission page value"
                    extra="Leave empty to auto-use current page URL."
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="volunteersFeedbackSourceValue" label="Submission source value">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "messages",
            label: "Notifications & Validation",
            children: (
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="volunteersFeedbackSuccessTitle"
                    label="Success notification title"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackSuccessMessage"
                    label="Success notification message"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackFailureTitle"
                    label="Failure notification title"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackFailureMessage"
                    label="Failure notification message"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="volunteersFeedbackErrorNameRequired"
                    label="Name required error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorNameInvalid"
                    label="Name invalid error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorEmailRequired"
                    label="Email required error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorEmailInvalid"
                    label="Email invalid error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorPhoneRequired"
                    label="Phone required error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorPhoneInvalid"
                    label="Phone invalid error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorMessageRequired"
                    label="Message required error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackErrorMessageMin"
                    label="Message min-length error"
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="volunteersFeedbackMessageMinLength"
                    label="Message minimum length"
                  >
                    <InputNumber min={1} max={200} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "background",
            label: "Hero Background",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="volunteersFeedbackHeroBgDesktop" label="Desktop background image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Main top background image."
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="volunteersFeedbackHeroBgMobile" label="Mobile background image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Optional mobile-specific background."
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="volunteersFeedbackHeroOverlay"
                    label="Hero overlay color (CSS value)"
                  >
                    <Input placeholder="rgba(0,0,0,0.45)" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackHeroMinHeight" label="Hero height desktop (px)">
                    <InputNumber min={160} max={900} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackHeroMinHeightMobile" label="Hero height mobile (px)">
                    <InputNumber min={120} max={700} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "style",
            label: "Style & Typography",
            children: (
              <Row gutter={[16, 12]}>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackCardBgColorKey", "Card background")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackCardBorderColorKey", "Card border")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackLabelColorKey", "Label color")}
                </Col>

                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackInputBgColorKey", "Input background")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackInputBorderColorKey", "Input border")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackInputTextColorKey", "Input text")}
                </Col>

                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackPlaceholderColorKey", "Placeholder color")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackErrorColorKey", "Validation error color")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackRequiredStarColorKey", "Required marker color")}
                </Col>

                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackButtonBgColorKey", "Button background")}
                </Col>
                <Col xs={24} md={8}>
                  {renderThemeColorSelect("volunteersFeedbackButtonTextColorKey", "Button text")}
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="volunteersFeedbackCardShadow" label="Card shadow (CSS value)">
                    <Input placeholder="0 10px 28px rgba(0,0,0,0.12)" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackCardMaxWidth" label="Card max-width (px)">
                    <InputNumber min={600} max={1800} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackCardOverlap" label="Card overlap (px)">
                    <InputNumber min={0} max={220} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackCardRadius" label="Card radius (px)">
                    <InputNumber min={0} max={60} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackCardPadding" label="Card padding (px)">
                    <InputNumber min={12} max={80} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackGridColumnGap" label="Grid column gap (px)">
                    <InputNumber min={8} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackGridRowGap" label="Grid row gap (px)">
                    <InputNumber min={8} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackFieldGap" label="Field gap (px)">
                    <InputNumber min={8} max={36} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackInputHeight" label="Input height (px)">
                    <InputNumber min={36} max={90} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    name="volunteersFeedbackTextAreaMinHeight"
                    label="Textarea min-height (px)"
                  >
                    <InputNumber min={54} max={300} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackSubmitRadius" label="Button radius (px)">
                    <InputNumber min={0} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackSubmitPaddingY" label="Button padding Y (px)">
                    <InputNumber min={6} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackSubmitPaddingX" label="Button padding X (px)">
                    <InputNumber min={10} max={48} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackSubTitleSize" label="Subtitle size (px)">
                    <InputNumber min={11} max={40} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackSubTitleWeight" label="Subtitle weight">
                    <InputNumber min={300} max={900} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackTitleSize" label="Title size (px)">
                    <InputNumber min={15} max={56} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackTitleLineHeight" label="Title line-height">
                    <InputNumber min={1} max={2.2} step={0.01} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    name="volunteersFeedbackDescriptionSize"
                    label="Description size (px)"
                  >
                    <InputNumber min={11} max={32} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="volunteersFeedbackDescriptionLineHeight"
                    label="Description line-height"
                  >
                    <InputNumber min={1} max={2.2} step={0.01} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackLabelSize" label="Label size (px)">
                    <InputNumber min={10} max={30} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackInputFontSize" label="Input size (px)">
                    <InputNumber min={11} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item name="volunteersFeedbackButtonFontSize" label="Button size (px)">
                    <InputNumber min={11} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      {saving ? (
        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          Saving...
        </div>
      ) : null}
    </Form>
  );
}

export default forwardRef(VolunteersFeedbackEditForm);
