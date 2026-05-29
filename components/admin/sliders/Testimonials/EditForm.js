"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Collapse,
  Switch,
  List,
  Tooltip,
  Row,
  Col,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SortableFormList from "@/components/admin/SortableFormList";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Testimonials";
const PREFIX = "testimonials";
const TITLE_COLORS_CONFIG = {
  ...getTitleAndColorsConfig("Testimonials"),
  titleListItems: [],
};

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function toAlign(value, fallback = "left") {
  const next = String(value ?? fallback).trim().toLowerCase();
  if (next === "left" || next === "center" || next === "right") return next;
  return fallback;
}

function toBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function toNumber(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  if (Number.isFinite(min) && next < min) return min;
  if (Number.isFinite(max) && next > max) return max;
  return next;
}

function normalizeItemForForm(item = {}) {
  return {
    quote: toText(item?.quote, ""),
    name: toText(item?.name, ""),
    title: toText(item?.title, ""),
    imageUrl: toText(item?.imageUrl, ""),
    rating: toNumber(item?.rating, 5, 0, 5),
  };
}

function normalizeItemsForForm(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeItemForForm(item));
}

function applyFormValues(form, data = {}) {
  const mainTitle = toText(data?.mainTitle ?? data?.testimonialsTitle, "Testimonials");
  const subTitle = toText(data?.subTitle ?? data?.testimonialsSubTitle, "");
  const titleAlign = toAlign(data?.titleAlign ?? data?.testimonialsTitleAlign, "left");
  const titleColorKey = toText(
    data?.titleColorKey ?? data?.testimonialsTitleColorKey,
    "",
  );
  const subTitleColorKey = toText(
    data?.subTitleColorKey ?? data?.testimonialsSubTitleColorKey,
    "",
  );

  form.setFieldsValue({
    mainTitle,
    subTitle,
    titleAlign,
    titleColorKey,
    subTitleColorKey,
    testimonialsAutoplay: toBoolean(data?.testimonialsAutoplay, false),
    testimonialsAutoplaySpeed: toNumber(data?.testimonialsAutoplaySpeed, 5000, 1000, 30000),
    testimonialsShowArrows: toBoolean(data?.testimonialsShowArrows, true),
    testimonialsShowDots: toBoolean(data?.testimonialsShowDots, true),
    testimonialsSpeed: toNumber(data?.testimonialsSpeed, 400, 100, 3000),
    testimonialsDraggable: toBoolean(data?.testimonialsDraggable, false),
    testimonialsInfinite: toBoolean(data?.testimonialsInfinite, true),
    testimonialsSlidesDesktop: toNumber(data?.testimonialsSlidesDesktop, 3, 1, 4),
    testimonialsSlidesTablet: toNumber(data?.testimonialsSlidesTablet, 2, 1, 3),
    testimonialsSlidesMobile: toNumber(data?.testimonialsSlidesMobile, 1, 1, 2),
    testimonialsQuoteFontSizeDesktop: toNumber(
      data?.testimonialsQuoteFontSizeDesktop,
      16,
      10,
      80,
    ),
    testimonialsQuoteFontSizeMobile: toNumber(
      data?.testimonialsQuoteFontSizeMobile,
      15,
      10,
      72,
    ),
    testimonialsQuoteLineHeight: toNumber(
      data?.testimonialsQuoteLineHeight,
      1.6,
      0.8,
      3,
    ),
    testimonialsQuoteFontWeight: toNumber(
      data?.testimonialsQuoteFontWeight,
      500,
      100,
      900,
    ),
    testimonialsNameFontSizeDesktop: toNumber(
      data?.testimonialsNameFontSizeDesktop,
      18,
      10,
      80,
    ),
    testimonialsNameFontSizeMobile: toNumber(
      data?.testimonialsNameFontSizeMobile,
      16,
      10,
      72,
    ),
    testimonialsNameFontWeight: toNumber(
      data?.testimonialsNameFontWeight,
      700,
      100,
      900,
    ),
    testimonialsRoleFontSizeDesktop: toNumber(
      data?.testimonialsRoleFontSizeDesktop,
      14,
      10,
      80,
    ),
    testimonialsRoleFontSizeMobile: toNumber(
      data?.testimonialsRoleFontSizeMobile,
      13,
      10,
      72,
    ),
    testimonialsRoleFontWeight: toNumber(
      data?.testimonialsRoleFontWeight,
      500,
      100,
      900,
    ),
    testimonialsItems: normalizeItemsForForm(data?.testimonialsItems),
    ...getManageSectionInitialValues(PREFIX, data),
    ...(data && typeof data === "object" ? data : {}),
  });
}

