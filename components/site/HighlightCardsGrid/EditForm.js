"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  message,
  Spin,
  Collapse,
  Select,
  Row,
  Col,
  InputNumber,
  Switch,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/HighlightCardsGrid";
const PREFIX = "highlightCardsGrid";

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const CARD_DESIGN_OPTIONS = [
  { label: "Card Style 1", value: "style-1" },
  { label: "Card Style 2", value: "style-2" },
];

function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("HighlightCardsGrid"),
    titleListItems: [],
  };
}

function getHighlightColorItems() {
  return getTitleAndColorsConfig("HighlightCardsGrid")?.colorListItems || [];
}

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function trimOptionalText(value, fallbackWhenMissing = "") {
  if (value == null) return fallbackWhenMissing;
  return String(value).trim();
}

function normalizeAlign(value, fallback = "center") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeCardDesign(value) {
  const next = String(value ?? "").trim().toLowerCase();
  if (
    next === "style-2" ||
    next === "style2" ||
    next === "newdesign" ||
    next === "new" ||
    next === "metricaccent" ||
    next === "metric"
  ) {
    return "style-2";
  }
  if (
    next === "style-1" ||
    next === "style1" ||
    next === "standard" ||
    next === "existing" ||
    next === "minimal"
  ) {
    return "style-1";
  }
  return "style-1";
}

function toOptionalNumber(value, min, max) {
  if (value == null || value === "") return undefined;
  const next = Number(value);
  if (!Number.isFinite(next)) return undefined;
  if (Number.isFinite(min) && next < min) return min;
  if (Number.isFinite(max) && next > max) return max;
  return next;
}

function normalizeCardForForm(raw = {}) {
  return {
    title: trimValue(raw?.title, ""),
    description: trimValue(
      raw?.description || raw?.text || raw?.content,
      "",
    ),
    iconUrl: trimValue(raw?.iconUrl || raw?.icon || raw?.image, ""),
  };
}

function normalizeCardsForForm(rawCards) {
  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    return [];
  }
  return rawCards.map((card) => normalizeCardForForm(card));
}

function buildThemeColorOptions(theme = {}) {
  const palette =
    theme?.frontendUiColors && typeof theme.frontendUiColors === "object"
      ? theme.frontendUiColors
      : theme?.themePalette && typeof theme.themePalette === "object"
        ? theme.themePalette
        : {};
  const names = Object.keys(palette).sort();
  return names.map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data = {}) {
  const colorFieldValues = {};
  getHighlightColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    colorFieldValues[fieldName] = trimValue(data[fieldName], "");
  });

  form.setFieldsValue({
    mainTitle: trimOptionalText(data.mainTitle, ""),
    subTitle: trimOptionalText(data.subTitle, ""),
    titleAlign: normalizeAlign(data.titleAlign, "center"),
    highlightCardsGridCardDesign: normalizeCardDesign(
      data.highlightCardsGridCardDesign ??
        data.cardDesign ??
        data?.highlightCardsGridCards?.[0]?.cardDesign ??
        data?.cards?.[0]?.cardDesign,
    ),
    highlightCardsGridBottomText: trimValue(
      data.highlightCardsGridBottomText ?? data.bottomText,
      "",
    ),
    highlightCardsGridCards: normalizeCardsForForm(
      data.highlightCardsGridCards ?? data.cards,
    ),
    highlightCardsGridEnableCardHover:
      data?.highlightCardsGridEnableCardHover !== false,
    highlightCardsGridIconSizeDesktop: data?.highlightCardsGridIconSizeDesktop,
    highlightCardsGridIconSizeMobile: data?.highlightCardsGridIconSizeMobile,
    highlightCardsGridStyle2CardHeightDesktop:
      data?.highlightCardsGridStyle2CardHeightDesktop,
    highlightCardsGridStyle2CardHeightMobile:
      data?.highlightCardsGridStyle2CardHeightMobile,
    ...getManageSectionInitialValues(PREFIX, data),
    ...colorFieldValues,
  });
}

