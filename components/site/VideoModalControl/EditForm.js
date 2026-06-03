"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { buildThemeColorOptionsSafe } from "@/lib/themeColors";
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
import { normalizeLinkTarget } from "@/lib/linkUtils";

const API_PATH = "/api/theme/VideoModalControl";
const PREFIX = "videoModalControl";

const DEFAULTS = Object.freeze({
  mainTitle: "Videos",
  subTitle: "",
  titleAlign: "left",
  cardVariant: "videos",
  headerButtonText: "Watch All Videos",
  headerButtonLink: "",
  headerButtonTarget: "_self",
  headerButtonNewTab: false,
  coverHeightDesktop: 190,
  coverHeightMobile: 160,
  playButtonSize: 56,
  playIconSize: 18,
  columnsDesktop: 3,
  columnsTablet: 2,
  columnsMobile: 1,
  cardGap: 18,
  cardRadius: 18,
  cardPaddingX: 18,
  cardPaddingY: 18,
  descriptionFontSizeDesktop: 34,
  descriptionFontSizeMobile: 24,
  descriptionFontWeight: 700,
  dateFontSizeDesktop: 21,
  dateFontSizeMobile: 17,
  dateFontWeight: 500,
  items: [
    {
      description: "Demo Day Highlights - Cohort Showcase",
      dateText: "",
      videoUrl: "",
      coverImageUrl: "",
      playIconUrl: "",
    },
    {
      description: "Founder Masterclass Series",
      dateText: "",
      videoUrl: "",
      coverImageUrl: "",
      playIconUrl: "",
    },
    {
      description: "Community Sessions",
      dateText: "",
      videoUrl: "",
      coverImageUrl: "",
      playIconUrl: "",
    },
  ],
});

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const VARIANT_OPTIONS = [
  { label: "Videos", value: "videos" },
  { label: "Podcasts", value: "podcasts" },
];

function getTitleColorsConfig() {
  return {
    ...getTitleAndColorsConfig("VideoModalControl"),
    titleListItems: [],
  };
}

function getVideoModalColorItems() {
  return getTitleAndColorsConfig("VideoModalControl")?.colorListItems || [];
}

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function normalizeAlign(value, fallback = "left") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeCardVariant(value, fallback = "videos") {
  const next = String(value ?? fallback).trim().toLowerCase();
  return next === "podcasts" ? "podcasts" : "videos";
}

function toOptionalNumber(value, min, max) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  if (Number.isFinite(min) && num < min) return min;
  if (Number.isFinite(max) && num > max) return max;
  return num;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeVideoHeaderButtonTarget(value) {
  return normalizeLinkTarget(value, "_self");
}

function normalizeItemForForm(raw = {}) {
  return {
    description: trimValue(
      raw?.description ?? raw?.title ?? raw?.label ?? raw?.text,
      "",
    ),
    dateText: trimValue(raw?.dateText ?? raw?.date ?? raw?.meta, ""),
    videoUrl: trimValue(
      raw?.videoUrl ??
        raw?.youtubeUrl ??
        raw?.video ??
        raw?.url ??
        raw?.mediaUrl ??
        raw?.playLink ??
        raw?.buttonLink ??
        raw?.link ??
        raw?.href,
      "",
    ),
    coverImageUrl: trimValue(
      raw?.coverImageUrl ?? raw?.cover ?? raw?.image ?? raw?.thumbnail,
      "",
    ),
    playIconUrl: trimValue(raw?.playIconUrl ?? raw?.iconUrl ?? raw?.playIcon, ""),
  };
}

function normalizeItemsForForm(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return DEFAULTS.items.map((item) => ({ ...item }));
  }
  const normalized = rawItems
    .map((item) => normalizeItemForForm(item))
    .filter((item) => item.description || item.videoUrl || item.coverImageUrl);
  if (normalized.length === 0) {
    return DEFAULTS.items.map((item) => ({ ...item }));
  }
  return normalized;
}

function buildThemeColorOptions(theme = {}) {
  return buildThemeColorOptionsSafe(theme);
}

