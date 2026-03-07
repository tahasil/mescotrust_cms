"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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

const API_PATH = "/api/theme/Testimonials";

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
    rating: Math.min(5, Math.max(0, parseInt(it?.rating, 10) || 0)),
  };
}

/**
 * Edit form for Testimonials. When on a page (Page Builder): data from page
 * block props only; save writes all settings and items to the page (pages collection).
 */
function TestimonialsEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel },
  ref
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    const setFormAndColors = (data, theme) => {
      const items = Array.isArray(data?.testimonialsItems)
        ? data.testimonialsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
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
      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [
          ...new Set([
            ...Object.keys(palette),
            ...customColors.map((c) => c?.name).filter(Boolean),
          ]),
        ].sort();
        setThemeColorOptions(
          names.map((name) => ({ label: name, value: name })),
        );
      }
    };
    if (isPageBlock) {
      // Page block: use only block props from page (pages collection). Fetch theme only for color dropdown options.
      const data = initialDataProp ?? {};
      setFormAndColors(data);
      fetch("/api/theme", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : {}))
        .then((theme) => setFormAndColors(data, theme))
        .catch(() => {})
        .finally(() => setLoading(false));
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
        defaultActiveKey={["content", "items", "setting"]}
        items={[
          {
            key: "content",
            label: "Section headings",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="testimonialsTitle"
                    label="Section title"
                    rules={[
                      { required: true, message: "Section title is required" },
                    ]}
                  >
                    <Input
                      placeholder="e.g. Testimonials"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="testimonialsTitleColorKey"
                    label="Section title color"
                  >
                    <Select
                      size="large"
                      options={themeColorOptions}
                      placeholder="From theme (default)"
                      style={{ width: "100%" }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="testimonialsNameColorKey"
                    label="Name color"
                    tooltip="Theme color for testimonial name"
                  >
                    <Select
                      size="large"
                      options={themeColorOptions}
                      placeholder="From theme (default)"
                      style={{ width: "100%" }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="testimonialsRoleColorKey"
                    label="Role / Title color"
                    tooltip="Theme color for role or title under name"
                  >
                    <Select
                      size="large"
                      options={themeColorOptions}
                      placeholder="From theme (default)"
                      style={{ width: "100%" }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="testimonialsRatingColorKey"
                    label="Rating (stars) color"
                    tooltip="Theme color for star rating"
                  >
                    <Select
                      size="large"
                      options={themeColorOptions}
                      placeholder="From theme (default)"
                      style={{ width: "100%" }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "setting",
            label: "Setting",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Behaviour: Ant Design List — title left, switch right */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.65)",
                      marginBottom: 12,
                    }}
                  >
                    Behaviour
                  </div>
                  <List
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
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {item.label}{" "}
                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </div>

                {/* Slides per view: List — label left, control right */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.65)",
                      marginBottom: 12,
                    }}
                  >
                    Slides per view
                  </div>
                  <List
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
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {item.label}{" "}
                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </div>

                {/* Speed: List — label left, control right */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(0,0,0,0.65)",
                      marginBottom: 12,
                    }}
                  >
                    Speed
                  </div>
                  <List
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
                          <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {item.label}{" "}
                            <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                          </span>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "items",
            label: "Testimonial items",
            children: (
              <Form.List name="testimonialsItems">
                {(fields, { add, remove, move }) => (
                  <>
                    <Collapse
                      accordion
                      size="small"
                      style={{ marginBottom: 12 }}
                      items={fields.map(({ key, name, ...restField }) => ({
                        key: String(name),
                        label: (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              paddingRight: 8,
                              gap: 4,
                            }}
                          >
                            <strong>Item {name + 1}</strong>
                            <span
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0,
                              }}
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowUpOutlined />}
                                disabled={name === 0}
                                onClick={() => move(name, name - 1)}
                                title="Move up"
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined />}
                                disabled={name === fields.length - 1}
                                onClick={() => move(name, name + 1)}
                                title="Move down"
                              />
                              {fields.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(name)}
                                />
                              )}
                            </span>
                          </span>
                        ),
                        children: (
                          <Row gutter={[16, 16]}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "quote"]}
                                label="Quote"
                                rules={[
                                  { required: true, message: "Quote is required" },
                                ]}
                              >
                                <Input.TextArea
                                  rows={4}
                                  placeholder="Testimonial text"
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "imageUrl"]}
                                label="Photo URL"
                              >
                                <Input placeholder="https://..." size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "name"]}
                                label="Name"
                                rules={[
                                  { required: true, message: "Name is required" },
                                ]}
                              >
                                <Input placeholder="Full name" size="large" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "title"]}
                                label="Title / Role"
                              >
                                <Input
                                  placeholder="e.g. Customer Contact Specialist"
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "rating"]}
                                label="Star rating (1–5)"
                                initialValue={5}
                              >
                                <InputNumber
                                  min={1}
                                  max={5}
                                  placeholder="5"
                                  style={{ width: "100%" }}
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        ),
                      }))}
                    />
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          quote: "",
                          imageUrl: "",
                          name: "",
                          title: "",
                          rating: 5,
                        })
                      }
                      block
                      icon={<PlusOutlined />}
                      size="small"
                    >
                      Add testimonial
                    </Button>
                  </>
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
