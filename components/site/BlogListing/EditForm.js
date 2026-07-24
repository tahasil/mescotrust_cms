"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Card, Collapse, Form, Input, InputNumber, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { ColorSettingsCard, SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/BlogListing";
const PREFIX = "blogListing";

export const BLOG_LISTING_DEFAULTS = {
  blogListingEmptyLabel: "No posts found.",
  blogListingLoadingLabel: "Loading posts...",
  blogListingPreviousLabel: "Previous",
  blogListingNextLabel: "Next",
  blogListingCommentLabel: "Leave a Comment",
  blogListingShowSidebar: true,
  blogListingShowCommentLink: true,
  blogListingShowCategories: true,
  blogListingShowExcerpt: true,
  blogListingPageSize: 6,
  blogListingCardRadius: 12,
  blogListingColumnGap: 40,
  blogListingTextColorKey: "",
  blogListingTitleColorKey: "",
  blogListingMutedColorKey: "",
  blogListingMetaColorKey: "",
  blogListingAccentColorKey: "",
  blogListingSearchButtonColorKey: "",
  blogListingSidebarLinkColorKey: "",
  blogListingCardBgColorKey: "",
  blogListingSurfaceColorKey: "",
  blogListingBorderColorKey: "",
};

const COLORS = [
  { name: "blogListingTextColorKey", label: "Text", tooltip: "Default listing text" },
  { name: "blogListingTitleColorKey", label: "Blog titles", tooltip: "Blog card title text" },
  { name: "blogListingMutedColorKey", label: "Descriptions", tooltip: "Blog excerpts and empty state" },
  { name: "blogListingMetaColorKey", label: "Date & comments", tooltip: "Card metadata text" },
  { name: "blogListingAccentColorKey", label: "Accent", tooltip: "Categories, card link hovers and error text" },
  { name: "blogListingSearchButtonColorKey", label: "Search button", tooltip: "Sidebar search button background" },
  { name: "blogListingSidebarLinkColorKey", label: "Sidebar links", tooltip: "Categories, recent posts, comments and clear-search links" },
  { name: "blogListingCardBgColorKey", label: "Card background", tooltip: "Blog card background" },
  { name: "blogListingSurfaceColorKey", label: "Image placeholder", tooltip: "Image placeholder surface" },
  { name: "blogListingBorderColorKey", label: "Borders", tooltip: "Card and metadata borders" },
];

function themeOptions(theme) {
  const names = [
    ...Object.keys(theme?.themePalette || {}),
    ...(Array.isArray(theme?.colors) ? theme.colors.map((item) => item?.name).filter(Boolean) : []),
  ];
  return [...new Set(names)].sort((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name }));
}

function BlogListingEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, themeColorOptions: providedOptions = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState(providedOptions);
  const fetchedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => { if (providedOptions.length) setOptions(providedOptions); }, [providedOptions]);

  useEffect(() => {
    const apply = (data = {}) => form.setFieldsValue({
      ...BLOG_LISTING_DEFAULTS,
      ...data,
      blogListingShowSidebar: data.blogListingShowSidebar !== false,
      blogListingShowCommentLink: data.blogListingShowCommentLink !== false,
      blogListingShowCategories: data.blogListingShowCategories !== false,
      blogListingShowExcerpt: data.blogListingShowExcerpt !== false,
      ...getManageSectionInitialValues(PREFIX, data),
    });
    setLoading(true);
    if (isPageBlock) {
      apply(initialDataProp || {});
      if (!fetchedRef.current && !providedOptions.length) {
        fetchedRef.current = true;
        fetch("/api/theme", { cache: "no-store" })
          .then((response) => response.ok ? response.json() : {})
          .then((theme) => setOptions(themeOptions(theme)))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else setLoading(false);
      return;
    }
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
      fetch("/api/theme", { cache: "no-store" }).then((response) => response.ok ? response.json() : {}),
    ])
      .then(([data, theme]) => { apply(data); setOptions(themeOptions(theme)); })
      .catch(() => message.error("Failed to load Blog Listing settings"))
      .finally(() => setLoading(false));
  }, [form, initialDataProp, isPageBlock, providedOptions.length]);

  const update = useCallback(() => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...BLOG_LISTING_DEFAULTS,
        ...values,
        blogListingPageSize: Math.max(1, Number(values.blogListingPageSize) || 6),
        blogListingCardRadius: Math.max(0, Number(values.blogListingCardRadius) || 0),
        blogListingColumnGap: Math.max(16, Number(values.blogListingColumnGap) || 40),
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload); message.success("Changes will be saved with the page"); onSuccess?.(); return;
      }
      setSaving(true);
      fetch(API_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(async (response) => { if (!response.ok) throw new Error((await response.json())?.error || "Failed to save"); })
        .then(() => { message.success("Blog Listing saved"); onSuccess?.(); })
        .catch((error) => message.error(error?.message || "Failed to save"))
        .finally(() => setSaving(false));
    });
  }, [form, isPageBlock, onSaveToPage, onSuccess]);

  useImperativeHandle(ref, () => ({ update, saving }), [saving, update]);
  if (loading) return <Spin />;

  const field = (name, label) => <Form.Item name={name} label={label}><Input /></Form.Item>;
  return (
    <Form form={form} layout="vertical">
      <Collapse defaultActiveKey={["manage-section", "labels"]} items={[
        { key: "manage-section", label: "Manage Section", children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={options} /> },
        { key: "labels", label: "Labels", children: <Card size="small" title="Messages & navigation">
          {field("blogListingLoadingLabel", "Loading message")}
          {field("blogListingEmptyLabel", "Empty message")}
          {field("blogListingCommentLabel", "Comment link")}
          {field("blogListingPreviousLabel", "Previous button")}
          {field("blogListingNextLabel", "Next button")}
        </Card> },
        { key: "visibility", label: "Visibility", children: <SwitchSettingsCard items={[
          { name: "blogListingShowSidebar", label: "Show sidebar", tooltip: "Show search, categories, recent posts, comments and archives" },
          { name: "blogListingShowCommentLink", label: "Show comment links", tooltip: "Display Leave a Comment on blog cards" },
          { name: "blogListingShowCategories", label: "Show categories", tooltip: "Display category labels on blog cards" },
          { name: "blogListingShowExcerpt", label: "Show excerpts", tooltip: "Display blog excerpts on cards" },
        ]} /> },
        { key: "colors", label: "Colors", children: <ColorSettingsCard items={COLORS} options={options} /> },
        { key: "layout", label: "Layout", children: <Card size="small" title="Cards & pagination">
          <Form.Item name="blogListingPageSize" label="Posts per page"><InputNumber min={1} max={50} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="blogListingCardRadius" label="Card radius (px)"><InputNumber min={0} max={40} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="blogListingColumnGap" label="Content/sidebar gap (px)" style={{ marginBottom: 0 }}><InputNumber min={16} max={80} style={{ width: "100%" }} /></Form.Item>
        </Card> },
      ]} />
    </Form>
  );
}

export default forwardRef(BlogListingEditForm);
