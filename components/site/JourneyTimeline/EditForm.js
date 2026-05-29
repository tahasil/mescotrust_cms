"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse, Select, Row, Col } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import { normalizeLinkTarget } from "@/lib/linkUtils";

const API_PATH = "/api/theme/JourneyTimeline";
const PREFIX = "journeyTimeline";

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const DEFAULT_CARDS = [
  {
    title: "Scouting Ongoing",
    highlightText: "",
    bulletPoints: [
      "Online and physical outreach to engage the community.",
      "Ideas assessed in early phase based on two-level shortlisting mechanism.",
      "At least Business, Technical and Financial due diligence done.",
    ],
    tags: [],
  },
  {
    title: "Incubation Program - 3 Months",
    highlightText: "",
    bulletPoints: [
      "A structured 3-phase incubation program focusing on:",
      "Mentor-led sessions with weekly reviews.",
      "Showcase day to share our work with the wider community.",
    ],
    tags: ["Product-Market Fit", "Business Model Review", "Financial Readiness"],
  },
  {
    title: "Portfolio Management - 3 Months",
    highlightText: "",
    bulletPoints: [
      "Support ongoing programmes.",
      "Enable partner relationship support.",
      "Access to value-added partners.",
      "Hands-on support post incubation.",
    ],
    tags: [],
  },
];

function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("JourneyTimeline"),
    titleListItems: [],
  };
}

function getJourneyColorItems() {
  return getTitleAndColorsConfig("JourneyTimeline")?.colorListItems || [];
}

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function normalizeAlign(value, fallback = "center") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeArrayOfStrings(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === "string" ? item : item?.text))
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function linesToArray(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function csvToArray(value) {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeJourneyButtonTarget(value) {
  return normalizeLinkTarget(value, "_self");
}

function normalizeCardForForm(raw = {}) {
  const bulletPoints = normalizeArrayOfStrings(
    raw?.bulletPoints || raw?.points || raw?.list,
  );
  const tags = normalizeArrayOfStrings(raw?.tags || []);
  return {
    title: trimValue(raw?.title, ""),
    highlightText: trimValue(raw?.highlightText || raw?.duration, ""),
    bulletPointsText: bulletPoints.join("\n"),
    tagsText: tags.join(", "),
  };
}

function normalizeCardsForForm(rawCards) {
  if (!Array.isArray(rawCards) || rawCards.length === 0) {
    return DEFAULT_CARDS.map((card) => normalizeCardForForm(card));
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
  getJourneyColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    colorFieldValues[fieldName] = trimValue(data[fieldName], "");
  });

  form.setFieldsValue({
    mainTitle: trimValue(data.mainTitle, "Section Title"),
    subTitle: trimValue(data.subTitle, "Subtitle"),
    titleAlign: normalizeAlign(data.titleAlign, "center"),
    journeyTimelineImageDesktop: trimValue(
      data.journeyTimelineImageDesktop ?? data.journeyTimelineSectionImageDesktop,
      "",
    ),
    journeyTimelineImageMobile: trimValue(
      data.journeyTimelineImageMobile ?? data.journeyTimelineSectionImageMobile,
      "",
    ),
    journeyTimelineImageAlt: trimValue(
      data.journeyTimelineImageAlt ?? data.journeyTimelineSectionImageAlt,
      "Journey timeline",
    ),
    journeyTimelineApplyButtonText: trimValue(
      data.journeyTimelineApplyButtonText ??
        data.journeyTimelineSectionApplyButtonText,
      "Apply Now",
    ),
    journeyTimelineApplyButtonLink: trimValue(
      data.journeyTimelineApplyButtonLink ??
        data.journeyTimelineSectionApplyButtonLink,
      "#",
    ),
    journeyTimelineApplyButtonTarget: normalizeJourneyButtonTarget(
      data.journeyTimelineApplyButtonTarget ??
        data.journeyTimelineSectionApplyButtonTarget ??
        data.journeyTimelineApplyButtonNewTab ??
        data.journeyTimelineSectionApplyButtonNewTab,
    ),
    journeyTimelineApplyButtonNewTab:
      data.journeyTimelineApplyButtonNewTab === true ||
      data.journeyTimelineSectionApplyButtonNewTab === true,
    journeyTimelineCards: normalizeCardsForForm(
      data.journeyTimelineCards ?? data.journeyTimelineSectionCards,
    ),
    ...getManageSectionInitialValues(PREFIX, data),
    ...colorFieldValues,
  });
}

function buildPayload(values = {}) {
  const payload = {
    ...values,
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: trimValue(values.mainTitle, "Section Title"),
    subTitle: trimValue(values.subTitle, "Subtitle"),
    titleAlign: normalizeAlign(values.titleAlign, "center"),
    journeyTimelineImageDesktop: trimValue(values.journeyTimelineImageDesktop, ""),
    journeyTimelineImageMobile: trimValue(values.journeyTimelineImageMobile, ""),
    journeyTimelineImageAlt: trimValue(values.journeyTimelineImageAlt, "Journey timeline"),
    journeyTimelineApplyButtonText: trimValue(
      values.journeyTimelineApplyButtonText,
      "Apply Now",
    ),
    journeyTimelineApplyButtonLink: trimValue(
      values.journeyTimelineApplyButtonLink,
      "#",
    ),
    journeyTimelineApplyButtonTarget: normalizeJourneyButtonTarget(
      values.journeyTimelineApplyButtonTarget,
    ),
    journeyTimelineApplyButtonNewTab:
      normalizeJourneyButtonTarget(values.journeyTimelineApplyButtonTarget) ===
      "_blank",
    journeyTimelineCards: (Array.isArray(values.journeyTimelineCards)
      ? values.journeyTimelineCards
      : []
    ).map((card) => ({
      title: trimValue(card?.title, "Timeline Card"),
      highlightText: trimValue(card?.highlightText, ""),
      bulletPoints: linesToArray(card?.bulletPointsText),
      tags: csvToArray(card?.tagsText),
    })),
  };

  getJourneyColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    payload[fieldName] = trimValue(values[fieldName], "");
  });

  return payload;
}

