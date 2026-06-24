"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Select, message, Spin, Collapse, Row, Col } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/OverviewOfOurWork";
const PREFIX = "overviewOfOurWork";
const REQUIRED_BG_IMAGE_WIDTH = 580;
const REQUIRED_BG_IMAGE_HEIGHT = 704;
const REQUIRED_BG_IMAGE_SIZE_TEXT =
  `${REQUIRED_BG_IMAGE_WIDTH} \u00D7 ${REQUIRED_BG_IMAGE_HEIGHT} pixels`;
const REQUIRED_ICON_IMAGE_WIDTH = 48;
const REQUIRED_ICON_IMAGE_HEIGHT = 48;
const REQUIRED_ICON_IMAGE_SIZE_TEXT =
  `${REQUIRED_ICON_IMAGE_WIDTH} \u00D7 ${REQUIRED_ICON_IMAGE_HEIGHT} pixels`;
const REQUIRED_ICON_IMAGE_SIZE_LABEL_TEXT =
  `${REQUIRED_ICON_IMAGE_WIDTH} \u00D7 ${REQUIRED_ICON_IMAGE_HEIGHT} px`;

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateOverviewBackgroundImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_BG_IMAGE_WIDTH &&
      height === REQUIRED_BG_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Image size must be exactly ${REQUIRED_BG_IMAGE_SIZE_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(`Image size must be exactly ${REQUIRED_BG_IMAGE_SIZE_TEXT}.`),
    );
  }
}

async function validateOverviewIconImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_ICON_IMAGE_WIDTH &&
      height === REQUIRED_ICON_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Icon image size must be exactly ${REQUIRED_ICON_IMAGE_SIZE_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(`Icon image size must be exactly ${REQUIRED_ICON_IMAGE_SIZE_TEXT}.`),
    );
  }
}