function applyFormValues(form, data = {}) {
  const colorFieldValues = {};
  getVideoModalColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    colorFieldValues[fieldName] = trimValue(data[fieldName], "");
  });

  form.setFieldsValue({
    mainTitle: trimValue(data.mainTitle, DEFAULTS.mainTitle),
    subTitle: trimValue(data.subTitle, DEFAULTS.subTitle),
    titleAlign: normalizeAlign(data.titleAlign, DEFAULTS.titleAlign),
    videoModalControlCardVariant: normalizeCardVariant(
      data.videoModalControlCardVariant,
      DEFAULTS.cardVariant,
    ),
    videoModalControlHeaderButtonText: trimValue(
      data.videoModalControlHeaderButtonText,
      DEFAULTS.headerButtonText,
    ),
    videoModalControlHeaderButtonLink: trimValue(
      data.videoModalControlHeaderButtonLink,
      DEFAULTS.headerButtonLink,
    ),
    videoModalControlHeaderButtonTarget: normalizeVideoHeaderButtonTarget(
      data.videoModalControlHeaderButtonTarget ??
        data.videoModalControlHeaderButtonNewTab,
    ),
    videoModalControlHeaderButtonNewTab:
      toBoolean(
        data.videoModalControlHeaderButtonNewTab,
        DEFAULTS.headerButtonNewTab,
      ) === true,
    videoModalControlItems: normalizeItemsForForm(
      data.videoModalControlItems ?? data.cards ?? data.items,
    ),
    videoModalControlCoverHeightDesktop:
      toOptionalNumber(data.videoModalControlCoverHeightDesktop, 80, 700) ??
      DEFAULTS.coverHeightDesktop,
    videoModalControlCoverHeightMobile:
      toOptionalNumber(data.videoModalControlCoverHeightMobile, 80, 500) ??
      DEFAULTS.coverHeightMobile,
    videoModalControlPlayButtonSize:
      toOptionalNumber(data.videoModalControlPlayButtonSize, 24, 180) ??
      DEFAULTS.playButtonSize,
    videoModalControlPlayIconSize:
      toOptionalNumber(data.videoModalControlPlayIconSize, 10, 120) ??
      DEFAULTS.playIconSize,
    videoModalControlColumnsDesktop:
      toOptionalNumber(data.videoModalControlColumnsDesktop, 1, 6) ??
      DEFAULTS.columnsDesktop,
    videoModalControlColumnsTablet:
      toOptionalNumber(data.videoModalControlColumnsTablet, 1, 4) ??
      DEFAULTS.columnsTablet,
    videoModalControlColumnsMobile:
      toOptionalNumber(data.videoModalControlColumnsMobile, 1, 2) ??
      DEFAULTS.columnsMobile,
    videoModalControlCardGap:
      toOptionalNumber(data.videoModalControlCardGap, 0, 120) ??
      DEFAULTS.cardGap,
    videoModalControlCardRadius:
      toOptionalNumber(data.videoModalControlCardRadius, 0, 120) ??
      DEFAULTS.cardRadius,
    videoModalControlCardPaddingX:
      toOptionalNumber(data.videoModalControlCardPaddingX, 0, 120) ??
      DEFAULTS.cardPaddingX,
    videoModalControlCardPaddingY:
      toOptionalNumber(data.videoModalControlCardPaddingY, 0, 120) ??
      DEFAULTS.cardPaddingY,
    videoModalControlDescriptionFontSizeDesktop:
      toOptionalNumber(data.videoModalControlDescriptionFontSizeDesktop, 10, 120) ??
      DEFAULTS.descriptionFontSizeDesktop,
    videoModalControlDescriptionFontSizeMobile:
      toOptionalNumber(data.videoModalControlDescriptionFontSizeMobile, 10, 120) ??
      DEFAULTS.descriptionFontSizeMobile,
    videoModalControlDescriptionFontWeight:
      toOptionalNumber(data.videoModalControlDescriptionFontWeight, 100, 900) ??
      DEFAULTS.descriptionFontWeight,
    videoModalControlDateFontSizeDesktop:
      toOptionalNumber(data.videoModalControlDateFontSizeDesktop, 10, 80) ??
      DEFAULTS.dateFontSizeDesktop,
    videoModalControlDateFontSizeMobile:
      toOptionalNumber(data.videoModalControlDateFontSizeMobile, 10, 80) ??
      DEFAULTS.dateFontSizeMobile,
    videoModalControlDateFontWeight:
      toOptionalNumber(data.videoModalControlDateFontWeight, 100, 900) ??
      DEFAULTS.dateFontWeight,
    ...getManageSectionInitialValues(PREFIX, data),
    ...colorFieldValues,
  });
}

