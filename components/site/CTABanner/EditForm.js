"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Collapse, Form, Input, Select, Space, Spin, message } from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";

const API_PATH = "/api/theme/CTABanner";
const TARGET_OPTIONS = [
  { value: "_self", label: "Same Tab (_self)" },
  { value: "_blank", label: "New Tab (_blank)" },
];
const DEFAULTS = {
  ctaBannerTitle: "Be someone's *tomorrow.*",
  ctaBannerDonateText: "Donate Now",
  ctaBannerDonateLink: "/donate-now",
  ctaBannerDonateTarget: "_self",
  ctaBannerVolunteerText: "Become a Volunteer",
  ctaBannerVolunteerLink: "/about-us/volunteer",
  ctaBannerVolunteerTarget: "_self",
  titleHighlightColorKey: "primarySoft",
};
const FIELDS = Object.keys(DEFAULTS);
const clean = (value, fallback = "") =>
  value == null ? fallback : String(value).trim();
const normalizeTarget = (value) => (value === "_blank" ? "_blank" : "_self");
const pageUrl = (slug) => {
  const value = clean(slug).replace(/^\/+|\/+$/g, "");
  return !value || value === "home" ? "/" : `/${value}`;
};

function PageLinkInput({ value, onChange, pages, placeholder }) {
  const normalizedValue = clean(value);
  const internalValue = pages.some(
    (page) => pageUrl(page?.slug) === normalizedValue,
  )
    ? normalizedValue
    : undefined;

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        value={internalValue}
        placeholder="Select an internal CMS page"
        onChange={(nextValue) => onChange?.(nextValue || "")}
        options={pages.map((page) => ({
          value: pageUrl(page?.slug),
          label: `${clean(page?.title, "Untitled")} (${pageUrl(page?.slug)})`,
        }))}
      />
      <MediaPickerInput
        value={normalizedValue}
        onChange={onChange}
        mediaType="document"
        showVariants={false}
        placeholder={placeholder}
        hintText="Choose a CMS page above, type an external URL, or select/upload a downloadable file."
      />
    </Space>
  );
}

function validateLink(_, value) {
  const link = clean(value);
  if (!link) return Promise.reject(new Error("Link is required"));
  if (
    link.startsWith("/") ||
    link.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(link)
  ) {
    return Promise.resolve();
  }
  return Promise.reject(
    new Error("Select a CMS page, enter an external URL, or choose a file"),
  );
}

function CTABannerEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const isPageBlock = source === "page";

  useEffect(() => {
    fetch("/api/theme", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((item) => item?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => setThemeColorOptions([]));

    fetch("/api/admin/pages?limit=200&fields=title,slug,status&includeTotal=0", {
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data) => setPages(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setPages([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      form.setFieldsValue({ ...DEFAULTS, ...(initialDataProp || {}) });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => form.setFieldsValue({ ...DEFAULTS, ...(data || {}) }))
      .catch(() => message.error("Failed to load CTA Banner"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock]);

  const handleUpdate = () => {
    form
      .validateFields()
      .then(() => {
        const values = form.getFieldsValue(true);
        const payload = Object.fromEntries(
          FIELDS.map((field) => [
            field,
            field.endsWith("Target")
              ? normalizeTarget(values[field])
              : clean(values[field]),
          ]),
        );
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
          .then((response) =>
            response.ok
              ? undefined
              : response.json().then((data) => Promise.reject(data)),
          )
          .then(() => {
            message.success("CTA Banner saved");
            onSuccess?.();
          })
          .catch((error) => message.error(error?.error || "Failed to save"))
          .finally(() => setSaving(false));
      })
      .catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading || saving) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["content", "donate", "volunteer"]}
        items={[
          {
            key: "content",
            label: "Content",
            children: (
              <Form.Item
                name="ctaBannerTitle"
                label="CTA Title"
                extra="Wrap accented words in asterisks, for example: Be someone's *tomorrow.*"
                rules={[{ required: true, whitespace: true }]}
              >
                <Input />
              </Form.Item>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                colorListItems={[
                  {
                    name: "titleHighlightColorKey",
                    label: "Highlighted/Accent Text",
                    tooltip: "Theme color for highlighted CTA title text",
                  },
                ]}
              />
            ),
          },
          {
            key: "donate",
            label: "Donate Button",
            children: (
              <>
                <Form.Item
                  name="ctaBannerDonateText"
                  label="Donate Button Text"
                  rules={[{ required: true, whitespace: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="ctaBannerDonateLink"
                  label="Donate Button Link"
                  rules={[{ validator: validateLink }]}
                >
                  <PageLinkInput
                    pages={pages}
                    placeholder="/donate-now or https://example.com"
                  />
                </Form.Item>
                <Form.Item
                  name="ctaBannerDonateTarget"
                  label="Donate Button Target"
                >
                  <Select options={TARGET_OPTIONS} />
                </Form.Item>
              </>
            ),
          },
          {
            key: "volunteer",
            label: "Volunteer Button",
            children: (
              <>
                <Form.Item
                  name="ctaBannerVolunteerText"
                  label="Volunteer Button Text"
                  rules={[{ required: true, whitespace: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="ctaBannerVolunteerLink"
                  label="Volunteer Button Link"
                  rules={[{ validator: validateLink }]}
                >
                  <PageLinkInput
                    pages={pages}
                    placeholder="/about-us/volunteer or https://example.com"
                  />
                </Form.Item>
                <Form.Item
                  name="ctaBannerVolunteerTarget"
                  label="Volunteer Button Target"
                >
                  <Select options={TARGET_OPTIONS} />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(CTABannerEditForm);
