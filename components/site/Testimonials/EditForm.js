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
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
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
        testimonialsTitleAlign:
          data?.testimonialsTitleAlign != null
            ? String(data.testimonialsTitleAlign).trim()
            : "center",
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
        testimonialsAvatarBgColorKey:
          data?.testimonialsAvatarBgColorKey != null
            ? String(data.testimonialsAvatarBgColorKey).trim()
            : "",
        testimonialsAvatarTextColorKey:
          data?.testimonialsAvatarTextColorKey != null
            ? String(data.testimonialsAvatarTextColorKey).trim()
            : "",
        testimonialsTitleEnabled: data?.testimonialsTitleEnabled !== false,
        testimonialsAutoplay: data?.testimonialsAutoplay ?? true,
        testimonialsAutoplaySpeed:
          data?.testimonialsAutoplaySpeed != null
            ? Number(data.testimonialsAutoplaySpeed)
            : 6500,
        testimonialsViewAllLabel: String(data?.testimonialsViewAllLabel ?? "").trim(),
        testimonialsViewAllUrl: String(data?.testimonialsViewAllUrl ?? "").trim(),
        testimonialsViewAllTarget: data?.testimonialsViewAllTarget === "_blank" ? "_blank" : "_self",
        testimonialsRevealEnabled: data?.testimonialsRevealEnabled !== false,
        testimonialsRevealDuration: data?.testimonialsRevealDuration ?? 0.9,
        testimonialsRevealDistance: data?.testimonialsRevealDistance ?? 30,
        ...Object.fromEntries(["testimonialsQuoteMarkColorKey","testimonialsQuoteColorKey","testimonialsDotColorKey","testimonialsDotActiveColorKey","testimonialsLinkColorKey"].map((key)=>[key,String(data?.[key]??"").trim()])),
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
        testimonialsTitleAlign:
          values.testimonialsTitleAlign != null
            ? String(values.testimonialsTitleAlign).trim()
            : "center",
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
        testimonialsAvatarBgColorKey:
          values.testimonialsAvatarBgColorKey != null
            ? String(values.testimonialsAvatarBgColorKey).trim()
            : "",
        testimonialsAvatarTextColorKey:
          values.testimonialsAvatarTextColorKey != null
            ? String(values.testimonialsAvatarTextColorKey).trim()
            : "",
        testimonialsTitleEnabled: values.testimonialsTitleEnabled !== false,
        testimonialsAutoplay: values.testimonialsAutoplay === true,
        testimonialsAutoplaySpeed:
          values.testimonialsAutoplaySpeed != null
            ? Math.max(1000, Number(values.testimonialsAutoplaySpeed))
            : 6500,
        testimonialsViewAllLabel: String(values.testimonialsViewAllLabel ?? "").trim(),
        testimonialsViewAllUrl: String(values.testimonialsViewAllUrl ?? "").trim(),
        testimonialsViewAllTarget: values.testimonialsViewAllTarget === "_blank" ? "_blank" : "_self",
        testimonialsRevealEnabled: values.testimonialsRevealEnabled !== false,
        testimonialsRevealDuration: Number(values.testimonialsRevealDuration ?? 0.9),
        testimonialsRevealDistance: Number(values.testimonialsRevealDistance ?? 30),
        ...Object.fromEntries(["testimonialsQuoteMarkColorKey","testimonialsQuoteColorKey","testimonialsDotColorKey","testimonialsDotActiveColorKey","testimonialsLinkColorKey"].map((key)=>[key,String(values?.[key]??"").trim()])),
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
                <SwitchSettingsCard items={[
                  { name: "testimonialsAutoplay", label: "Autoplay", tooltip: "Scroll to next slide automatically" },
                  { name: "testimonialsShowArrows", label: "Show arrows", tooltip: "Show prev/next navigation arrows" },
                  { name: "testimonialsShowDots", label: "Show dots", tooltip: "Show dot indicators for current slide" },
                  { name: "testimonialsDraggable", label: "Draggable", tooltip: "Enable scroll by dragging" },
                  { name: "testimonialsInfinite", label: "Infinite", tooltip: "Loop endlessly" },
                ]} />

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
            key: "link-accessibility",
            label: "Link & Accessibility",
            children: (
              <>
                <Form.Item name="testimonialsViewAllLabel" label="View all label">
                  <Input />
                </Form.Item>
                <Form.Item name="testimonialsViewAllUrl" label="View all URL">
                  <Input />
                </Form.Item>
                <Form.Item name="testimonialsViewAllTarget" label="Target">
                  <Select
                    options={[
                      { label: "Same Tab (_self)", value: "_self" },
                      { label: "New Tab (_blank)", value: "_blank" },
                    ]}
                  />
                </Form.Item>
                <SwitchSettingsCard items={[{ name: "testimonialsRevealEnabled", label: "Reveal on scroll", tooltip: "Animate testimonials into view while scrolling." }]} />
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="testimonialsRevealDuration" label="Duration s">
                      <InputNumber min={0} step={0.05} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="testimonialsRevealDistance" label="Distance px">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
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