function normalizeItem(it) {
  const bgImageDesktop =
    it?.bgImageUrlDesktop != null
      ? String(it.bgImageUrlDesktop).trim()
      : it?.bgImageUrl != null
        ? String(it.bgImageUrl).trim()
        : it?.bgImage != null
          ? String(it.bgImage).trim()
          : it?.bgImageUrlMobile != null
            ? String(it.bgImageUrlMobile).trim()
            : "";
  return {
    title: (it?.title != null ? String(it.title).trim() : "") || "Card",
    bgImageUrlDesktop: bgImageDesktop,
    bgImageUrl: bgImageDesktop,
    link: it?.link != null ? String(it.link).trim() : it?.url != null ? String(it.url).trim() : "",
    linkText: it?.linkText != null ? String(it.linkText).trim() : it?.buttonText != null ? String(it.buttonText).trim() : "",
    titleColorKey: it?.titleColorKey != null ? String(it.titleColorKey).trim() : it?.cardTitleColorKey != null ? String(it.cardTitleColorKey).trim() : "",
    icon: it?.icon != null ? String(it.icon).trim() : "",
  };
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Edit form for Overview of Our Work (OverviewOfOurWork). All content from DB (components collection or page block props).
 * Manage Section + Title & Colors + Content (cards: add/edit/delete) - same drawer for component edit and Page Builder block edit.
 */
function OverviewOfOurWorkEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState("up");
  const themeFetchedForColorsRef = useRef(false);
  const componentDataLoadedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    if (themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp, isPageBlock]);

  useEffect(() => {
    setLoading(true);
    const titleColorsConfig = getTitleAndColorsConfig("OverviewOfOurWork");
    const setFormAndColors = (data, theme) => {
      const items = Array.isArray(data?.overviewOfOurWorkItems)
        ? data.overviewOfOurWorkItems.map(normalizeItem)
        : Array.isArray(data?.items)
          ? data.items.map(normalizeItem)
          : [];
      const titleColorValues = {};
      (titleColorsConfig.titleListItems || []).forEach((item) => {
        const v = data?.[item.name];
        titleColorValues[item.name] = v != null ? String(v).trim() : "";
      });
      (titleColorsConfig.colorListItems || []).forEach((item) => {
        const v = data?.[item.name];
        titleColorValues[item.name] = v != null ? String(v).trim() : "";
      });
      const hoverOpacity =
        data?.overviewOfOurWorkHoverOverlayOpacity != null
          ? Math.min(1, Math.max(0, Number(data.overviewOfOurWorkHoverOverlayOpacity)))
          : 0.5;
      const cardsPerRow = clamp(data?.overviewOfOurWorkCardsPerRow, 1, 8, 4);
      const titleFontFamily =
        data?.overviewOfOurWorkTitleFontFamily != null
          ? String(data.overviewOfOurWorkTitleFontFamily).trim()
          : "";
      const titleFontSize = clamp(
        data?.overviewOfOurWorkTitleFontSize,
        10,
        96,
        24,
      );
      const titleFontWeight = clamp(
        data?.overviewOfOurWorkTitleFontWeight,
        100,
        900,
        700,
      );
      const titleFontStyle =
        (data?.overviewOfOurWorkTitleFontStyle ?? "normal").toString() === "italic"
          ? "italic"
          : "normal";
      const titleLetterSpacing = clamp(
        data?.overviewOfOurWorkTitleLetterSpacing,
        -2,
        20,
        0,
      );
      const titleLineHeight = clamp(
        data?.overviewOfOurWorkTitleLineHeight,
        0.8,
        3,
        1.2,
      );
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        ...titleColorValues,
        overviewOfOurWorkHoverOverlayOpacity: hoverOpacity,
        overviewOfOurWorkCardsPerRow: cardsPerRow,
        overviewOfOurWorkTitleFontFamily: titleFontFamily,
        overviewOfOurWorkTitleFontSize: titleFontSize,
        overviewOfOurWorkTitleFontWeight: titleFontWeight,
        overviewOfOurWorkTitleFontStyle: titleFontStyle,
        overviewOfOurWorkTitleLetterSpacing: titleLetterSpacing,
        overviewOfOurWorkTitleLineHeight: titleLineHeight,
        overviewOfOurWorkItems: items.length > 0 ? items : [normalizeItem({})],
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      }
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => setFormAndColors(data, theme))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    // Only fetch once per mount for component (non-page) path to avoid /api/theme loop
    if (componentDataLoadedRef.current) {
      setLoading(false);
      return;
    }
    componentDataLoadedRef.current = true;
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data || {}, theme))
      .catch(() => message.error("Failed to load Overview of Our Work"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.overviewOfOurWorkItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const titleColorsConfig = getTitleAndColorsConfig("OverviewOfOurWork");
      const titleColorPayload = {};
      (titleColorsConfig.titleListItems || []).forEach((item) => {
        const v = values[item.name];
        titleColorPayload[item.name] = v != null ? String(v).trim() : "";
      });
      (titleColorsConfig.colorListItems || []).forEach((item) => {
        const v = values[item.name];
        titleColorPayload[item.name] = v != null ? String(v).trim() : "";
      });
      const opacityVal = values.overviewOfOurWorkHoverOverlayOpacity;
      const hoverOverlayOpacity =
        opacityVal != null ? Math.min(1, Math.max(0, Number(opacityVal))) : 0.5;
      const cardsPerRow = clamp(values.overviewOfOurWorkCardsPerRow, 1, 8, 4);
      const titleFontFamily =
        values.overviewOfOurWorkTitleFontFamily != null
          ? String(values.overviewOfOurWorkTitleFontFamily).trim()
          : "";
      const titleFontSize = clamp(
        values.overviewOfOurWorkTitleFontSize,
        10,
        96,
        24,
      );
      const titleFontWeight = clamp(
        values.overviewOfOurWorkTitleFontWeight,
        100,
        900,
        700,
      );
      const titleFontStyle =
        (values.overviewOfOurWorkTitleFontStyle ?? "normal").toString() === "italic"
          ? "italic"
          : "normal";
      const titleLetterSpacing = clamp(
        values.overviewOfOurWorkTitleLetterSpacing,
        -2,
        20,
        0,
      );
      const titleLineHeight = clamp(
        values.overviewOfOurWorkTitleLineHeight,
        0.8,
        3,
        1.2,
      );
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        ...titleColorPayload,
        overviewOfOurWorkHoverOverlayOpacity: hoverOverlayOpacity,
        overviewOfOurWorkCardsPerRow: cardsPerRow,
        overviewOfOurWorkTitleFontFamily: titleFontFamily,
        overviewOfOurWorkTitleFontSize: titleFontSize,
        overviewOfOurWorkTitleFontWeight: titleFontWeight,
        overviewOfOurWorkTitleFontStyle: titleFontStyle,
        overviewOfOurWorkTitleLetterSpacing: titleLetterSpacing,
        overviewOfOurWorkTitleLineHeight: titleLineHeight,
        overviewOfOurWorkItems: items,
      };
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
        })
        .then(() => {
          message.success("Overview of Our Work saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
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
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <>
                <TitleAndColorsSection
                  form={form}
                  themeColorOptions={themeColorOptions}
                  {...getTitleAndColorsConfig("OverviewOfOurWork")}
                />
                <Form.Item
                  name="overviewOfOurWorkHoverOverlayOpacity"
                  label="Hover overlay opacity"
                  tooltip="Opacity for card hover overlay (0-1). Default 0.5."
                  style={{ marginTop: 16 }}
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.1}
                    placeholder="0.5"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="overviewOfOurWorkTitleFontSize"
                      label="Title font size (px)"
                    >
                      <InputNumber min={10} max={96} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="overviewOfOurWorkTitleFontWeight"
                      label="Title font weight"
                    >
                      <Select
                        options={[
                          { label: "100", value: 100 },
                          { label: "200", value: 200 },
                          { label: "300", value: 300 },
                          { label: "400", value: 400 },
                          { label: "500", value: 500 },
                          { label: "600", value: 600 },
                          { label: "700", value: 700 },
                          { label: "800", value: 800 },
                          { label: "900", value: 900 },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="overviewOfOurWorkTitleFontStyle"
                      label="Title font style"
                    >
                      <Select
                        options={[
                          { label: "Normal", value: "normal" },
                          { label: "Italic", value: "italic" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="overviewOfOurWorkTitleLetterSpacing"
                      label="Title letter spacing (px)"
                    >
                      <InputNumber min={-2} max={20} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="overviewOfOurWorkTitleLineHeight"
                      label="Title line height"
                    >
                      <InputNumber min={0.8} max={3} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Row gutter={[12, 12]}>
                  <Col span={24}>
                    <Form.Item
                      name="overviewOfOurWorkCardsPerRow"
                      label="Cards per row (desktop)"
                      tooltip="Number of cards shown in each desktop row. Tablet/mobile adjust automatically."
                    >
                      <InputNumber min={1} max={8} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name="overviewOfOurWorkItems">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Item"
                      addButtonText="Add item"
                      defaultAddPayload={normalizeItem({})}
                      reorderMovedIndex={reorderMovedIndex}
                      reorderDirection={reorderDirection}
                      onMoveWithTransition={(from, to) => {
                        setReorderDirection(to < from ? "up" : "down");
                        setReorderMovedIndex(to);
                        setTimeout(() => setReorderMovedIndex(-1), 400);
                      }}
                      renderItemContent={(name, restField) => (
                        <Row gutter={[12, 12]}>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "title"]} label="Card title" rules={[{ required: true, message: "Title required" }]}>
                              <Input placeholder="e.g. Educational Support" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "linkText"]} label="Link text">
                              <Input placeholder="e.g. More Details, Learn More" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "link"]} label="Link URL">
                              <Input placeholder="/page or https://..." />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "bgImageUrlDesktop"]}
                              label="Desktop Background Image"
                              validateTrigger={["onChange", "onBlur"]}
                              rules={[{ validator: validateOverviewBackgroundImageDimensions }]}
                            >
                              <MediaPickerInput
                                placeholder="https://... or /images/..."
                                uiVariant="stacked"
                                hintText={`Required size: ${REQUIRED_BG_IMAGE_WIDTH} \u00D7 ${REQUIRED_BG_IMAGE_HEIGHT}`}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "icon"]}
                              label="Icon (image URL)"
                              extra={`Required size: ${REQUIRED_ICON_IMAGE_SIZE_LABEL_TEXT}`}
                              validateTrigger={["onChange", "onBlur"]}
                              rules={[{ validator: validateOverviewIconImageDimensions }]}
                            >
                              <MediaPickerInput
                                placeholder="/images/icon.svg or https://..."
                                hintText={`Required size: ${REQUIRED_ICON_IMAGE_SIZE_LABEL_TEXT}`}
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
        ]}
      />
    </Form>
  );
}

export default forwardRef(OverviewOfOurWorkEditForm);
