"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Card, Collapse, Form, Input, InputNumber, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { ColorSettingsCard, SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/BlogDetails";
const PREFIX = "blogDetails";

export const BLOG_DETAILS_DEFAULTS = {
  blogDetailsShareLabel: "Share",
  blogDetailsLoadingLabel: "Loading blog details...",
  blogDetailsShowImage: true,
  blogDetailsShowCategory: true,
  blogDetailsShowMeta: true,
  blogDetailsShowShare: true,
  blogDetailsShowExcerpt: true,
  blogDetailsShowContent: true,
  blogDetailsShowTags: true,
  blogDetailsShowComments: true,
  blogDetailsShowSidebar: true,
  blogDetailsImageRadius: 12,
  blogDetailsColumnGap: 40,
  blogDetailsTextColorKey: "",
  blogDetailsTitleColorKey: "",
  blogDetailsContentColorKey: "",
  blogDetailsMutedColorKey: "",
  blogDetailsMetaColorKey: "",
  blogDetailsAccentColorKey: "",
  blogDetailsSurfaceColorKey: "",
  blogDetailsBorderColorKey: "",
};

const COLORS = [
  { name: "blogDetailsTextColorKey", label: "Text", tooltip: "Default detail text" },
  { name: "blogDetailsTitleColorKey", label: "Blog title", tooltip: "Blog title color" },
  { name: "blogDetailsContentColorKey", label: "Blog content", tooltip: "Article body color" },
  { name: "blogDetailsMutedColorKey", label: "Excerpt & tags", tooltip: "Supporting text color" },
  { name: "blogDetailsMetaColorKey", label: "Date & author", tooltip: "Metadata text color" },
  { name: "blogDetailsAccentColorKey", label: "Accent", tooltip: "Category, links and share hover color" },
  { name: "blogDetailsSurfaceColorKey", label: "Tag background", tooltip: "Tag surface color" },
  { name: "blogDetailsBorderColorKey", label: "Borders", tooltip: "Dividers and borders" },
];

function themeOptions(theme) {
  const names = [...Object.keys(theme?.themePalette || {}), ...(Array.isArray(theme?.colors) ? theme.colors.map((item) => item?.name).filter(Boolean) : [])];
  return [...new Set(names)].sort((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name }));
}

function BlogDetailsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: providedOptions = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState(providedOptions);
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => { if (providedOptions.length) setOptions(providedOptions); }, [providedOptions]);
  useEffect(() => {
    const apply = (data = {}) => form.setFieldsValue({
      ...BLOG_DETAILS_DEFAULTS,
      ...data,
      ...Object.fromEntries(["Image", "Category", "Meta", "Share", "Excerpt", "Content", "Tags", "Comments", "Sidebar"].map((key) => [`blogDetailsShow${key}`, data[`blogDetailsShow${key}`] !== false])),
      ...getManageSectionInitialValues(PREFIX, data),
    });
    setLoading(true);
    if (isPageBlock) {
      apply(initialDataProp || {});
      if (!fetchedRef.current && !providedOptions.length) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}).then((theme) => setOptions(themeOptions(theme))).catch(() => {}).finally(() => setLoading(false));
      } else setLoading(false);
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
    ]).then(([data, theme]) => { apply(data); setOptions(themeOptions(theme)); }).catch(() => message.error("Failed to load Blog Details settings")).finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock, providedOptions.length]);

  const update = useCallback(() => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...BLOG_DETAILS_DEFAULTS,
        ...values,
        blogDetailsImageRadius: Math.max(0, Number(values.blogDetailsImageRadius) || 0),
        blogDetailsColumnGap: Math.max(16, Number(values.blogDetailsColumnGap) || 40),
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) { onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return; }
      setSaving(true);
      fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(async (response) => { if (!response.ok) throw new Error((await response.json())?.error || "Failed to save"); })
        .then(() => { message.success("Blog Details saved"); onSuccess?.(); })
        .catch((error) => message.error(error?.message || "Failed to save"))
        .finally(() => setSaving(false));
    });
  }, [form, isPageBlock, onSaveToPage, onSuccess]);
  useImperativeHandle(ref, () => ({ update, saving }), [saving, update]);
  if (loading) return <Spin />;

  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["manage-section", "visibility"]} items={[
        { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={options} /> },
        { key: "labels", label: "Labels", children: <Card size="small" title="Actions & messages">
          <Form.Item name="blogDetailsShareLabel" label="Share button"><Input /></Form.Item>
          <Form.Item name="blogDetailsLoadingLabel" label="Loading message" style={{ marginBottom: 0 }}><Input /></Form.Item>
        </Card> },
        { key: "visibility", label: "Visibility", children: <SwitchSettingsCard items={[
          { name: "blogDetailsShowImage", label: "Show featured image", tooltip: "Display the Blogs module featured image" },
          { name: "blogDetailsShowCategory", label: "Show category", tooltip: "Display the Blogs module category" },
          { name: "blogDetailsShowMeta", label: "Show date and author", tooltip: "Display publish date and author" },
          { name: "blogDetailsShowShare", label: "Show share button", tooltip: "Display social share actions" },
          { name: "blogDetailsShowExcerpt", label: "Show excerpt", tooltip: "Display the Blogs module excerpt" },
          { name: "blogDetailsShowContent", label: "Show content", tooltip: "Display the Blogs module article content" },
          { name: "blogDetailsShowTags", label: "Show tags", tooltip: "Display the Blogs module tags" },
          { name: "blogDetailsShowComments", label: "Show comments", tooltip: "Display comments when globally enabled" },
          { name: "blogDetailsShowSidebar", label: "Show sidebar", tooltip: "Display search, categories, recent posts, comments and archives" },
        ]} /> },
        { key: "colors", label: "Colors", children: <ColorSettingsCard items={COLORS} options={options} /> },
        { key: "layout", label: "Layout", children: <Card size="small" title="Article layout">
          <Form.Item name="blogDetailsImageRadius" label="Image radius (px)"><InputNumber min={0} max={40} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="blogDetailsColumnGap" label="Content/sidebar gap (px)" style={{ marginBottom: 0 }}><InputNumber min={16} max={80} style={{ width: "100%" }} /></Form.Item>
        </Card> },
      ]} />
    </Form>
  );
}

export default forwardRef(BlogDetailsEditForm);
