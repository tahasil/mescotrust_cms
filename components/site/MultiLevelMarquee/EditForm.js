"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse, Row, Col, InputNumber, Switch, Select } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/MultiLevelMarquee";
const PREFIX = "multiLevelMarquee";

const DIRECTION_OPTIONS = [
  { label: "Left to Right", value: "right" },
  { label: "Right to Left", value: "left" },
];

const DEFAULT_MARQUEE = {
  enabled: true,
  direction: "right",
  speed: 30,
  gap: 16,
  pauseOnHover: true,
  items: [],
};

const DEFAULTS = {
  mainTitle: "Ecosystem Partners",
  subTitle: "",
  titleAlign: "center",
  logoCardType: "box",
  logoCardWidth: 130,
  logoCardHeight: 70,
};
const COMPACT_ITEM_STYLE = { marginBottom: 12 };

function trimValue(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function trimOptionalValue(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}

function normalizeAlign(value, fallback = "center") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function normalizeDirection(value, fallback = "left") {
  const next = String(value ?? fallback).trim().toLowerCase();
  return next === "right" ? "right" : "left";
}

function normalizeNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (typeof min === "number" && num < min) return min;
  if (typeof max === "number" && num > max) return max;
  return num;
}

function normalizeLogoCardType(value, fallback = "box") {
  const next = String(value ?? fallback)
    .trim()
    .toLowerCase();
  return next === "transparent" ? "transparent" : "box";
}

function normalizeBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeItem(item) {
  if (typeof item === "string") {
    const url = String(item).trim();
    return {
      urlDesktop: url,
      url: url,
    };
  }

  const urlDesktop =
    item?.urlDesktop != null
      ? String(item.urlDesktop).trim()
      : item?.url != null
        ? String(item.url).trim()
        : item?.src != null
          ? String(item.src).trim()
          : "";

  return {
    urlDesktop,
    url: urlDesktop,
  };
}

function normalizeItemsArray(items, fallbackItems = []) {
  const source = Array.isArray(items) && items.length > 0 ? items : fallbackItems;
  return source
    .map(normalizeItem)
    .filter((it) => Boolean((it.urlDesktop || "").trim()));
}

function normalizeMarqueeItem(raw = {}, fallbackDirection = "right") {
  return {
    enabled: normalizeBool(raw.enabled, DEFAULT_MARQUEE.enabled),
    direction: normalizeDirection(raw.direction, fallbackDirection),
    speed: normalizeNumber(raw.speed, DEFAULT_MARQUEE.speed, 1, 200),
    gap: normalizeNumber(raw.gap, DEFAULT_MARQUEE.gap, 0, 120),
    pauseOnHover: normalizeBool(raw.pauseOnHover, DEFAULT_MARQUEE.pauseOnHover),
    items: normalizeItemsArray(raw.items, []),
  };
}

function normalizeMarqueesFromData(data = {}) {
  if (Array.isArray(data.marquees)) {
    return data.marquees.map((row, idx) =>
      normalizeMarqueeItem(row, idx === 1 ? "left" : "right"),
    );
  }
  return [];
}

function buildThemeColorOptions(theme = {}) {
  const palette =
    theme?.themePalette && typeof theme.themePalette === "object"
      ? theme.themePalette
      : {};
  const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
  const names = [
    ...new Set([
      ...Object.keys(palette),
      ...customColors.map((c) => String(c?.name || "").trim()).filter(Boolean),
    ]),
  ].sort();
  return names.map((name) => ({ label: name, value: name }));
}

function buildInitialValues(data = {}) {
  return {
    ...getManageSectionInitialValues(PREFIX, data),
    mainTitle: trimOptionalValue(data.mainTitle, DEFAULTS.mainTitle),
    subTitle: trimOptionalValue(data.subTitle ?? data.subtitle, DEFAULTS.subTitle),
    titleAlign: normalizeAlign(data.titleAlign, DEFAULTS.titleAlign),
    logoCardType: normalizeLogoCardType(data.logoCardType, DEFAULTS.logoCardType),
    logoCardWidth: normalizeNumber(
      data.logoCardWidth,
      DEFAULTS.logoCardWidth,
      40,
      800,
    ),
    logoCardHeight: normalizeNumber(
      data.logoCardHeight,
      DEFAULTS.logoCardHeight,
      40,
      800,
    ),
    titleColorKey: trimValue(data.titleColorKey, ""),
    subTitleColorKey: trimValue(data.subTitleColorKey, ""),
    marquees: normalizeMarqueesFromData(data),
  };
}

function buildPayload(values = {}) {
  return {
    ...getManageSectionPayload(PREFIX, values),
    mainTitle: trimOptionalValue(values.mainTitle, ""),
    subTitle: trimOptionalValue(values.subTitle, ""),
    titleAlign: normalizeAlign(values.titleAlign, DEFAULTS.titleAlign),
    logoCardType: normalizeLogoCardType(values.logoCardType, DEFAULTS.logoCardType),
    logoCardWidth: normalizeNumber(
      values.logoCardWidth,
      DEFAULTS.logoCardWidth,
      40,
      800,
    ),
    logoCardHeight: normalizeNumber(
      values.logoCardHeight,
      DEFAULTS.logoCardHeight,
      40,
      800,
    ),
    titleColorKey: trimValue(values.titleColorKey, ""),
    subTitleColorKey: trimValue(values.subTitleColorKey, ""),
    marquees: (Array.isArray(values.marquees) ? values.marquees : []).map((row, idx) =>
      normalizeMarqueeItem(row, idx === 1 ? "left" : "right"),
    ),
  };
}