function buildPayload(values = {}) {
  const payload = {
    ...values,
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: trimOptionalText(values.mainTitle, ""),
    subTitle: trimOptionalText(values.subTitle, ""),
    titleAlign: normalizeAlign(values.titleAlign, "center"),
    highlightCardsGridCardDesign: normalizeCardDesign(
      values.highlightCardsGridCardDesign,
    ),
    highlightCardsGridBottomText: trimValue(
      values.highlightCardsGridBottomText,
      "",
    ),
    highlightCardsGridCards: (Array.isArray(values.highlightCardsGridCards)
      ? values.highlightCardsGridCards
      : []
    ).map((card) => ({
      title: trimValue(card?.title, ""),
      description: trimValue(card?.description, ""),
      iconUrl: trimValue(card?.iconUrl, ""),
    })),
    highlightCardsGridEnableCardHover:
      values.highlightCardsGridEnableCardHover !== false,
    highlightCardsGridIconSizeDesktop: toOptionalNumber(
      values.highlightCardsGridIconSizeDesktop,
      12,
      160,
    ),
    highlightCardsGridIconSizeMobile: toOptionalNumber(
      values.highlightCardsGridIconSizeMobile,
      12,
      160,
    ),
    highlightCardsGridStyle2CardHeightDesktop: toOptionalNumber(
      values.highlightCardsGridStyle2CardHeightDesktop,
      120,
      800,
    ),
    highlightCardsGridStyle2CardHeightMobile: toOptionalNumber(
      values.highlightCardsGridStyle2CardHeightMobile,
      120,
      800,
    ),
  };

  getHighlightColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    payload[fieldName] = trimValue(values[fieldName], "");
  });

  return payload;
}

/**
 * Edit form for HighlightCardsGrid used in component/page drawer.
 * Follows same save/load flow as JourneyTimeline for content + colors.
 */
function HighlightCardsGridEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: themeColorOptionsProp = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => setThemeColorOptions(buildThemeColorOptions(theme)))
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyFormValues(form, initialDataProp ?? {});
      setLoading(false);
      return;
    }

    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => applyFormValues(form, data))
      .catch(() => message.error("Failed to load HighlightCardsGrid"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = buildPayload(values);

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
          .then((res) => {
            if (!res.ok) return res.json().then((d) => Promise.reject(d));
            return null;
          })
          .then(() => {
            message.success("Highlight Cards Grid saved");
            onSuccess?.();
          })
          .catch((err) => message.error(err?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

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
        defaultActiveKey={["manage-section", "title-colors", "content", "layout", "cards"]}
        items={[
          {
            key: "manage-section",
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
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleColorsConfig()}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="subTitle"
                    label="Subtitle"
                  >
                    <Input placeholder="Subtitle" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mainTitle"
                    label="Main title"
                  >
                    <Input placeholder="Section Title" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="titleAlign"
                    label="Align"
                    rules={[{ required: true, message: "Align is required" }]}
                  >
                    <Select
                      options={ALIGN_OPTIONS}
                      placeholder="Select align"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="highlightCardsGridBottomText"
                    label="Bottom text"
                  >
                    <Input placeholder="Organization" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "cards",
            label: "Cards",
            children: (
              <>
                <Row gutter={[16, 8]}>
                  <Col span={24}>
                    <Form.Item
                      name="highlightCardsGridCardDesign"
                      label="Card design"
                      rules={[
                        { required: true, message: "Card design is required" },
                      ]}
                    >
                      <Select
                        options={CARD_DESIGN_OPTIONS}
                        placeholder="Select card design"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name="highlightCardsGridCards">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Card"
                      addButtonText="Add card"
                      addButtonVariant="icon"
                      defaultAddPayload={{
                        title: "",
                        description: "",
                        iconUrl: "",
                      }}
                      renderItemContent={(name, restField) => (
                        <Row gutter={[16, 8]}>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "title"]}
                              label="Card title"
                            >
                              <Input placeholder="Card title" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "description"]}
                              label="Card description"
                            >
                              <Input.TextArea
                                rows={4}
                                placeholder="Card description"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "iconUrl"]}
                              label="Card icon"
                              extra="Recommended icon size: 96 x 96 px."
                            >
                              <MediaPickerInput
                                placeholder="/icons/highlight-card-icon.svg"
                                uiVariant="stacked"
                                hintText="Optional. Default icon is used when empty."
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )}
                    />
                  )}
                </Form.List>
              </>
            ),
          },
          {
            key: "layout",
            label: "Layout",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="highlightCardsGridEnableCardHover"
                    label="Enable card hover effect"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="highlightCardsGridIconSizeDesktop"
                    label="Icon size desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={12} max={160} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="highlightCardsGridIconSizeMobile"
                    label="Icon size mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={12} max={160} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="highlightCardsGridStyle2CardHeightDesktop"
                    label="Card Style 2 height desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={120} max={800} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="highlightCardsGridStyle2CardHeightMobile"
                    label="Card Style 2 height mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={120} max={800} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(HighlightCardsGridEditForm);
