"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  message,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/InnerPageHero";
const PREFIX = "innerPageHero";
const FALLBACK_THEME_COLOR_KEYS = [
  "primary", "secondary", "white", "black", "headingColor",
  "paragraphColor", "linkColor", "mutedTextColor", "borderColor", "gradient",
];

function normalizeItem(it) {
  return {
    label: it?.label != null ? String(it.label).trim() : "",
    href: it?.href != null ? String(it.href).trim() : "",
  };
}

/**
 * Edit form for InnerPageHero. Editable fields:
 * title, description, colors, and breadcrumb items.
 */
function InnerPageHeroEditForm(
  { source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] },
  ref
) {
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
      const items = Array.isArray(data?.breadcrumbItems)
        ? data.breadcrumbItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        title: data?.title != null ? String(data.title).trim() : "Page Title",
        description: data?.description != null ? String(data.description).trim() : "",
        titleColorKey:
          data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        innerPageHeroAccentColorKey:
          data?.innerPageHeroAccentColorKey != null
            ? String(data.innerPageHeroAccentColorKey).trim()
            : "Primary Soft",
        innerPageHeroGlowColorKey:
          data?.innerPageHeroGlowColorKey != null
            ? String(data.innerPageHeroGlowColorKey).trim()
            : "Primary",
        innerPageHeroDescriptionColorKey:
          data?.innerPageHeroDescriptionColorKey != null
            ? String(data.innerPageHeroDescriptionColorKey).trim()
            : "",
        innerPageHeroBreadcrumbColor1Key:
          data?.innerPageHeroBreadcrumbColor1Key != null
            ? String(data.innerPageHeroBreadcrumbColor1Key).trim()
            : data?.innerPageHeroBreadcrumbColorKey != null
              ? String(data.innerPageHeroBreadcrumbColorKey).trim()
              : "",
        innerPageHeroBreadcrumbColor2Key:
          data?.innerPageHeroBreadcrumbColor2Key != null
            ? String(data.innerPageHeroBreadcrumbColor2Key).trim()
            : data?.innerPageHeroBreadcrumbColorKey != null
              ? String(data.innerPageHeroBreadcrumbColorKey).trim()
              : "",
        bgImageDesktop:
          data?.bgImageDesktop != null
            ? String(data.bgImageDesktop).trim()
            : data?.bgImage != null
              ? String(data.bgImage).trim()
              : "",
        bgImageMobile:
          data?.bgImageMobile != null ? String(data.bgImageMobile).trim() : "",
        bgImage:
          data?.bgImageDesktop != null
            ? String(data.bgImageDesktop).trim()
            : data?.bgImage != null
              ? String(data.bgImage).trim()
              : "",
        breadcrumbItems:
          items.length > 0 ? items : [{ label: "Home", href: "/" }, { label: "Page Title", href: "" }],
      });
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([...Object.keys(palette), ...customColors.map((c) => c?.name).filter(Boolean)]),
      ].sort();
      const keys = names.length > 0 ? names : FALLBACK_THEME_COLOR_KEYS;
      setThemeColorOptions(keys.map((name) => ({ label: name, value: name })));
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
      .catch(() => message.error("Failed to load Inner Page Hero"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.breadcrumbItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        title: values.title != null ? String(values.title).trim() : "Page Title",
        description: values.description != null ? String(values.description).trim() : "",
        titleColorKey:
          values.titleColorKey != null
            ? String(values.titleColorKey).trim()
            : "",
        innerPageHeroAccentColorKey:
          values.innerPageHeroAccentColorKey != null
            ? String(values.innerPageHeroAccentColorKey).trim()
            : "",
        innerPageHeroGlowColorKey:
          values.innerPageHeroGlowColorKey != null
            ? String(values.innerPageHeroGlowColorKey).trim()
            : "",
        innerPageHeroDescriptionColorKey:
          values.innerPageHeroDescriptionColorKey != null
            ? String(values.innerPageHeroDescriptionColorKey).trim()
            : "",
        innerPageHeroBreadcrumbColor1Key:
          values.innerPageHeroBreadcrumbColor1Key != null
            ? String(values.innerPageHeroBreadcrumbColor1Key).trim()
            : "",
        innerPageHeroBreadcrumbColor2Key:
          values.innerPageHeroBreadcrumbColor2Key != null
            ? String(values.innerPageHeroBreadcrumbColor2Key).trim()
            : "",
        // Backward compatibility for older renderer/configs.
        innerPageHeroBreadcrumbColorKey:
          values.innerPageHeroBreadcrumbColor1Key != null
            ? String(values.innerPageHeroBreadcrumbColor1Key).trim()
            : "",
        bgImageDesktop:
          values.bgImageDesktop != null
            ? String(values.bgImageDesktop).trim()
            : values.bgImage != null
              ? String(values.bgImage).trim()
              : "",
        bgImageMobile:
          values.bgImageMobile != null ? String(values.bgImageMobile).trim() : "",
        bgImage:
          values.bgImageDesktop != null
            ? String(values.bgImageDesktop).trim()
            : values.bgImage != null
              ? String(values.bgImage).trim()
              : "",
        breadcrumbItems: items,
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
          message.success("Inner Page Hero saved");
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
        defaultActiveKey={["content"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={themeColorOptions}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="title"
                    label="Title"
                    rules={[{ required: true, message: "Title is required" }]}
                  >
                    <Input placeholder="e.g. MESCO At Glance" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="Short description text" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "title-colors",
            label: "Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={themeColorOptions}
                {...getTitleAndColorsConfig("InnerPageHero")}
              />
            ),
          },
          {
            key: "breadcrumb",
            label: "Breadcrumb",
            children: (
              <Form.List name="breadcrumbItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Crumb"
                    addButtonText="Add breadcrumb"
                    defaultAddPayload={{ label: "", href: "" }}
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
                          <Form.Item
                            {...restField}
                            name={[name, "label"]}
                            label="Label"
                            rules={[{ required: true, message: "Label is required" }]}
                          >
                            <Input placeholder="e.g. Home, About Us" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "href"]}
                            label="Link URL (leave empty for current page)"
                          >
                            <Input placeholder="e.g. / or /about-us" size="large" />
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

export default forwardRef(InnerPageHeroEditForm);
