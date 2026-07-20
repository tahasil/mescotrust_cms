"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, List, Select, Switch, Tooltip, message, Spin, Card } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/StoriesSlider";
const PREFIX = "storiesSlider";
const DEFAULT_ITEMS = [];

function normalizeItem(it, index = 0) {
  return {
    indexLabel: it?.indexLabel != null ? String(it.indexLabel).trim() : "",
    category: it?.category != null ? String(it.category).trim() : "",
    quote: it?.quote != null ? String(it.quote).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    role: it?.role != null ? String(it.role).trim() : "",
    image: it?.image != null ? String(it.image).trim() : "",
    mobileImage: it?.mobileImage != null ? String(it.mobileImage).trim() : "",
    imageAlt: it?.imageAlt != null ? String(it.imageAlt).trim() : "",
    panelStyle: ["default", "ink", "tint"].includes(it?.panelStyle) ? it.panelStyle : index % 4 === 1 ? "ink" : index % 4 === 3 ? "tint" : "default",
    link: it?.link != null ? String(it.link).trim() : "",
    target: it?.target === "_blank" ? "_blank" : "_self",
  };
}

function StoriesSliderEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.storiesSliderItems)
        ? data.storiesSliderItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        storiesSliderTitleEnabled: data?.storiesSliderTitleEnabled !== false,
        storiesSliderSubTitleEnabled: data?.storiesSliderSubTitleEnabled !== false,
        storiesSliderSubTitleColorKey: data?.storiesSliderSubTitleColorKey != null ? String(data.storiesSliderSubTitleColorKey).trim() : "",
        storiesSliderHeadingAccent: data?.storiesSliderHeadingAccent != null ? String(data.storiesSliderHeadingAccent).trim() : "",
        storiesSliderViewAllLabel: data?.storiesSliderViewAllLabel != null ? String(data.storiesSliderViewAllLabel).trim() : "",
        storiesSliderViewAllUrl: data?.storiesSliderViewAllUrl != null ? String(data.storiesSliderViewAllUrl).trim() : "",
        storiesSliderViewAllTarget: data?.storiesSliderViewAllTarget === "_blank" ? "_blank" : "_self",
        storiesSliderPreviousLabel: data?.storiesSliderPreviousLabel != null ? String(data.storiesSliderPreviousLabel).trim() : "Previous story",
        storiesSliderNextLabel: data?.storiesSliderNextLabel != null ? String(data.storiesSliderNextLabel).trim() : "Next story",
        storiesSliderRevealEnabled: data?.storiesSliderRevealEnabled !== false,
        storiesSliderRevealStart: data?.storiesSliderRevealStart || "top 86%",
        storiesSliderRevealDuration: data?.storiesSliderRevealDuration ?? 0.9,
        storiesSliderRevealStagger: data?.storiesSliderRevealStagger ?? 0.08,
        storiesSliderRevealDistance: data?.storiesSliderRevealDistance ?? 30,
        ...Object.fromEntries([
          "storiesSliderHeadingAccentColorKey", "storiesSliderLinkColorKey", "storiesSliderCardBgColorKey",
          "storiesSliderTintCardBgColorKey", "storiesSliderInkCardBgColorKey", "storiesSliderInkCardTextColorKey",
          "storiesSliderIndexColorKey", "storiesSliderBorderColorKey", "storiesSliderInkIndexColorKey",
          "storiesSliderInkRoleColorKey", "storiesSliderButtonBgColorKey", "storiesSliderButtonHoverBgColorKey",
          "storiesSliderButtonHoverIconColorKey",
        ].map((key) => [key, String(data?.[key] ?? "").trim()])),
        storiesSliderNameColorKey: data?.storiesSliderNameColorKey != null ? String(data.storiesSliderNameColorKey).trim() : "",
        storiesSliderRoleColorKey: data?.storiesSliderRoleColorKey != null ? String(data.storiesSliderRoleColorKey).trim() : "",
        storiesSliderQuoteColorKey: data?.storiesSliderQuoteColorKey != null ? String(data.storiesSliderQuoteColorKey).trim() : "",
        storiesSliderArrowColorKey: data?.storiesSliderArrowColorKey != null ? String(data.storiesSliderArrowColorKey).trim() : "",
        storiesSliderDotActiveColorKey: data?.storiesSliderDotActiveColorKey != null ? String(data.storiesSliderDotActiveColorKey).trim() : "",
        storiesSliderAutoplay: data?.storiesSliderAutoplay ?? false,
        storiesSliderShowArrows: data?.storiesSliderShowArrows ?? true,
        storiesSliderShowDots: data?.storiesSliderShowDots ?? true,
        storiesSliderInfinite: data?.storiesSliderInfinite ?? true,
        storiesSliderAutoplaySpeed: data?.storiesSliderAutoplaySpeed ?? 5000,
        storiesSliderSpeed: data?.storiesSliderSpeed ?? 400,
        storiesSliderItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
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
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data, theme))
      .catch(() => message.error("Failed to load Stories Slider"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.storiesSliderItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        storiesSliderTitleEnabled: values.storiesSliderTitleEnabled !== false,
        storiesSliderSubTitleEnabled: values.storiesSliderSubTitleEnabled !== false,
        storiesSliderSubTitleColorKey: values.storiesSliderSubTitleColorKey != null ? String(values.storiesSliderSubTitleColorKey).trim() : "",
        storiesSliderHeadingAccent: String(values.storiesSliderHeadingAccent ?? "").trim(),
        storiesSliderViewAllLabel: String(values.storiesSliderViewAllLabel ?? "").trim(),
        storiesSliderViewAllUrl: String(values.storiesSliderViewAllUrl ?? "").trim(),
        storiesSliderViewAllTarget: values.storiesSliderViewAllTarget === "_blank" ? "_blank" : "_self",
        storiesSliderPreviousLabel: String(values.storiesSliderPreviousLabel ?? "").trim(),
        storiesSliderNextLabel: String(values.storiesSliderNextLabel ?? "").trim(),
        storiesSliderRevealEnabled: values.storiesSliderRevealEnabled !== false,
        storiesSliderRevealStart: String(values.storiesSliderRevealStart || "top 86%").trim(),
        storiesSliderRevealDuration: Number(values.storiesSliderRevealDuration ?? 0.9),
        storiesSliderRevealStagger: Number(values.storiesSliderRevealStagger ?? 0.08),
        storiesSliderRevealDistance: Number(values.storiesSliderRevealDistance ?? 30),
        ...Object.fromEntries([
          "storiesSliderHeadingAccentColorKey", "storiesSliderLinkColorKey", "storiesSliderCardBgColorKey",
          "storiesSliderTintCardBgColorKey", "storiesSliderInkCardBgColorKey", "storiesSliderInkCardTextColorKey",
          "storiesSliderIndexColorKey", "storiesSliderBorderColorKey", "storiesSliderInkIndexColorKey",
          "storiesSliderInkRoleColorKey", "storiesSliderButtonBgColorKey", "storiesSliderButtonHoverBgColorKey",
          "storiesSliderButtonHoverIconColorKey",
        ].map((key) => [key, String(values?.[key] ?? "").trim()])),
        storiesSliderNameColorKey: values.storiesSliderNameColorKey != null ? String(values.storiesSliderNameColorKey).trim() : "",
        storiesSliderRoleColorKey: values.storiesSliderRoleColorKey != null ? String(values.storiesSliderRoleColorKey).trim() : "",
        storiesSliderQuoteColorKey: values.storiesSliderQuoteColorKey != null ? String(values.storiesSliderQuoteColorKey).trim() : "",
        storiesSliderArrowColorKey: values.storiesSliderArrowColorKey != null ? String(values.storiesSliderArrowColorKey).trim() : "",
        storiesSliderDotActiveColorKey: values.storiesSliderDotActiveColorKey != null ? String(values.storiesSliderDotActiveColorKey).trim() : "",
        storiesSliderAutoplay: values.storiesSliderAutoplay === true,
        storiesSliderShowArrows: values.storiesSliderShowArrows !== false,
        storiesSliderShowDots: values.storiesSliderShowDots !== false,
        storiesSliderInfinite: values.storiesSliderInfinite !== false,
        storiesSliderAutoplaySpeed: values.storiesSliderAutoplaySpeed != null ? Math.max(1000, Number(values.storiesSliderAutoplaySpeed)) : 5000,
        storiesSliderSpeed: values.storiesSliderSpeed != null ? Math.max(200, Number(values.storiesSliderSpeed)) : 400,
        storiesSliderItems: items,
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
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Stories Slider saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("StoriesSlider")} />,
          },
          {
            key: "slider-settings",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Behaviour</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    { key: "autoplay", name: "storiesSliderAutoplay", label: "Autoplay", tooltip: "Auto-advance to next slide" },
                    { key: "arrows", name: "storiesSliderShowArrows", label: "Show arrows", tooltip: "Show prev/next navigation arrows" },
                    { key: "dots", name: "storiesSliderShowDots", label: "Show dots", tooltip: "Show dot indicators below slider" },
                    { key: "infinite", name: "storiesSliderInfinite", label: "Infinite", tooltip: "Loop slides endlessly" },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key="switch" name={item.name} valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                          {item.label} <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Speed</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    { key: "autoplaySpeed", name: "storiesSliderAutoplaySpeed", label: "Autoplay delay (ms)", tooltip: "Delay between auto slides (ms)", min: 1000, max: 30000, step: 1000 },
                    { key: "speed", name: "storiesSliderSpeed", label: "Transition (ms)", tooltip: "Animation duration (ms)", min: 200, max: 2000, step: 100 },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key="input" name={item.name} noStyle>
                          <InputNumber size="small" min={item.min} max={item.max} step={item.step} style={{ width: 100 }} />
                        </Form.Item>,
                      ]}
                    >
                      <Tooltip title={item.tooltip}>
                        <span style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(0,0,0,0.65)" }}>
                          {item.label} <QuestionCircleOutlined style={{ fontSize: 12, color: "#999" }} />
                        </span>
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            ),
          },
          {
            key: "links-animation",
            label: "Links & Animation",
            children: (
              <>
                <Form.Item name="storiesSliderViewAllLabel" label="View all label"><Input /></Form.Item>
                <Form.Item name="storiesSliderViewAllUrl" label="View all URL"><Input /></Form.Item>
                <Form.Item name="storiesSliderViewAllTarget" label="View all target"><Select options={[{ label: "Same Tab (_self)", value: "_self" }, { label: "New Tab (_blank)", value: "_blank" }]} /></Form.Item>
                <Row gutter={16}><Col span={12}><Form.Item name="storiesSliderPreviousLabel" label="Previous aria label"><Input /></Form.Item></Col><Col span={12}><Form.Item name="storiesSliderNextLabel" label="Next aria label"><Input /></Form.Item></Col></Row>
                <Form.Item name="storiesSliderRevealEnabled" label="Reveal on scroll" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="storiesSliderRevealStart" label="Reveal trigger"><Input placeholder="top 86%" /></Form.Item>
                <Row gutter={16}><Col span={8}><Form.Item name="storiesSliderRevealDuration" label="Duration s"><InputNumber min={0} step={0.05} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="storiesSliderRevealStagger" label="Stagger s"><InputNumber min={0} step={0.01} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="storiesSliderRevealDistance" label="Distance px"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col></Row>
              </>
            ),
          },
          {
            key: "items",
            label: "Manage Stories",
            children: (
              <Form.List name="storiesSliderItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Story"
                    addButtonText="Add story"
                    defaultAddPayload={{
                      quote: "",
                      name: "",
                      role: "",
                      image: "",
                      mobileImage: "",
                      indexLabel: "",
                      category: "",
                      imageAlt: "",
                      panelStyle: "default",
                      link: "",
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
                      <Row gutter={[16, 16]}>
                        <Col span={12}><Form.Item {...restField} name={[name, "indexLabel"]} label="Index"><Input placeholder="01" /></Form.Item></Col>
                        <Col span={12}><Form.Item {...restField} name={[name, "category"]} label="Category"><Input placeholder="Medical Aid" /></Form.Item></Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "quote"]}
                            label="Quote / Story"
                            rules={[{ required: true, message: "Quote is required" }]}
                          >
                            <Input.TextArea rows={4} placeholder="Their story or testimonial..." size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            label="Name"
                            rules={[{ required: true, message: "Name is required" }]}
                          >
                            <Input placeholder="e.g. Ms. Priyanka Vasudev" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "role"]} label="Role / Title">
                            <Input placeholder="e.g. Trainer Coach, Epicenter" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Card size="small" title="Desktop Image">
                            <Form.Item
                              {...restField}
                              name={[name, "image"]}
                              validateTrigger={["onChange", "onBlur"]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/uploads/story-desktop.webp"
                                uiVariant="stacked"
                                hintText="Recommended: landscape, 4:3 ratio"
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={24}>
                          <Card size="small" title="Mobile Image">
                            <Form.Item
                              {...restField}
                              name={[name, "mobileImage"]}
                              validateTrigger={["onChange", "onBlur"]}
                              style={{ marginBottom: 0 }}
                            >
                              <MediaPickerInput
                                placeholder="/uploads/story-mobile.webp"
                                uiVariant="stacked"
                                hintText="Optional mobile override"
                              />
                            </Form.Item>
                          </Card>
                        </Col>
                        <Col span={12}><Form.Item {...restField} name={[name, "imageAlt"]} label="Image alt text"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item {...restField} name={[name, "panelStyle"]} label="Panel style"><Select options={[{ label: "Standard", value: "default" }, { label: "Dark", value: "ink" }, { label: "Tinted", value: "tint" }]} /></Form.Item></Col>
                        <Col span={16}><Form.Item {...restField} name={[name, "link"]} label="Story URL"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item {...restField} name={[name, "target"]} label="Target"><Select options={[{ label: "_self", value: "_self" }, { label: "_blank", value: "_blank" }]} /></Form.Item></Col>
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

export default forwardRef(StoriesSliderEditForm);
