"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, Select, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

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
    const normalize = (data) => ({
      subscribeSubtitle: data?.subscribeSubtitle != null ? String(data.subscribeSubtitle).trim() : "",
      subscribeTitle: data?.subscribeTitle != null ? String(data.subscribeTitle).trim() : "",
      subscribeHeadingAccent: String(data?.subscribeHeadingAccent ?? "").trim(),
      subscribePrimaryButtonLabel: String(data?.subscribePrimaryButtonLabel ?? "").trim(),
      subscribePrimaryButtonUrl: String(data?.subscribePrimaryButtonUrl ?? "").trim(),
      subscribePrimaryButtonTarget: data?.subscribePrimaryButtonTarget === "_blank" ? "_blank" : "_self",
      subscribeSecondaryButtonLabel: String(data?.subscribeSecondaryButtonLabel ?? "").trim(),
      subscribeSecondaryButtonUrl: String(data?.subscribeSecondaryButtonUrl ?? "").trim(),
      subscribeSecondaryButtonTarget: data?.subscribeSecondaryButtonTarget === "_blank" ? "_blank" : "_self",
      subscribeFillStart: String(data?.subscribeFillStart ?? "top 85%").trim(),
      subscribeFillEnd: String(data?.subscribeFillEnd ?? "top 30%").trim(),
      subscribeFillScrub: data?.subscribeFillScrub ?? 1,
      ...Object.fromEntries(["subscribeAccentColorKey","subscribeOutlineColorKey","subscribePrimaryButtonBgColorKey","subscribePrimaryButtonTextColorKey","subscribeSecondaryButtonBgColorKey","subscribeSecondaryButtonTextColorKey","subscribeInputBorderColorKey","subscribeInputBgColorKey","subscribeInputTextColorKey","subscribeFocusColorKey","subscribeErrorColorKey"].map((key)=>[key,String(data?.[key]??"").trim()])),
      subscribePlaceholder: data?.subscribePlaceholder != null ? String(data.subscribePlaceholder).trim() : "",
      subscribeButtonText: data?.subscribeButtonText != null ? String(data.subscribeButtonText).trim() : "",
      subscribeBgDesktop:
        data?.subscribeBgDesktop != null
          ? String(data.subscribeBgDesktop).trim()
          : data?.subscribeBgUrl != null
            ? String(data.subscribeBgUrl).trim()
            : "",
      subscribeBgMobile:
        data?.subscribeBgMobile != null ? String(data.subscribeBgMobile).trim() : "",
      subscribeBgUrl:
        data?.subscribeBgDesktop != null
          ? String(data.subscribeBgDesktop).trim()
          : data?.subscribeBgUrl != null
            ? String(data.subscribeBgUrl).trim()
            : "",
      subscribeSubtitleColorKey: data?.subscribeSubtitleColorKey != null ? String(data.subscribeSubtitleColorKey).trim() : "",
      subscribeTitleColorKey: data?.subscribeTitleColorKey != null ? String(data.subscribeTitleColorKey).trim() : "",
      subscribeButtonBgColorKey: data?.subscribeButtonBgColorKey != null ? String(data.subscribeButtonBgColorKey).trim() : "",
      subscribeButtonTextColorKey: data?.subscribeButtonTextColorKey != null ? String(data.subscribeButtonTextColorKey).trim() : "",
      ...getManageSectionInitialValues("subscribe", data),
    });

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
        subscribeFillStart: String(values.subscribeFillStart ?? "").trim(),
        subscribeFillEnd: String(values.subscribeFillEnd ?? "").trim(),
        subscribeFillScrub: Number(values.subscribeFillScrub ?? 1),
        ...Object.fromEntries(["subscribeAccentColorKey","subscribeOutlineColorKey","subscribePrimaryButtonBgColorKey","subscribePrimaryButtonTextColorKey","subscribeSecondaryButtonBgColorKey","subscribeSecondaryButtonTextColorKey","subscribeInputBorderColorKey","subscribeInputBgColorKey","subscribeInputTextColorKey","subscribeFocusColorKey","subscribeErrorColorKey"].map((key)=>[key,String(values?.[key]??"").trim()])),
        subscribePlaceholder: String(values.subscribePlaceholder ?? "").trim(),
        subscribeButtonText: String(values.subscribeButtonText ?? "").trim(),
        subscribeBgDesktop:
          values.subscribeBgDesktop != null
            ? String(values.subscribeBgDesktop).trim()
            : values.subscribeBgUrl != null
              ? String(values.subscribeBgUrl).trim()
              : "",
        subscribeBgMobile:
          values.subscribeBgMobile != null
            ? String(values.subscribeBgMobile).trim()
            : "",
        subscribeBgUrl:
          values.subscribeBgDesktop != null
            ? String(values.subscribeBgDesktop).trim()
            : values.subscribeBgUrl != null
              ? String(values.subscribeBgUrl).trim()
              : "",
        subscribeSubtitleColorKey: String(values.subscribeSubtitleColorKey ?? "").trim(),
        subscribeTitleColorKey: String(values.subscribeTitleColorKey ?? "").trim(),
        subscribeButtonBgColorKey: String(values.subscribeButtonBgColorKey ?? "").trim(),
        subscribeButtonTextColorKey: String(values.subscribeButtonTextColorKey ?? "").trim(),
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
                <Col span={8}><Form.Item name="subscribePrimaryButtonTarget" label="Target"><Select options={[{label:"_self",value:"_self"},{label:"_blank",value:"_blank"}]} /></Form.Item></Col>
                <Col span={24}><Form.Item name="subscribeSecondaryButtonLabel" label="Secondary button label"><Input size="large" /></Form.Item></Col>
                <Col span={16}><Form.Item name="subscribeSecondaryButtonUrl" label="Secondary button URL"><Input size="large" /></Form.Item></Col>
                <Col span={8}><Form.Item name="subscribeSecondaryButtonTarget" label="Target"><Select options={[{label:"_self",value:"_self"},{label:"_blank",value:"_blank"}]} /></Form.Item></Col>
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
                <Col span={24}>
                  <Form.Item name="subscribeBgDesktop" label="Desktop Background Image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Recommended for desktop/tablet"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="subscribeBgMobile" label="Mobile Background Image">
                    <MediaPickerInput
                      placeholder="/uploads/..."
                      uiVariant="stacked"
                      hintText="Optional. Desktop image will be used if empty."
                    />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "animation",
            label: "Headline Animation",
            children: <><Form.Item name="subscribeFillStart" label="Start trigger"><Input placeholder="top 85%" /></Form.Item><Form.Item name="subscribeFillEnd" label="End trigger"><Input placeholder="top 30%" /></Form.Item><Form.Item name="subscribeFillScrub" label="Scrub smoothing"><Input type="number" min="0" step="0.1" /></Form.Item></>,
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SubscribeEditForm);
