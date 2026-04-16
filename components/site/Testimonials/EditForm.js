"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Collapse,
  InputNumber,
  List,
  Select,
  Switch,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Testimonials";

/** Fallback theme color keys when theme API returns no palette/colors (dropdown only shows theme colors) */
const FALLBACK_THEME_COLOR_KEYS = [
  "primary",
  "secondary",
  "white",
  "black",
  "headingColor",
  "paragraphColor",
  "linkColor",
  "mutedTextColor",
  "borderColor",
  "gradient",
];

/**
 * When source === "page" (block added via Page Builder): all settings and items
 * are loaded from and saved to the page's block.props (pages collection). Each
 * page can have different Testimonials content. API_PATH is not used.
 * When editing from Admin → Components: load/save via API_PATH (component doc).
 */
function normalizeItem(it) {
  return {
    quote: it?.quote != null ? String(it.quote).trim() : "",
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    rating: Math.min(5, Math.max(0, Number(it?.rating) || 0)),
  };
}

/**
 * Edit form for Testimonials. When on a page (Page Builder): data from page
 * block props only; save writes all settings and items to the page (pages collection).
 */
function TestimonialsEditForm(
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
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);
  useEffect(() => {
    setLoading(true);
    const setFormAndColors = (data, theme) => {
      const items = Array.isArray(data?.testimonialsItems)
        ? data.testimonialsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues("testimonials", data),
        testimonialsTitle:
          data?.testimonialsTitle != null
            ? String(data.testimonialsTitle).trim()
            : "Testimonials",
        testimonialsTitleColorKey:
          data?.testimonialsTitleColorKey != null
            ? String(data.testimonialsTitleColorKey).trim()
            : "",
        testimonialsNameColorKey:
          data?.testimonialsNameColorKey != null
            ? String(data.testimonialsNameColorKey).trim()
            : "",
        testimonialsRoleColorKey:
          data?.testimonialsRoleColorKey != null
            ? String(data.testimonialsRoleColorKey).trim()
            : "",
        testimonialsRatingColorKey:
          data?.testimonialsRatingColorKey != null
            ? String(data.testimonialsRatingColorKey).trim()
            : "",
        testimonialsTitleEnabled: data?.testimonialsTitleEnabled !== false,
        testimonialsAutoplay: data?.testimonialsAutoplay ?? false,
        testimonialsAutoplaySpeed:
          data?.testimonialsAutoplaySpeed != null
            ? Number(data.testimonialsAutoplaySpeed)
            : 5000,
        testimonialsShowArrows: data?.testimonialsShowArrows ?? true,
        testimonialsShowDots: data?.testimonialsShowDots ?? true,
        testimonialsSpeed:
          data?.testimonialsSpeed != null
            ? Number(data.testimonialsSpeed)
            : 400,
        testimonialsDraggable: data?.testimonialsDraggable ?? false,
        testimonialsInfinite: data?.testimonialsInfinite ?? true,
        testimonialsSlidesDesktop:
          data?.testimonialsSlidesDesktop != null
            ? Number(data.testimonialsSlidesDesktop)
            : 3,
        testimonialsSlidesTablet:
          data?.testimonialsSlidesTablet != null
            ? Number(data.testimonialsSlidesTablet)
            : 2,
        testimonialsSlidesMobile:
          data?.testimonialsSlidesMobile != null
            ? Number(data.testimonialsSlidesMobile)
            : 1,
        testimonialsItems:
          items.length > 0 ? items : [normalizeItem({}), normalizeItem({})],
      });
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...customColors.map((c) => c?.name).filter(Boolean),
        ]),
      ].sort();
      // Dropdown only shows theme colors; use fallback keys if theme has none
      const keys = names.length > 0 ? names : FALLBACK_THEME_COLOR_KEYS;
      setThemeColorOptions(keys.map((name) => ({ label: name, value: name })));
    };
    if (isPageBlock) {
      // Page block: use only block props from page (pages collection). Fetch theme only for color dropdown options.
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
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
      fetch("/api/theme", { cache: "no-store" }).then((res) =>
        res.ok ? res.json() : {},
      ),
    ])
      .then(([data, theme]) => {
        setFormAndColors(data, theme);
      })
      .catch(() => message.error("Failed to load Testimonials"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.testimonialsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload("testimonials", values),
        testimonialsTitle:
          values.testimonialsTitle != null
            ? String(values.testimonialsTitle).trim()
            : "Testimonials",
        testimonialsTitleColorKey:
          values.testimonialsTitleColorKey != null
            ? String(values.testimonialsTitleColorKey).trim()
            : "",
        testimonialsNameColorKey:
          values.testimonialsNameColorKey != null
            ? String(values.testimonialsNameColorKey).trim()
            : "",
        testimonialsRoleColorKey:
          values.testimonialsRoleColorKey != null
            ? String(values.testimonialsRoleColorKey).trim()
            : "",
        testimonialsRatingColorKey:
          values.testimonialsRatingColorKey != null
            ? String(values.testimonialsRatingColorKey).trim()
            : "",
        testimonialsTitleEnabled: values.testimonialsTitleEnabled !== false,
        testimonialsAutoplay: values.testimonialsAutoplay === true,
        testimonialsAutoplaySpeed:
          values.testimonialsAutoplaySpeed != null
            ? Math.max(1000, Number(values.testimonialsAutoplaySpeed))
            : 5000,
        testimonialsShowArrows: values.testimonialsShowArrows !== false,
        testimonialsShowDots: values.testimonialsShowDots !== false,
        testimonialsSpeed:
          values.testimonialsSpeed != null
            ? Math.max(200, Number(values.testimonialsSpeed))
            : 400,
        testimonialsDraggable: values.testimonialsDraggable === true,
        testimonialsInfinite: values.testimonialsInfinite !== false,
        testimonialsSlidesDesktop:
          values.testimonialsSlidesDesktop != null
            ? Math.min(5, Math.max(1, Number(values.testimonialsSlidesDesktop)))
            : 3,
        testimonialsSlidesTablet:
          values.testimonialsSlidesTablet != null
            ? Math.min(5, Math.max(1, Number(values.testimonialsSlidesTablet)))
            : 2,
        testimonialsSlidesMobile:
          values.testimonialsSlidesMobile != null
            ? Math.min(5, Math.max(1, Number(values.testimonialsSlidesMobile)))
            : 1,
        testimonialsItems: items,
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
          message.success("Testimonials saved");
          onSuccess?.();
        })
        .catch((err) =>
          message.error(err?.error || "Failed to save Testimonials")
        )
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
        defaultActiveKey={["items"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="testimonials" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Testimonials")} />,
          },
          {
            key: "setting",
            label: "Slide Setting",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Behaviour: List with header like Ant Design */}
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Behaviour</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                      {
                        key: "autoplay",
                        name: "testimonialsAutoplay",
                        label: "Autoplay",
                        tooltip: "Scroll to next slide automatically",
                      },
                      {
                        key: "arrows",
                        name: "testimonialsShowArrows",
                        label: "Show arrows",
                        tooltip: "Show prev/next navigation arrows",
                      },
                      {
                        key: "dots",
                        name: "testimonialsShowDots",
                        label: "Show dots",
                        tooltip: "Show dot indicators for current slide",
                      },
                      {
                        key: "draggable",
                        name: "testimonialsDraggable",
                        label: "Draggable",
                        tooltip: "Enable scroll by dragging",
                      },
                      {
                        key: "infinite",
                        name: "testimonialsInfinite",
                        label: "Infinite",
                        tooltip: "Loop endlessly",
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item
                            key="switch"
                            name={item.name}
                            valuePropName="checked"
                            noStyle
                            style={{ marginBottom: 0 }}
                          >
                            <Switch />
                          </Form.Item>,
                        ]}
                      >
                        <Tooltip title={item.tooltip}>
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                            {item.label}{" "}
                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                />

                {/* Slides per view: List with header like Ant Design */}
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Slides per view</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                      {
                        key: "desktop",
                        name: "testimonialsSlidesDesktop",
                        label: "Desktop",
                        tooltip: "Number of slides visible on desktop (≥992px)",
                      },
                      {
                        key: "tablet",
                        name: "testimonialsSlidesTablet",
                        label: "Tablet",
                        tooltip: "Number of slides visible on tablet (768px–991px)",
                      },
                      {
                        key: "mobile",
                        name: "testimonialsSlidesMobile",
                        label: "Mobile",
                        tooltip: "Number of slides visible on mobile (&lt;768px)",
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item key="select" name={item.name} noStyle style={{ marginBottom: 0 }}>
                            <Select
                              size="small"
                              options={[
                                { label: "1", value: 1 },
                                { label: "2", value: 2 },
                                { label: "3", value: 3 },
                                { label: "4", value: 4 },
                                { label: "5", value: 5 },
                              ]}
                              style={{ width: 72 }}
                            />
                          </Form.Item>,
                        ]}
                      >
                        <Tooltip title={item.tooltip}>
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                            {item.label}{" "}
                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                />

                {/* Speed: List with header like Ant Design */}
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Speed</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                      {
                        key: "autoplaySpeed",
                        name: "testimonialsAutoplaySpeed",
                        label: "Autoplay delay (ms)",
                        tooltip: "Delay between each auto scroll (milliseconds)",
                        min: 1000,
                        max: 30000,
                        step: 1000,
                      },
                      {
                        key: "transition",
                        name: "testimonialsSpeed",
                        label: "Transition (ms)",
                        tooltip: "Animation duration in milliseconds",
                        min: 200,
                        max: 2000,
                        step: 100,
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Form.Item key="input" name={item.name} noStyle style={{ marginBottom: 0 }}>
                            <InputNumber
                              size="small"
                              min={item.min}
                              max={item.max}
                              step={item.step}
                              style={{ width: 100 }}
                            />
                          </Form.Item>,
                        ]}
                      >
                        <Tooltip title={item.tooltip}>
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                            {item.label}{" "}
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
            label: "Manage Items",
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
                    defaultAddPayload={{
                      quote: "",
                      imageUrl: "",
                      name: "",
                      title: "",
                      rating: 5,
                    }}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "quote"]}
                            label="Quote"
                            rules={[{ required: true, message: "Quote is required" }]}
                          >
                            <Input.TextArea rows={4} placeholder="Testimonial text" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "imageUrl"]} label="Photo URL">
                            <MediaPickerInput placeholder="https://..." />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            label="Name"
                            rules={[{ required: true, message: "Name is required" }]}
                          >
                            <Input placeholder="Full name" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "title"]} label="Title / Role">
                            <Input placeholder="e.g. Customer Contact Specialist" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "rating"]} label="Rating (1-5)" initialValue={5}>
                            <Select
                              options={[
                                { label: "1", value: 1 },
                                { label: "1.5", value: 1.5 },
                                { label: "2", value: 2 },
                                { label: "2.5", value: 2.5 },
                                { label: "3", value: 3 },
                                { label: "3.5", value: 3.5 },
                                { label: "4", value: 4 },
                                { label: "4.5", value: 4.5 },
                                { label: "5", value: 5 },
                              ]}
                              placeholder="Select rating"
                              style={{ width: "100%" }}
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

export default forwardRef(TestimonialsEditForm);
