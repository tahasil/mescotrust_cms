"use client";

import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, Row, Col, Collapse, Select, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import SortableFormList from "@/components/admin/SortableFormList";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Videogallery";
const PREFIX = "videogallery";

function normalizeItem(it) {
  const cats = Array.isArray(it?.categories) ? it.categories : (it?.category ? [String(it.category).trim()] : []);
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    videoId: it?.videoId != null ? String(it.videoId).trim() : "",
    categories: cats.filter((c) => c !== "All"),
  };
}

function applyFormValues(form, data) {
  const items = Array.isArray(data?.videogalleryItems) && data.videogalleryItems.length > 0
    ? data.videogalleryItems.map(normalizeItem)
    : [normalizeItem({})];
  const tabs = Array.isArray(data?.videogalleryTabs) && data.videogalleryTabs.length > 0
    ? data.videogalleryTabs
    : ["All", "Education", "Medical", "Events", "Community"];
  form.setFieldsValue({
    videogallerySubTitle: data?.videogallerySubTitle ?? "",
    videogalleryMainTitle: data?.videogalleryMainTitle ?? "",
    videogallerySubTitleColorKey: data?.videogallerySubTitleColorKey ?? "",
    videogalleryTitleColorKey: data?.videogalleryTitleColorKey ?? "",
    videogalleryAccentColorKey: data?.videogalleryAccentColorKey ?? "",
    videogalleryTabBgColorKey: data?.videogalleryTabBgColorKey ?? "",
    videogalleryTabTextColorKey: data?.videogalleryTabTextColorKey ?? "",
    videogalleryTabBorderColorKey: data?.videogalleryTabBorderColorKey ?? "",
    videogalleryTabInactiveTextColorKey: data?.videogalleryTabInactiveTextColorKey ?? "",
    videogalleryTabHoverBorderColorKey: data?.videogalleryTabHoverBorderColorKey ?? "",
    videogalleryTabHoverTextColorKey: data?.videogalleryTabHoverTextColorKey ?? "",
    videogalleryTabAlignment: ["left", "center", "right"].includes(data?.videogalleryTabAlignment)
      ? data.videogalleryTabAlignment
      : "center",
    videogalleryLimitEnabled: data?.videogalleryLimitEnabled ?? false,
    videogalleryLimitCount: data?.videogalleryLimitCount ?? 6,
    videogalleryViewMoreText: data?.videogalleryViewMoreText ?? "View More",
    videogalleryViewMoreLink: data?.videogalleryViewMoreLink ?? "",
    videogalleryTabs: tabs,
    videogalleryItems: items,
    ...getManageSectionInitialValues(PREFIX, data),
  });
}

function VideogalleryEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";
  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);
  const watchedTabs = Form.useWatch("videogalleryTabs", form);
  const watchedVideos = Form.useWatch("videogalleryItems", form);
  const categoryOptions = useMemo(() => {
    const rawTabs =
      Array.isArray(watchedTabs) && watchedTabs.length > 0
        ? watchedTabs
        : Array.isArray(initialDataProp?.videogalleryTabs) && initialDataProp.videogalleryTabs.length > 0
          ? initialDataProp.videogalleryTabs
          : ["Education", "Medical", "Events", "Community"];
    return rawTabs
      .map((t) => (typeof t === "string" ? t.trim() : (t?.label || "")))
      .filter((t) => t && t !== "All")
      .map((t) => ({ label: t, value: t }));
  }, [watchedTabs, initialDataProp]);

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  const initialAppliedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      if (!initialAppliedRef.current) {
        initialAppliedRef.current = true;
        applyFormValues(form, initialDataProp ?? {});
      }
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
        const palette = theme?.themePalette || {};
        const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
        applyFormValues(form, data);
      })
      .catch(() => message.error("Failed to load Video Gallery"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        videogallerySubTitle: values.videogallerySubTitle ?? "",
        videogalleryMainTitle: values.videogalleryMainTitle ?? "",
        videogallerySubTitleColorKey: values.videogallerySubTitleColorKey ?? "",
        videogalleryTitleColorKey: values.videogalleryTitleColorKey ?? "",
        videogalleryAccentColorKey: values.videogalleryAccentColorKey ?? "",
        videogalleryTabBgColorKey: values.videogalleryTabBgColorKey ?? "",
        videogalleryTabTextColorKey: values.videogalleryTabTextColorKey ?? "",
        videogalleryTabBorderColorKey: values.videogalleryTabBorderColorKey ?? "",
        videogalleryTabInactiveTextColorKey: values.videogalleryTabInactiveTextColorKey ?? "",
        videogalleryTabHoverBorderColorKey: values.videogalleryTabHoverBorderColorKey ?? "",
        videogalleryTabHoverTextColorKey: values.videogalleryTabHoverTextColorKey ?? "",
        videogalleryTabAlignment: ["left", "center", "right"].includes(values.videogalleryTabAlignment)
          ? values.videogalleryTabAlignment
          : "center",
        videogalleryLimitEnabled: values.videogalleryLimitEnabled ?? false,
        videogalleryLimitCount: values.videogalleryLimitCount ?? 6,
        videogalleryViewMoreText: values.videogalleryViewMoreText ?? "View More",
        videogalleryViewMoreLink: values.videogalleryViewMoreLink ?? "",
        videogalleryTabs: values.videogalleryTabs || [],
        videogalleryItems: (values.videogalleryItems || []).map(normalizeItem),
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
        .then((res) => { if (!res.ok) return res.json().then((d) => Promise.reject(d)); })
        .then(() => { message.success("Video Gallery saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form preserve={true} form={form} layout="vertical">
      <Collapse
        destroyInactivePanel={false}
        defaultActiveKey={[]}
        items={[
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Videogallery")} />,
          },
          {
            key: "view-more",
            label: "View More Button",
            children: (
              <>
                <SwitchSettingsCard items={[{ name: "videogalleryLimitEnabled", label: "Enable item limit", tooltip: "Limit visible items and show the View More button." }]} />
                <Form.Item noStyle dependencies={["videogalleryLimitEnabled"]}>
                  {() => form.getFieldValue("videogalleryLimitEnabled") && (
                    <>
                      <Form.Item name="videogalleryLimitCount" label="Items to show">
                        <InputNumber min={1} max={100} size="large" style={{ width: "100%" }} />
                      </Form.Item>
                      <Form.Item name="videogalleryViewMoreText" label="Button text">
                        <Input placeholder="View More" size="large" />
                      </Form.Item>
                      <Form.Item name="videogalleryViewMoreLink" label="Button link" rules={[{ required: true, message: "Link is required when limit is enabled" }]}>
                        <Input placeholder="/media/video-gallery" size="large" />
                      </Form.Item>
                    </>
                  )}
                </Form.Item>
              </>
            ),
          },
          {
            key: "tabs",
            label: "Manage Tabs",
            children: (
              <>
                <Form.Item name="videogalleryTabAlignment" label="Tab alignment">
                  <Select
                    size="large"
                    options={[
                      { label: "Left", value: "left" },
                      { label: "Center", value: "center" },
                      { label: "Right", value: "right" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="videogalleryTabs" label="Category Tabs">
                  <Select
                    mode="tags"
                    placeholder="Type tab name and press Enter"
                    size="large"
                    tokenSeparators={[","]}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: "items",
            label: "Manage Videos",
            children: (
              <Form.List name="videogalleryItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Video"
                    resolveItemTitle={(name) => watchedVideos?.[name]?.title?.trim() || `Video ${name + 1}`}
                    addButtonText="Add video"
                    defaultAddPayload={normalizeItem({})}
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
                          <Form.Item {...restField} name={[name, "videoId"]} label="YouTube Video ID" rules={[{ required: true, message: "Video ID is required" }]}>
                            <Input placeholder="e.g. Mny8ziStg4w" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "title"]} label="Title">
                            <Input placeholder="Video title" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "categories"]} label="Categories">
                            <Select mode="multiple" placeholder="Select categories" size="large" options={categoryOptions} />
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

export default forwardRef(VideogalleryEditForm);
