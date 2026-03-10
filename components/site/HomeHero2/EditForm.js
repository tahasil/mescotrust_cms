"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Button, message, Spin, Collapse } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/HomeHero2";
const PREFIX = "homeHero2";

const DEFAULT_SUBTITLE =
  "A community-powered initiative that brings donors, mentors, and resources together to help learners overcome barriers and continue their education—turning collective support into real opportunities.";

/**
 * Edit form for HomeHero2 — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function HomeHero2EditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const dataLoadedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      const sliderItems = Array.isArray(data.homeHero2SliderImages) ? data.homeHero2SliderImages : [];
      if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Because Every Learner",
        mainTitleHighlight: data.mainTitleHighlight ?? "Deserves Support",
        subTitle: data.subTitle ?? DEFAULT_SUBTITLE,
        titleColorKey: data.titleColorKey ?? "",
        homeHero2ButtonBgColorKey: data.homeHero2ButtonBgColorKey ?? "",
        homeHero2ButtonTextColorKey: data.homeHero2ButtonTextColorKey ?? "",
        buttonText: data.buttonText ?? "Contact Us",
        buttonHref: data.buttonHref ?? "/",
        heroIconUrl: data.heroIconUrl ?? "/images/hero-icon.svg",
        homeHero2SliderImages: sliderItems.length > 0 ? sliderItems : [{ src: "", alt: "" }],
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
      });
      setLoading(false);
      return;
    }
    if (dataLoadedRef.current) {
      setLoading(false);
      return;
    }
    dataLoadedRef.current = true;
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const palette = data?.themePalette && typeof data.themePalette === "object" ? data.themePalette : {};
        const custom = Array.isArray(data?.colors) ? data.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        const { themePalette: _p, colors: _c, ...formData } = data || {};
        const sliderItems = Array.isArray(formData?.homeHero2SliderImages) ? formData.homeHero2SliderImages : [];
        form.setFieldsValue({
          mainTitle: (formData && formData.mainTitle) ?? "Because Every Learner",
          mainTitleHighlight: (formData && formData.mainTitleHighlight) ?? "Deserves Support",
          subTitle: (formData && formData.subTitle) ?? DEFAULT_SUBTITLE,
          titleColorKey: (formData && formData.titleColorKey) ?? "",
          homeHero2ButtonBgColorKey: (formData && formData.homeHero2ButtonBgColorKey) ?? "",
          homeHero2ButtonTextColorKey: (formData && formData.homeHero2ButtonTextColorKey) ?? "",
          buttonText: (formData && formData.buttonText) ?? "Contact Us",
          buttonHref: (formData && formData.buttonHref) ?? "/",
          heroIconUrl: (formData && formData.heroIconUrl) ?? "/images/hero-icon.svg",
          homeHero2SliderImages: sliderItems.length > 0 ? sliderItems : [{ src: "", alt: "" }],
          ...getManageSectionInitialValues(PREFIX, formData),
          ...(formData && typeof formData === "object" ? formData : {}),
        });
      })
      .catch(() => message.error("Failed to load HomeHero2"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const sliderRaw = values.homeHero2SliderImages;
      const homeHero2SliderImages = Array.isArray(sliderRaw)
        ? sliderRaw
            .filter((s) => s && (s.src || s.url))
            .map((s) => ({ src: (s.src || s.url || "").trim(), alt: (s.alt != null ? String(s.alt) : "").trim() }))
        : [];
      const payload = {
        ...values,
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        mainTitleHighlight: values.mainTitleHighlight != null ? String(values.mainTitleHighlight).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        homeHero2ButtonBgColorKey: values.homeHero2ButtonBgColorKey != null ? String(values.homeHero2ButtonBgColorKey).trim() : "",
        homeHero2ButtonTextColorKey: values.homeHero2ButtonTextColorKey != null ? String(values.homeHero2ButtonTextColorKey).trim() : "",
        homeHero2SliderImages,
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
          message.success("Home Hero 2 saved");
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("HomeHero2")} />,
          },
          {
            key: "content",
            label: "Hero & Button",
            children: (
              <>
                <Form.Item name="heroIconUrl" label="Hero icon image URL">
                  <Input placeholder="/images/hero-icon.svg" />
                </Form.Item>
                <Form.Item name="buttonText" label="Button text">
                  <Input placeholder="Contact Us" />
                </Form.Item>
                <Form.Item name="buttonHref" label="Button link (URL or path)">
                  <Input placeholder="/ or /contact" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "slider",
            label: "Circular slider images",
            children: (
              <Form.List name="homeHero2SliderImages">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                        <Form.Item {...rest} name={[name, "src"]} label="Image URL" style={{ flex: 1 }}>
                          <Input placeholder="/images/slider-1.png" />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, "alt"]} label="Alt" style={{ width: 120 }}>
                          <Input placeholder="Alt text" />
                        </Form.Item>
                        <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add({ src: "", alt: "" })} block icon={<PlusOutlined />}>
                        Add slider image
                      </Button>
                    </Form.Item>
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

export default forwardRef(HomeHero2EditForm);
