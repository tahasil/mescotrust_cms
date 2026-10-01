"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, Select, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const SUBSCRIBE_COLOR_FIELDS = [
  "subscribeTitleColorKey",
  "subscribeAccentColorKey",
  "subscribeOutlineColorKey",
  "subscribePrimaryButtonBgColorKey",
  "subscribePrimaryButtonTextColorKey",
  "subscribeSecondaryButtonBgColorKey",
  "subscribeSecondaryButtonTextColorKey",
  "subscribeSubtitleColorKey",
  "subscribeInputBgColorKey",
  "subscribeInputBorderColorKey",
  "subscribeInputTextColorKey",
  "subscribeFocusColorKey",
  "subscribeButtonBgColorKey",
  "subscribeButtonTextColorKey",
  "subscribeErrorColorKey",
];
const SUBSCRIBE_DEFAULT_COLORS = {
  subscribeTitleColorKey: "black",
  subscribeAccentColorKey: "primary",
  subscribeOutlineColorKey: "blackLight",
  subscribePrimaryButtonBgColorKey: "primary",
  subscribePrimaryButtonTextColorKey: "white",
  subscribeSecondaryButtonBgColorKey: "dark",
  subscribeSecondaryButtonTextColorKey: "warmWhite",
  subscribeSubtitleColorKey: "blackLight",
  subscribeInputBgColorKey: "white",
  subscribeInputBorderColorKey: "border",
  subscribeInputTextColorKey: "black",
  subscribeFocusColorKey: "primary",
  subscribeButtonBgColorKey: "dark",
  subscribeButtonTextColorKey: "warmWhite",
  subscribeErrorColorKey: "primary",
};
const LEGACY_SUBSCRIBE_TITLE =
  "To get weekly & monthly news, Subscribe to our newsletter.";

/**
 * Edit form for Subscribe — used in component edit page or page builder drawer.
 * When source="page": data from block.props (pages collection); save updates layout only.
 * Theme colors: same pattern as HomeHero — Select from theme palette.
 */
function SubscribeEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onDataLoad, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const [initialData, setInitialData] = useState(null);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const normalize = (data) => {
      const title = String(data?.subscribeTitle ?? "").trim();
      const accent = String(data?.subscribeHeadingAccent ?? "").trim();
      const isLegacySeed = title === LEGACY_SUBSCRIBE_TITLE && !accent;
      return {
      subscribeSubtitle: isLegacySeed ? "Subscribe to our newsletter for weekly and monthly news" : String(data?.subscribeSubtitle ?? "").trim(),
      subscribeTitle: isLegacySeed ? "Be someone's" : title,
      subscribeHeadingAccent: isLegacySeed ? "tomorrow." : accent,
      subscribePrimaryButtonLabel: isLegacySeed ? "Donate Now" : String(data?.subscribePrimaryButtonLabel ?? "").trim(),
      subscribePrimaryButtonUrl: isLegacySeed ? "/donate-now" : String(data?.subscribePrimaryButtonUrl ?? "").trim(),
      subscribePrimaryButtonTarget: data?.subscribePrimaryButtonTarget === "_blank" ? "_blank" : "_self",
      subscribeSecondaryButtonLabel: isLegacySeed ? "Become a Volunteer" : String(data?.subscribeSecondaryButtonLabel ?? "").trim(),
      subscribeSecondaryButtonUrl: isLegacySeed ? "/about-us/volunteer" : String(data?.subscribeSecondaryButtonUrl ?? "").trim(),
      subscribeSecondaryButtonTarget: data?.subscribeSecondaryButtonTarget === "_blank" ? "_blank" : "_self",
      ...Object.fromEntries(SUBSCRIBE_COLOR_FIELDS.map((key)=>[key,isLegacySeed?SUBSCRIBE_DEFAULT_COLORS[key]:String(data?.[key]??SUBSCRIBE_DEFAULT_COLORS[key]??"").trim()])),
      subscribePlaceholder: isLegacySeed ? "you@example.com" : String(data?.subscribePlaceholder ?? "").trim(),
      subscribeButtonText: String(data?.subscribeButtonText ?? "Subscribe").trim(),
      ...getManageSectionInitialValues("subscribe", data),
      };
    };

    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const normalized = normalize(data);
      setInitialData(normalized);
      onDataLoad?.(normalized);
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

    setInitialData(null);
    Promise.all([
      fetch("/api/theme/subscribe", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => {
        const normalized = normalize(data);
        setInitialData(normalized);
        onDataLoad?.(normalized);
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => message.error("Failed to load Subscribe"))
      .finally(() => setLoading(false));
  }, [isPageBlock, initialDataProp]);

  useEffect(() => {
    if (initialData) form.setFieldsValue(initialData);
  }, [initialData, form]);

  const handleUpdate = () => {
    return form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        subscribeSubtitle: String(values.subscribeSubtitle ?? "").trim(),
        subscribeTitle: String(values.subscribeTitle ?? "").trim(),
        subscribeHeadingAccent: String(values.subscribeHeadingAccent ?? "").trim(),
        subscribePrimaryButtonLabel: String(values.subscribePrimaryButtonLabel ?? "").trim(),
        subscribePrimaryButtonUrl: String(values.subscribePrimaryButtonUrl ?? "").trim(),
        subscribePrimaryButtonTarget: values.subscribePrimaryButtonTarget === "_blank" ? "_blank" : "_self",
        subscribeSecondaryButtonLabel: String(values.subscribeSecondaryButtonLabel ?? "").trim(),
        subscribeSecondaryButtonUrl: String(values.subscribeSecondaryButtonUrl ?? "").trim(),
        subscribeSecondaryButtonTarget: values.subscribeSecondaryButtonTarget === "_blank" ? "_blank" : "_self",
        ...Object.fromEntries(SUBSCRIBE_COLOR_FIELDS.map((key)=>[key,String(values?.[key]??"").trim()])),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        ...getManageSectionPayload("subscribe", values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.(payload);
        return;
      }
      setSaving(true);
      return fetch("/api/theme/subscribe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d?.error || d));
          return res.json();
        })
        .then((savedTheme) => {
          message.success("Subscribe saved");
          onSuccess?.(savedTheme || payload);
        })
        .catch((err) => {
          message.error(err?.error || "Failed to save Subscribe");
          throw err;
        })
        .finally(() => setSaving(false));
    });
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading || initialData === null) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" initialValues={initialData} key="subscribe-edit-form">
      <Collapse
        defaultActiveKey={[]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix="subscribe" form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Subscribe")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Form.Item name="subscribePrimaryButtonLabel" label="Primary button label"><Input size="large" /></Form.Item>
                </Col>
                <Col span={16}><Form.Item name="subscribePrimaryButtonUrl" label="Primary button URL"><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="subscribePrimaryButtonTarget" label="Target"><Select options={[{label:"Same Window (_self)",value:"_self"},{label:"New Tab (_blank)",value:"_blank"}]} /></Form.Item></Col>
                <Col span={24}><Form.Item name="subscribeSecondaryButtonLabel" label="Secondary button label"><Input size="large" /></Form.Item></Col>
                <Col span={16}><Form.Item name="subscribeSecondaryButtonUrl" label="Secondary button URL"><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="subscribeSecondaryButtonTarget" label="Target"><Select options={[{label:"Same Window (_self)",value:"_self"},{label:"New Tab (_blank)",value:"_blank"}]} /></Form.Item></Col>
                <Col span={24}>
                  <Form.Item name="subscribePlaceholder" label="Email placeholder">
                    <Input placeholder="e.g. Enter email address" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeButtonText" label="Button text">
                    <Input placeholder="e.g. Subscribe" size="large" />
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

export default forwardRef(SubscribeEditForm);