function buildPayload(values = {}) {
  const payload = {
    ...values,
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: trimValue(values.mainTitle, ""),
    subTitle: trimValue(values.subTitle, ""),
    titleAlign: normalizeAlign(values.titleAlign, DEFAULTS.titleAlign),
    videoModalControlCardVariant: normalizeCardVariant(
      values.videoModalControlCardVariant,
      DEFAULTS.cardVariant,
    ),
    videoModalControlHeaderButtonText: trimValue(
      values.videoModalControlHeaderButtonText,
      "",
    ),
    videoModalControlHeaderButtonLink: trimValue(
      values.videoModalControlHeaderButtonLink,
      "",
    ),
    videoModalControlHeaderButtonTarget: normalizeVideoHeaderButtonTarget(
      values.videoModalControlHeaderButtonTarget,
    ),
    videoModalControlHeaderButtonNewTab:
      normalizeVideoHeaderButtonTarget(
        values.videoModalControlHeaderButtonTarget,
      ) === "_blank",
    videoModalControlItems: (Array.isArray(values.videoModalControlItems)
      ? values.videoModalControlItems
      : []
    )
      .map((item) => {
        const normalized = normalizeItemForForm(item);
        return {
          ...normalized,
          youtubeUrl: normalized.videoUrl,
        };
      })
      .filter((item) => item.description || item.videoUrl || item.coverImageUrl),
    videoModalControlCoverHeightDesktop: toOptionalNumber(
      values.videoModalControlCoverHeightDesktop,
      80,
      700,
    ),
    videoModalControlCoverHeightMobile: toOptionalNumber(
      values.videoModalControlCoverHeightMobile,
      80,
      500,
    ),
    videoModalControlPlayButtonSize: toOptionalNumber(
      values.videoModalControlPlayButtonSize,
      24,
      180,
    ),
    videoModalControlPlayIconSize: toOptionalNumber(
      values.videoModalControlPlayIconSize,
      10,
      120,
    ),
    videoModalControlColumnsDesktop: toOptionalNumber(
      values.videoModalControlColumnsDesktop,
      1,
      6,
    ),
    videoModalControlColumnsTablet: toOptionalNumber(
      values.videoModalControlColumnsTablet,
      1,
      4,
    ),
    videoModalControlColumnsMobile: toOptionalNumber(
      values.videoModalControlColumnsMobile,
      1,
      2,
    ),
    videoModalControlCardGap: toOptionalNumber(
      values.videoModalControlCardGap,
      0,
      120,
    ),
    videoModalControlCardRadius: toOptionalNumber(
      values.videoModalControlCardRadius,
      0,
      120,
    ),
    videoModalControlCardPaddingX: toOptionalNumber(
      values.videoModalControlCardPaddingX,
      0,
      120,
    ),
    videoModalControlCardPaddingY: toOptionalNumber(
      values.videoModalControlCardPaddingY,
      0,
      120,
    ),
    videoModalControlDescriptionFontSizeDesktop: toOptionalNumber(
      values.videoModalControlDescriptionFontSizeDesktop,
      10,
      120,
    ),
    videoModalControlDescriptionFontSizeMobile: toOptionalNumber(
      values.videoModalControlDescriptionFontSizeMobile,
      10,
      120,
    ),
    videoModalControlDescriptionFontWeight: toOptionalNumber(
      values.videoModalControlDescriptionFontWeight,
      100,
      900,
    ),
    videoModalControlDateFontSizeDesktop: toOptionalNumber(
      values.videoModalControlDateFontSizeDesktop,
      10,
      80,
    ),
    videoModalControlDateFontSizeMobile: toOptionalNumber(
      values.videoModalControlDateFontSizeMobile,
      10,
      80,
    ),
    videoModalControlDateFontWeight: toOptionalNumber(
      values.videoModalControlDateFontWeight,
      100,
      900,
    ),
  };

  getVideoModalColorItems().forEach((item) => {
    const fieldName = item?.name;
    if (!fieldName) return;
    payload[fieldName] = trimValue(values[fieldName], "");
  });

  return payload;
}