function buildPayload(values = {}) {
  const mainTitle = toText(values?.mainTitle, "Testimonials");
  const subTitle = toText(values?.subTitle, "");
  const titleAlign = toAlign(values?.titleAlign, "left");
  const titleColorKey = toText(values?.titleColorKey, "");
  const subTitleColorKey = toText(values?.subTitleColorKey, "");

  const payload = {
    ...values,
    ...getManageSectionPayload(PREFIX, values),
    mainTitle,
    subTitle,
    titleAlign,
    titleColorKey,
    subTitleColorKey,
    testimonialsTitle: mainTitle,
    testimonialsSubTitle: subTitle,
    testimonialsTitleAlign: titleAlign,
    testimonialsTitleColorKey: titleColorKey,
    testimonialsSubTitleColorKey: subTitleColorKey,
    testimonialsAutoplay: toBoolean(values?.testimonialsAutoplay, false),
    testimonialsAutoplaySpeed: toNumber(values?.testimonialsAutoplaySpeed, 5000, 1000, 30000),
    testimonialsShowArrows: toBoolean(values?.testimonialsShowArrows, true),
    testimonialsShowDots: toBoolean(values?.testimonialsShowDots, true),
    testimonialsSpeed: toNumber(values?.testimonialsSpeed, 400, 100, 3000),
    testimonialsDraggable: toBoolean(values?.testimonialsDraggable, false),
    testimonialsInfinite: toBoolean(values?.testimonialsInfinite, true),
    testimonialsSlidesDesktop: toNumber(values?.testimonialsSlidesDesktop, 3, 1, 4),
    testimonialsSlidesTablet: toNumber(values?.testimonialsSlidesTablet, 2, 1, 3),
    testimonialsSlidesMobile: toNumber(values?.testimonialsSlidesMobile, 1, 1, 2),
    testimonialsQuoteFontSizeDesktop: toNumber(
      values?.testimonialsQuoteFontSizeDesktop,
      16,
      10,
      80,
    ),
    testimonialsQuoteFontSizeMobile: toNumber(
      values?.testimonialsQuoteFontSizeMobile,
      15,
      10,
      72,
    ),
    testimonialsQuoteLineHeight: toNumber(
      values?.testimonialsQuoteLineHeight,
      1.6,
      0.8,
      3,
    ),
    testimonialsQuoteFontWeight: toNumber(
      values?.testimonialsQuoteFontWeight,
      500,
      100,
      900,
    ),
    testimonialsNameFontSizeDesktop: toNumber(
      values?.testimonialsNameFontSizeDesktop,
      18,
      10,
      80,
    ),
    testimonialsNameFontSizeMobile: toNumber(
      values?.testimonialsNameFontSizeMobile,
      16,
      10,
      72,
    ),
    testimonialsNameFontWeight: toNumber(
      values?.testimonialsNameFontWeight,
      700,
      100,
      900,
    ),
    testimonialsRoleFontSizeDesktop: toNumber(
      values?.testimonialsRoleFontSizeDesktop,
      14,
      10,
      80,
    ),
    testimonialsRoleFontSizeMobile: toNumber(
      values?.testimonialsRoleFontSizeMobile,
      13,
      10,
      72,
    ),
    testimonialsRoleFontWeight: toNumber(
      values?.testimonialsRoleFontWeight,
      500,
      100,
      900,
    ),
    testimonialsItems: (Array.isArray(values?.testimonialsItems)
      ? values.testimonialsItems
      : []
    )
      .map((item) => ({
        quote: toText(item?.quote, ""),
        name: toText(item?.name, ""),
        title: toText(item?.title, ""),
        imageUrl: toText(item?.imageUrl, ""),
        rating: toNumber(item?.rating, 5, 0, 5),
      }))
      .filter((item) => item.quote || item.name || item.title || item.imageUrl),
  };

  delete payload.testimonialsFontFamily;

  return payload;
}

