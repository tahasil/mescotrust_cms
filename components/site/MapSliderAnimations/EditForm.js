"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  Collapse,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Row,
  Select,
  Spin,
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
import { normalizeMapSliderConfig } from "@/lib/mapSliderAnimations";

const API_PATH = "/api/theme/MapSliderAnimations";
const PREFIX = "mapSliderAnimations";
const TITLE_COLORS_CONFIG = {
  ...getTitleAndColorsConfig("MapSliderAnimations"),
  titleListItems: [],
};

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function normalizeAlign(value, fallback = "center") {
  const next = toText(value, fallback).toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function toNumber(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  if (Number.isFinite(min) && next < min) return min;
  if (Number.isFinite(max) && next > max) return max;
  return next;
}

function buildThemeColorOptions(theme = {}) {
  const palette =
    theme?.frontendUiColors && typeof theme.frontendUiColors === "object"
      ? theme.frontendUiColors
      : theme?.themePalette && typeof theme.themePalette === "object"
        ? theme.themePalette
        : {};
  return Object.keys(palette)
    .sort()
    .map((name) => ({ label: name, value: name }));
}

function applyFormValues(form, data = {}) {
  const config = normalizeMapSliderConfig(data?.mapSliderAnimationsConfig, {
    defaultItemCount: 10,
  });

  form.setFieldsValue({
    subTitle: toText(data?.subTitle, ""),
    mainTitle: toText(data?.mainTitle, ""),
    titleAlign: normalizeAlign(data?.titleAlign, "center"),
    titleColorKey: toText(data?.titleColorKey, ""),
    subTitleColorKey: toText(data?.subTitleColorKey, ""),
    mapSliderAnimationsDescription: toText(data?.mapSliderAnimationsDescription, ""),
    mapSliderAnimationsDescriptionColorKey: toText(
      data?.mapSliderAnimationsDescriptionColorKey,
      "",
    ),
    mapSliderAnimationsConfig: config,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function buildPayload(values = {}) {
  const config = normalizeMapSliderConfig(values?.mapSliderAnimationsConfig, {
    defaultItemCount: 10,
  });
  const nodeSizeDesktop = toNumber(
    config.nodeSizeDesktop ?? config.nodeSize,
    64,
    24,
    220,
  );
  const nodeSizeTablet = toNumber(
    config.nodeSizeTablet,
    Math.round(nodeSizeDesktop * 0.88),
    20,
    200,
  );
  const nodeSizeMobile = toNumber(
    config.nodeSizeMobile,
    Math.round(nodeSizeDesktop * 0.76),
    18,
    180,
  );

  return {
    ...getManageSectionPayload(PREFIX, values),
    subTitle: toText(values?.subTitle, ""),
    mainTitle: toText(values?.mainTitle, ""),
    titleAlign: normalizeAlign(values?.titleAlign, "center"),
    titleColorKey: toText(values?.titleColorKey, ""),
    subTitleColorKey: toText(values?.subTitleColorKey, ""),
    mapSliderAnimationsDescription: toText(values?.mapSliderAnimationsDescription, ""),
    mapSliderAnimationsDescriptionColorKey: toText(
      values?.mapSliderAnimationsDescriptionColorKey,
      "",
    ),
    mapSliderAnimationsConfig: {
      ...config,
      rotationDuration: toNumber(config.rotationDuration, 60, 12, 240),
      orbitRadius: toNumber(config.orbitRadius, 290, 100, 520),
      nodeSize: toNumber(config.nodeSize, nodeSizeDesktop, 28, 180),
      nodeSizeDesktop,
      nodeSizeTablet,
      nodeSizeMobile,
      stageSize: toNumber(config.stageSize, 760, 280, 1400),
    },
  };
}

/**
 * Edit form for MapSliderAnimations used by component drawer and page-builder drawer.
 */
function MapSliderAnimationsEditForm(
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
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
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
      .catch(() => message.error("Failed to load Map Slider Animations"))
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
            message.success("Map Slider Animations saved");
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
          "animation",
          "orbit-items",
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
                {...TITLE_COLORS_CONFIG}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Form.Item name="subTitle" label="Subtitle">
                    <Input placeholder="Subtitle (optional)" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="mainTitle" label="Main title">
                    <Input placeholder="Main title (optional)" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="titleAlign" label="Align">
                    <Select
                      size="large"
                      options={[
                        { label: "Left", value: "left" },
                        { label: "Center", value: "center" },
                        { label: "Right", value: "right" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mapSliderAnimationsDescription"
                    label="Description"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Optional helper text below title"
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "animation",
            label: "Animation Settings",
            children: (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Card size="small" title="Behaviour">
                  <List
                    size="small"
                    bordered
                    split
                    dataSource={[
                      {
                        key: "rotation",
                        label: "Rotation duration (seconds)",
                        path: ["mapSliderAnimationsConfig", "rotationDuration"],
                        type: "number",
                        min: 12,
                        max: 240,
                      },
                      {
                        key: "direction",
                        label: "Direction",
                        path: ["mapSliderAnimationsConfig", "direction"],
                        type: "select",
                      },
                      {
                        key: "pause",
                        label: "Pause on hover",
                        path: ["mapSliderAnimationsConfig", "pauseOnHover"],
                        type: "switch",
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          item.type === "number" ? (
                            <Form.Item key="input" name={item.path} noStyle>
                              <InputNumber
                                min={item.min}
                                max={item.max}
                                step={1}
                                style={{ width: 120 }}
                              />
                            </Form.Item>
                          ) : item.type === "select" ? (
                            <Form.Item key="select" name={item.path} noStyle>
                              <Select
                                style={{ width: 180 }}
                                options={[
                                  { label: "Clockwise", value: "clockwise" },
                                  {
                                    label: "Counterclockwise",
                                    value: "counterclockwise",
                                  },
                                ]}
                              />
                            </Form.Item>
                          ) : (
                            <Form.Item
                              key="switch"
                              name={item.path}
                              valuePropName="checked"
                              noStyle
                            >
                              <Switch />
                            </Form.Item>
                          ),
                        ]}
                      >
                        <span style={{ fontSize: 14, color: "rgba(0,0,0,0.65)" }}>
                          {item.label}
                        </span>
                      </List.Item>
                    )}
                  />
                </Card>

                <Card size="small" title="Icon Circle Width (Responsive)">
                  <List
                    size="small"
                    bordered
                    split
                    dataSource={[
                      {
                        key: "desktop",
                        label: "Desktop (px)",
                        path: ["mapSliderAnimationsConfig", "nodeSizeDesktop"],
                        min: 24,
                        max: 220,
                      },
                      {
                        key: "tablet",
                        label: "Tablet (px)",
                        path: ["mapSliderAnimationsConfig", "nodeSizeTablet"],
                        min: 20,
                        max: 200,
                      },
                      {
                        key: "mobile",
                        label: "Mobile (px)",
                        path: ["mapSliderAnimationsConfig", "nodeSizeMobile"],
                        min: 18,
                        max: 180,
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item key="input" name={item.path} noStyle>
                            <InputNumber
                              min={item.min}
                              max={item.max}
                              step={1}
                              style={{ width: 120 }}
                            />
                          </Form.Item>,
                        ]}
                      >
                        <span style={{ fontSize: 14, color: "rgba(0,0,0,0.65)" }}>
                          {item.label}
                        </span>
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "orbit-items",
            label: "Orbit Avatars",
            children: (
              <Form.List name={["mapSliderAnimationsConfig", "orbitItems"]}>
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Avatar"
                    addButtonText="Add avatar"
                    addButtonVariant="icon"
                    defaultAddPayload={{
                      imageUrl: "",
                      altText: "",
                      href: "",
                      target: "_self",
                    }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 8]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageUrl"]}
                            label="Avatar image"
                          >
                            <MediaPickerInput
                              placeholder="Select avatar image from media library"
                              uiVariant="stacked"
                              hintText="Manage images via media module."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "altText"]}
                            label="Alt text"
                          >
                            <Input
                              placeholder="Avatar alt text"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "href"]}
                            label="Link (optional)"
                          >
                            <Input
                              placeholder="/team/member or https://..."
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "target"]}
                            label="Link target"
                            initialValue="_self"
                          >
                            <Select
                              size="large"
                              placeholder="Select target"
                              options={[
                                { label: "Same tab (_self)", value: "_self" },
                                { label: "New tab (_blank)", value: "_blank" },
                              ]}
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

export default forwardRef(MapSliderAnimationsEditForm);