/**
 * Edit form for JourneyTimeline used in component/page drawer.
 * Saves all content text fields, colors and media fields.
 */
function JourneyTimelineEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    onCancel,
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
      .catch(() => message.error("Failed to load JourneyTimeline"))
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
            message.success("Journey Timeline saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content", "image", "button", "cards"]}
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
                    rules={[{ required: true, message: "Subtitle is required" }]}
                  >
                    <Input placeholder="Subtitle" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mainTitle"
                    label="Main title"
                    rules={[{ required: true, message: "Main title is required" }]}
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
              </Row>
            ),
          },
          {
            key: "image",
            label: "Image",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="journeyTimelineImageDesktop"
                    label="Desktop image"
                    extra="Recommended size: 1280 x 900 px (landscape)."
                  >
                    <MediaPickerInput
                      placeholder="/images/journey-timeline-desktop.jpg"
                      uiVariant="stacked"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="journeyTimelineImageMobile"
                    label="Mobile image"
                    extra="Recommended size: 900 x 1200 px (portrait)."
                  >
                    <MediaPickerInput
                      placeholder="/images/journey-timeline-mobile.jpg"
                      uiVariant="stacked"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="journeyTimelineImageAlt" label="Image alt text">
                    <Input placeholder="Journey timeline" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "button",
            label: "Apply Button",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item
                    name="journeyTimelineApplyButtonText"
                    label="Button text"
                  >
                    <Input placeholder="Apply Now" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="journeyTimelineApplyButtonLink"
                    label="Button link"
                  >
                    <Input placeholder="https://example.com/apply" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="journeyTimelineApplyButtonTarget"
                    label="Target"
                    initialValue="_self"
                  >
                    <Select
                      size="large"
                      options={[
                        { label: "Same tab (_self)", value: "_self" },
                        { label: "New tab (_blank)", value: "_blank" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "cards",
            label: "Right Cards",
            children: (
              <Form.List name="journeyTimelineCards">
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
                      highlightText: "",
                      bulletPointsText: "",
                      tagsText: "",
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 8]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "title"]}
                            label="Card title"
                            rules={[{ required: true, message: "Card title is required" }]}
                          >
                            <Input placeholder="Scouting Ongoing" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "highlightText"]}
                            label="Highlight text (optional)"
                          >
                            <Input placeholder="3 Months" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "bulletPointsText"]}
                            label="Bullet points (one per line)"
                            rules={[{ required: true, message: "Add at least one bullet point" }]}
                          >
                            <Input.TextArea
                              rows={5}
                              placeholder={"First bullet line\nSecond bullet line\nThird bullet line"}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "tagsText"]}
                            label="Tags (comma separated)"
                          >
                            <Input
                              placeholder="Product-Market Fit, Business Model Review"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(JourneyTimelineEditForm);