function TestimonialsEditForm(
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
      .then((theme) => {
        const palette =
          theme?.frontendUiColors && typeof theme.frontendUiColors === "object"
            ? theme.frontendUiColors
            : theme?.themePalette && typeof theme.themePalette === "object"
              ? theme.themePalette
              : {};
        const names = Object.keys(palette).sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
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
      .catch(() => message.error("Failed to load Testimonials"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
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
          message.success("Testimonials saved");
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
    <Form form={form} layout="vertical" disabled={saving}>
      <Collapse
        defaultActiveKey={[
          "title-colors",
          "typography",
          "slider-settings",
          "items",
        ]}
        items={[
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
            key: "typography",
            label: "Typography",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Quote
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "quoteDesktop",
                      name: "testimonialsQuoteFontSizeDesktop",
                      label: "Font size desktop (px)",
                      tooltip: "Quote font size for desktop",
                      min: 10,
                      max: 80,
                      step: 1,
                    },
                    {
                      key: "quoteMobile",
                      name: "testimonialsQuoteFontSizeMobile",
                      label: "Font size mobile (px)",
                      tooltip: "Quote font size for mobile",
                      min: 10,
                      max: 72,
                      step: 1,
                    },
                    {
                      key: "quoteLineHeight",
                      name: "testimonialsQuoteLineHeight",
                      label: "Line height",
                      tooltip: "Quote line height multiplier",
                      min: 0.8,
                      max: 3,
                      step: 0.05,
                    },
                    {
                      key: "quoteWeight",
                      name: "testimonialsQuoteFontWeight",
                      label: "Font weight",
                      tooltip: "Quote font weight",
                      min: 100,
                      max: 900,
                      step: 100,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} noStyle>
                          <InputNumber
                            size="small"
                            style={{ width: 100 }}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />

                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Name
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "nameDesktop",
                      name: "testimonialsNameFontSizeDesktop",
                      label: "Font size desktop (px)",
                      tooltip: "Name font size for desktop",
                      min: 10,
                      max: 80,
                      step: 1,
                    },
                    {
                      key: "nameMobile",
                      name: "testimonialsNameFontSizeMobile",
                      label: "Font size mobile (px)",
                      tooltip: "Name font size for mobile",
                      min: 10,
                      max: 72,
                      step: 1,
                    },
                    {
                      key: "nameWeight",
                      name: "testimonialsNameFontWeight",
                      label: "Font weight",
                      tooltip: "Name font weight",
                      min: 100,
                      max: 900,
                      step: 100,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} noStyle>
                          <InputNumber
                            size="small"
                            style={{ width: 100 }}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />

                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Role / Designation
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "roleDesktop",
                      name: "testimonialsRoleFontSizeDesktop",
                      label: "Font size desktop (px)",
                      tooltip: "Role font size for desktop",
                      min: 10,
                      max: 80,
                      step: 1,
                    },
                    {
                      key: "roleMobile",
                      name: "testimonialsRoleFontSizeMobile",
                      label: "Font size mobile (px)",
                      tooltip: "Role font size for mobile",
                      min: 10,
                      max: 72,
                      step: 1,
                    },
                    {
                      key: "roleWeight",
                      name: "testimonialsRoleFontWeight",
                      label: "Font weight",
                      tooltip: "Role font weight",
                      min: 100,
                      max: 900,
                      step: 100,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} noStyle>
                          <InputNumber
                            size="small"
                            style={{ width: 100 }}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
          {
            key: "slider-settings",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Behaviour
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "autoplay",
                      name: "testimonialsAutoplay",
                      label: "Autoplay",
                      tooltip: "Auto-advance to next slide",
                    },
                    {
                      key: "infinite",
                      name: "testimonialsInfinite",
                      label: "Infinite loop",
                      tooltip: "Loop slides continuously",
                    },
                    {
                      key: "arrows",
                      name: "testimonialsShowArrows",
                      label: "Show arrows",
                      tooltip: "Show previous/next navigation arrows",
                    },
                    {
                      key: "dots",
                      name: "testimonialsShowDots",
                      label: "Show dots",
                      tooltip: "Show dot indicators",
                    },
                    {
                      key: "drag",
                      name: "testimonialsDraggable",
                      label: "Draggable",
                      tooltip: "Allow dragging/swiping slides",
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} valuePropName="checked" noStyle>
                          <Switch size="small" />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Speed
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "autoplaySpeed",
                      name: "testimonialsAutoplaySpeed",
                      label: "Autoplay delay (ms)",
                      tooltip: "Delay between auto-advance (ms)",
                      min: 1000,
                      max: 30000,
                      step: 100,
                    },
                    {
                      key: "speed",
                      name: "testimonialsSpeed",
                      label: "Transition speed (ms)",
                      tooltip: "Slide transition duration (ms)",
                      min: 100,
                      max: 3000,
                      step: 50,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} noStyle>
                          <InputNumber
                            size="small"
                            style={{ width: 120 }}
                            min={item.min}
                            max={item.max}
                            step={item.step}
                          />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
                <List
                  header={(
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>
                      Responsive Slides
                    </span>
                  )}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    {
                      key: "desktop",
                      name: "testimonialsSlidesDesktop",
                      label: "Slides desktop",
                      tooltip: "Visible slides on desktop",
                      min: 1,
                      max: 4,
                    },
                    {
                      key: "tablet",
                      name: "testimonialsSlidesTablet",
                      label: "Slides tablet",
                      tooltip: "Visible slides on tablet",
                      min: 1,
                      max: 3,
                    },
                    {
                      key: "mobile",
                      name: "testimonialsSlidesMobile",
                      label: "Slides mobile",
                      tooltip: "Visible slides on mobile",
                      min: 1,
                      max: 2,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key={item.key} name={item.name} noStyle>
                          <InputNumber size="small" style={{ width: 80 }} min={item.min} max={item.max} />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span
                          style={{
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "rgba(0,0,0,0.65)",
                          }}
                        >
                          {item.label}
                          {" "}
                          <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
          {
            key: "items",
            label: "Testimonial Items",
            children: (
              <Form.List name="testimonialsItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add testimonial"
                    addButtonVariant="icon"
                    defaultAddPayload={{
                      quote: "",
                      name: "",
                      title: "",
                      imageUrl: "",
                      rating: 5,
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 8]}>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "quote"]} label="Quote">
                            <Input.TextArea
                              rows={4}
                              placeholder="Hands-on mentorship and structured guidance helped us refine our strategy."
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, "name"]} label="Name">
                            <Input placeholder="Founder" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, "title"]} label="Role / designation">
                            <Input placeholder="Co-founder" size="large" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item {...restField} name={[name, "rating"]} label="Rating (0-5)">
                            <InputNumber style={{ width: "100%" }} min={0} max={5} step={0.5} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageUrl"]}
                            label="Avatar image (optional)"
                            extra="Optional. Shown as small avatar on card."
                          >
                            <MediaPickerInput
                              placeholder="/media/testimonial-avatar.jpg"
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
        ]}
      />
    </Form>
  );
}

export default forwardRef(TestimonialsEditForm);