function MultiLevelMarqueeEditForm(
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
  const watchedLogoCardWidth = Form.useWatch("logoCardWidth", form);
  const watchedLogoCardHeight = Form.useWatch("logoCardHeight", form);
  const requiredLogoWidth = normalizeNumber(
    watchedLogoCardWidth,
    DEFAULTS.logoCardWidth,
    40,
    800,
  );
  const requiredLogoHeight = normalizeNumber(
    watchedLogoCardHeight,
    DEFAULTS.logoCardHeight,
    40,
    800,
  );
  const requiredLogoResolutionHint = `Recommended brand logo image (${requiredLogoWidth} x ${requiredLogoHeight}px).`;

  useEffect(() => {
    let active = true;

    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return () => {
        active = false;
      };
    }

    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        if (!active) return;
        setThemeColorOptions(buildThemeColorOptions(theme));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [themeColorOptionsProp]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (isPageBlock) {
      form.setFieldsValue(buildInitialValues(initialDataProp ?? {}));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        if (!active) return;
        form.setFieldsValue(buildInitialValues(data));
        if (!(themeColorOptionsProp?.length > 0)) {
          setThemeColorOptions(buildThemeColorOptions(theme));
        }
      })
      .catch(() => message.error("Failed to load MultiLevelMarquee"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form, isPageBlock, initialDataProp, themeColorOptionsProp]);

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
            message.success("Multi Level Marquee saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
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
                {...getTitleAndColorsConfig("MultiLevelMarquee")}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Row gutter={[16, 0]}>
                  <Col span={24}>
                    <Form.Item name="subTitle" label="Subtitle" style={COMPACT_ITEM_STYLE}>
                      <Input placeholder="Subtitle" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="mainTitle" label="Main title" style={COMPACT_ITEM_STYLE}>
                      <Input placeholder="Ecosystem Partners" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="titleAlign" label="Align" style={COMPACT_ITEM_STYLE}>
                      <Select
                        options={[
                          { label: "Left", value: "left" },
                          { label: "Center", value: "center" },
                          { label: "Right", value: "right" },
                        ]}
                        placeholder="Select align"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="logoCardType"
                      label="Background Card Type"
                      style={COMPACT_ITEM_STYLE}
                    >
                      <Select
                        size="large"
                        options={[
                          { label: "Transparent", value: "transparent" },
                          { label: "Box", value: "box" },
                        ]}
                        placeholder="Select card type"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="logoCardWidth"
                      label="Logo Card Width (px)"
                      rules={[{ required: true, message: "Width is required" }]}
                      style={COMPACT_ITEM_STYLE}
                    >
                      <InputNumber
                        min={40}
                        max={800}
                        style={{ width: "100%" }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="logoCardHeight"
                      label="Logo Card Height (px)"
                      rules={[{ required: true, message: "Height is required" }]}
                      style={COMPACT_ITEM_STYLE}
                    >
                      <InputNumber
                        min={40}
                        max={800}
                        style={{ width: "100%" }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name="marquees">
                  {(marqueeFields, { add, remove, move }) => (
                    <SortableFormList
                      fields={marqueeFields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Row"
                      addButtonVariant="icon"
                      defaultAddPayload={DEFAULT_MARQUEE}
                      renderItemContent={(marqueeName, marqueeRestField) => (
                        <>
                          <Row gutter={[16, 0]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...marqueeRestField}
                                name={[marqueeName, "enabled"]}
                                label="Enable marquee"
                                valuePropName="checked"
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...marqueeRestField}
                                name={[marqueeName, "pauseOnHover"]}
                                label="Pause on Hover"
                                valuePropName="checked"
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...marqueeRestField}
                                name={[marqueeName, "speed"]}
                                label="Speed"
                                rules={[{ required: true, message: "Speed is required" }]}
                                style={COMPACT_ITEM_STYLE}
                              >
                                <InputNumber min={1} max={200} style={{ width: "100%" }} size="large" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...marqueeRestField}
                                name={[marqueeName, "gap"]}
                                label="Gaps"
                                rules={[{ required: true, message: "Gaps is required" }]}
                                style={COMPACT_ITEM_STYLE}
                              >
                                <InputNumber min={0} max={120} style={{ width: "100%" }} size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...marqueeRestField}
                                name={[marqueeName, "direction"]}
                                label="Direction"
                                rules={[{ required: true, message: "Direction is required" }]}
                                style={COMPACT_ITEM_STYLE}
                              >
                                <Select
                                  size="large"
                                  options={DIRECTION_OPTIONS}
                                  placeholder="Select direction"
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.List name={[marqueeName, "items"]}>
                            {(itemFields, itemOps) => (
                              <SortableFormList
                                fields={itemFields}
                                add={itemOps.add}
                                remove={itemOps.remove}
                                move={itemOps.move}
                                itemLabel="Item"
                                addButtonVariant="icon"
                                defaultAddPayload={{ urlDesktop: "", url: "" }}
                                renderItemContent={(itemName, itemRestField) => (
                                  <Row gutter={[16, 0]}>
                                    <Col span={24}>
                                      <Form.Item
                                        {...itemRestField}
                                        name={[itemName, "urlDesktop"]}
                                        label="Brand image"
                                        rules={[{ required: true, message: "Required" }]}
                                        style={COMPACT_ITEM_STYLE}
                                      >
                                        <MediaPickerInput
                                          placeholder="Select brand image"
                                          uiVariant="stacked"
                                          hintText={requiredLogoResolutionHint}
                                          requiredImageWidth={requiredLogoWidth}
                                          requiredImageHeight={requiredLogoHeight}
                                          uploadResolutionErrorMessage="Image resolution is not correct. Please upload an image with the required size."
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                )}
                              />
                            )}
                          </Form.List>
                        </>
                      )}
                    />
                  )}
                </Form.List>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(MultiLevelMarqueeEditForm);
