"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/InMedia";
const PREFIX = "inMedia";
const INMEDIA_BUTTON_COLOR_FIELDS = [
  "inMediaButtonBgColorKey",
  "inMediaButtonTextColorKey",
  "inMediaButtonBorderColorKey",
  "inMediaButtonHoverBgColorKey",
  "inMediaButtonHoverTextColorKey",
  "inMediaButtonHoverBorderColorKey",
];

const DEFAULT_ITEMS = [
  {
    name: "Lorem Ipsum has been the industry's standard dummy text",
    date: "14 Apr, 2023",
    image: "/images/media-1.png",
    source: "Inquilab",
  },
  {
    name: "NGO uses zakat fund to educate poor and raise agents of change",
    date: "26 Mar, 2023",
    image: "/images/media-2.png",
    source: "Mumbai Mirror",
  },
  {
    name: "Our Doctors making an impact on society",
    date: "12 Jul, 2022",
    image: "/images/media-3.png",
    source: "Bombay Times",
  },
];

function normalizeItem(it) {
  const desktopImage =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : "";
  const mobileImage =
    it?.imageMobile != null ? String(it.imageMobile).trim() : "";
  return {
    name: it?.name != null ? String(it.name).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    source: it?.source != null ? String(it.source).trim() : "",
  };
}

function InMediaEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.inMediaItems)
        ? data.inMediaItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "In Media",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        inMediaTitleEnabled: data?.inMediaTitleEnabled !== false,
        inMediaSubTitleEnabled: data?.inMediaSubTitleEnabled !== false,
        inMediaSubTitleColorKey: data?.inMediaSubTitleColorKey != null ? String(data.inMediaSubTitleColorKey).trim() : "",
        inMediaNameColorKey: data?.inMediaNameColorKey != null ? String(data.inMediaNameColorKey).trim() : "",
        inMediaDateColorKey: data?.inMediaDateColorKey != null ? String(data.inMediaDateColorKey).trim() : "",
        ...Object.fromEntries(
          INMEDIA_BUTTON_COLOR_FIELDS.map((key) => [key, String(data?.[key] ?? "").trim()]),
        ),
        inMediaItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load In Media"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = useCallback(() => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.inMediaItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "In Media",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        inMediaTitleEnabled: values.inMediaTitleEnabled !== false,
        inMediaSubTitleEnabled: values.inMediaSubTitleEnabled !== false,
        inMediaSubTitleColorKey: values.inMediaSubTitleColorKey != null ? String(values.inMediaSubTitleColorKey).trim() : "",
        inMediaNameColorKey: values.inMediaNameColorKey != null ? String(values.inMediaNameColorKey).trim() : "",
        inMediaDateColorKey: values.inMediaDateColorKey != null ? String(values.inMediaDateColorKey).trim() : "",
        ...Object.fromEntries(
          INMEDIA_BUTTON_COLOR_FIELDS.map((key) => [key, String(values?.[key] ?? "").trim()]),
        ),
        inMediaItems: items,
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
        .then(() => { message.success("In Media saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  }, [form, isPageBlock, onSaveToPage, onSuccess]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

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
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("InMedia")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <Form.List name="inMediaItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Media Item"
                    addButtonText="Add media item"
                    defaultAddPayload={{
                      name: "",
                      date: "",
                      imageDesktop: "",
                      imageMobile: "",
                      image: "",
                      source: "",
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
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            label="Title / Headline"
                            rules={[{ required: true, message: "Title is required" }]}
                          >
                            <Input placeholder="Article headline" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "date"]} label="Date">
                            <Input placeholder="e.g. 14 Apr, 2023" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "source"]} label="Source">
                            <Input placeholder="e.g. Mumbai Mirror" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "imageDesktop"]} label="Desktop Image">
                            <MediaPickerInput
                              placeholder="/uploads/media-1.webp"
                              uiVariant="stacked"
                              hintText="Recommended size: minimum 400 × 400 px."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "imageMobile"]} label="Mobile Image">
                            <MediaPickerInput
                              placeholder="/uploads/media-1-mobile.webp"
                              uiVariant="stacked"
                              hintText="Optional. Desktop image will be used if empty."
                            />
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

export default forwardRef(InMediaEditForm);