function VideoModalControlEditForm(
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
      .catch(() => message.error("Failed to load Video Modal Control"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const payload = buildPayload(form.getFieldsValue(true));

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
            message.success("Video Modal Control saved");
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
        defaultActiveKey={[
          "manage-section",
          "title-colors",
          "content",
          "media",
          "cards",
          "typography",
          "layout",
        ]}
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
                  <Form.Item name="mainTitle" label="Main title">
                    <Input placeholder="Videos" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subTitle" label="Subtitle">
                    <Input placeholder="Optional subtitle" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="titleAlign"
                    label="Title align"
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
                    name="videoModalControlCardVariant"
                    label="Card variant"
                    rules={[{ required: true, message: "Variant is required" }]}
                  >
                    <Select
                      options={VARIANT_OPTIONS}
                      placeholder="Select card variant"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="videoModalControlHeaderButtonText"
                    label="Header button text"
                  >
                    <Input placeholder="Watch All Videos" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="videoModalControlHeaderButtonLink"
                    label="Header button link"
                  >
                    <Input placeholder="/videos" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="videoModalControlHeaderButtonTarget"
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
            key: "media",
            label: "Media",
            children: (
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlCoverHeightDesktop"
                    label="Cover height desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={80} max={700} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlCoverHeightMobile"
                    label="Cover height mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={80} max={500} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlPlayButtonSize"
                    label="Play button size (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={24} max={180} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlPlayIconSize"
                    label="Play icon size (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={10} max={120} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "cards",
            label: "Cards",
            children: (
              <Form.List name="videoModalControlItems">
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
                      description: "",
                      dateText: "",
                      videoUrl: "",
                      coverImageUrl: "",
                      playIconUrl: "",
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 8]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "description"]}
                            label="Description"
                            rules={[
                              {
                                required: true,
                                message: "Description is required",
                              },
                            ]}
                          >
                            <Input.TextArea
                              rows={2}
                              placeholder="Demo Day Highlights - Cohort Showcase"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "dateText"]} label="Date">
                            <Input placeholder="18 Apr, 2026 16:32" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "videoUrl"]}
                            label="Video URL"
                            rules={[
                              {
                                required: true,
                                message: "Video URL is required",
                              },
                            ]}
                          >
                            <Input
                              placeholder="https://www.youtube.com/watch?v=..."
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "coverImageUrl"]}
                            label="Cover image"
                            extra="Optional. Default design is shown when empty."
                          >
                            <MediaPickerInput
                              placeholder="/media/video-cover.jpg"
                              uiVariant="stacked"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "playIconUrl"]}
                            label="Play icon (optional override)"
                            extra="If empty, default play icon above is used."
                          >
                            <MediaPickerInput
                              placeholder="/media/icons/play.svg"
                              uiVariant="stacked"
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
          {
            key: "typography",
            label: "Font Settings",
            children: (
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDescriptionFontSizeDesktop"
                    label="Description size desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={10} max={120} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDescriptionFontSizeMobile"
                    label="Description size mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={10} max={120} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDescriptionFontWeight"
                    label="Description font weight"
                  >
                    <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDateFontSizeDesktop"
                    label="Date size desktop (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={10} max={80} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDateFontSizeMobile"
                    label="Date size mobile (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={10} max={80} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlDateFontWeight"
                    label="Date font weight"
                  >
                    <InputNumber style={{ width: "100%" }} min={100} max={900} step={100} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "layout",
            label: "Layout",
            children: (
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="videoModalControlColumnsDesktop"
                    label="Columns desktop"
                  >
                    <InputNumber style={{ width: "100%" }} min={1} max={6} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="videoModalControlColumnsTablet"
                    label="Columns tablet"
                  >
                    <InputNumber style={{ width: "100%" }} min={1} max={4} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="videoModalControlColumnsMobile"
                    label="Columns mobile"
                  >
                    <InputNumber style={{ width: "100%" }} min={1} max={2} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="videoModalControlCardGap" label="Card gap (px)">
                    <InputNumber style={{ width: "100%" }} min={0} max={120} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="videoModalControlCardRadius" label="Card radius (px)">
                    <InputNumber style={{ width: "100%" }} min={0} max={120} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlCardPaddingX"
                    label="Card horizontal padding (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={0} max={120} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="videoModalControlCardPaddingY"
                    label="Card vertical padding (px)"
                  >
                    <InputNumber style={{ width: "100%" }} min={0} max={120} />
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

export default forwardRef(VideoModalControlEditForm);
