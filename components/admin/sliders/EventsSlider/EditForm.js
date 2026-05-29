"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, InputNumber, Select, message, Spin, Collapse, List, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/EventsSlider";
const PREFIX = "eventsSlider";

function EventsSliderEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  const applyValues = (data) => {
    form.setFieldsValue({
      eventsSliderSubTitle: data?.eventsSliderSubTitle != null ? String(data.eventsSliderSubTitle).trim() : "Upcoming",
      eventsSliderMainTitle: data?.eventsSliderMainTitle != null ? String(data.eventsSliderMainTitle).trim() : "Events",
      eventsSliderTitleEnabled: data?.eventsSliderTitleEnabled !== false,
      eventsSliderSubTitleEnabled: data?.eventsSliderSubTitleEnabled !== false,
      eventsSliderLimit: data?.eventsSliderLimit != null ? Number(data.eventsSliderLimit) : 8,
      eventsSliderSort: data?.eventsSliderSort === "recent" ? "recent" : "upcoming",
      eventsSliderSubTitleColorKey: data?.eventsSliderSubTitleColorKey != null ? String(data.eventsSliderSubTitleColorKey).trim() : "",
      eventsSliderMainTitleColorKey: data?.eventsSliderMainTitleColorKey != null ? String(data.eventsSliderMainTitleColorKey).trim() : "",
      eventsSliderDateColorKey: data?.eventsSliderDateColorKey != null ? String(data.eventsSliderDateColorKey).trim() : "",
      eventsSliderDescColorKey: data?.eventsSliderDescColorKey != null ? String(data.eventsSliderDescColorKey).trim() : "",
      eventsSliderArrowColorKey: data?.eventsSliderArrowColorKey != null ? String(data.eventsSliderArrowColorKey).trim() : "",
      eventsSliderArrowBgColorKey: data?.eventsSliderArrowBgColorKey != null ? String(data.eventsSliderArrowBgColorKey).trim() : "",
      eventsSliderDotActiveColorKey: data?.eventsSliderDotActiveColorKey != null ? String(data.eventsSliderDotActiveColorKey).trim() : "",
      eventsSliderButtonBgColorKey: data?.eventsSliderButtonBgColorKey != null ? String(data.eventsSliderButtonBgColorKey).trim() : "",
      eventsSliderButtonTextColorKey: data?.eventsSliderButtonTextColorKey != null ? String(data.eventsSliderButtonTextColorKey).trim() : "",
      eventsSliderButtonRadius: data?.eventsSliderButtonRadius != null ? Number(data.eventsSliderButtonRadius) : 999,
      eventsSliderButtonSize: data?.eventsSliderButtonSize != null ? String(data.eventsSliderButtonSize).trim() : "md",
      eventsSliderAutoplay: data?.eventsSliderAutoplay ?? false,
      eventsSliderShowArrows: data?.eventsSliderShowArrows ?? true,
      eventsSliderShowDots: data?.eventsSliderShowDots ?? true,
      eventsSliderInfinite: data?.eventsSliderInfinite ?? true,
      eventsSliderAutoplaySpeed: data?.eventsSliderAutoplaySpeed ?? 5000,
      eventsSliderSpeed: data?.eventsSliderSpeed ?? 450,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  };

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      applyValues(initialDataProp ?? {});
      if (!themeFetchedForColorsRef.current) {
        themeFetchedForColorsRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((theme) => {
            const palette = theme?.themePalette || {};
            const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
            const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
            setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
          })
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
      .then(([data, theme]) => {
        applyValues(data);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Events slider"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        eventsSliderSubTitle: values.eventsSliderSubTitle ?? "",
        eventsSliderMainTitle: values.eventsSliderMainTitle ?? "",
        eventsSliderTitleEnabled: values.eventsSliderTitleEnabled !== false,
        eventsSliderSubTitleEnabled: values.eventsSliderSubTitleEnabled !== false,
        eventsSliderLimit: values.eventsSliderLimit ?? 8,
        eventsSliderSort: values.eventsSliderSort === "recent" ? "recent" : "upcoming",
        eventsSliderSubTitleColorKey: values.eventsSliderSubTitleColorKey ?? "",
        eventsSliderMainTitleColorKey: values.eventsSliderMainTitleColorKey ?? "",
        eventsSliderDateColorKey: values.eventsSliderDateColorKey ?? "",
        eventsSliderDescColorKey: values.eventsSliderDescColorKey ?? "",
        eventsSliderArrowColorKey: values.eventsSliderArrowColorKey ?? "",
        eventsSliderArrowBgColorKey: values.eventsSliderArrowBgColorKey ?? "",
        eventsSliderDotActiveColorKey: values.eventsSliderDotActiveColorKey ?? "",
        eventsSliderButtonBgColorKey: values.eventsSliderButtonBgColorKey ?? "",
        eventsSliderButtonTextColorKey: values.eventsSliderButtonTextColorKey ?? "",
        eventsSliderButtonRadius: values.eventsSliderButtonRadius != null ? Math.max(0, Number(values.eventsSliderButtonRadius)) : 999,
        eventsSliderButtonSize: values.eventsSliderButtonSize === "sm" || values.eventsSliderButtonSize === "lg" ? values.eventsSliderButtonSize : "md",
        eventsSliderAutoplay: values.eventsSliderAutoplay === true,
        eventsSliderShowArrows: values.eventsSliderShowArrows !== false,
        eventsSliderShowDots: values.eventsSliderShowDots !== false,
        eventsSliderInfinite: values.eventsSliderInfinite !== false,
        eventsSliderAutoplaySpeed: values.eventsSliderAutoplaySpeed != null ? Math.max(1000, Number(values.eventsSliderAutoplaySpeed)) : 5000,
        eventsSliderSpeed: values.eventsSliderSpeed != null ? Math.max(200, Number(values.eventsSliderSpeed)) : 450,
        ...getManageSectionPayload(PREFIX, values),
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
          message.success("Events slider saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading) return <Spin />;

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: (
              <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />
            ),
          },
          {
            key: "title-colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("EventsSlider")} />
            ),
          },
          {
            key: "slider-settings",
            label: "Slider Settings",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Form.Item name="eventsSliderLimit" label="Number of slides" rules={[{ required: true }]}>
                  <InputNumber min={1} max={20} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="eventsSliderSort" label="Event order" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: "upcoming", label: "Upcoming (soonest start date first)" },
                      { value: "recent", label: "Recently updated" },
                    ]}
                  />
                </Form.Item>
                <List
                  header={<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>Behaviour</span>}
                  size="small"
                  bordered
                  split
                  dataSource={[
                    { key: "autoplay", name: "eventsSliderAutoplay", label: "Autoplay", tooltip: "Auto-advance to next slide" },
                    { key: "arrows", name: "eventsSliderShowArrows", label: "Show arrows", tooltip: "Show prev/next navigation arrows" },
                    { key: "dots", name: "eventsSliderShowDots", label: "Show dots", tooltip: "Show dot indicators below slider" },
                    { key: "infinite", name: "eventsSliderInfinite", label: "Infinite", tooltip: "Loop slides endlessly" },
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
                    { key: "autoplaySpeed", name: "eventsSliderAutoplaySpeed", label: "Autoplay delay (ms)", tooltip: "Delay between auto slides (ms)", min: 1000, max: 30000, step: 1000 },
                    { key: "speed", name: "eventsSliderSpeed", label: "Transition (ms)", tooltip: "Animation duration (ms)", min: 200, max: 2000, step: 50 },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Form.Item key="input" name={item.name} noStyle>
                          <InputNumber size="small" min={item.min} max={item.max} step={item.step} style={{ width: 120 }} />
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
            key: "button-style",
            label: "Button Style",
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Form.Item name="eventsSliderButtonSize" label="Button size">
                  <Select
                    options={[
                      { value: "sm", label: "Small" },
                      { value: "md", label: "Medium" },
                      { value: "lg", label: "Large" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="eventsSliderButtonRadius" label="Button radius">
                  <InputNumber min={0} max={999} style={{ width: "100%" }} />
                </Form.Item>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                  Button colors are configured in <b>Colors</b>.
                </div>
              </div>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(EventsSliderEditForm);

