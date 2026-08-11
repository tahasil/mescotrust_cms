"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Select, Spin } from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  PDF_LINK_TARGET_OPTIONS,
  normalizePdfTarget,
} from "@/components/site/shared/PdfViewerModal";

const API_PATH = "/api/theme/Newsletters";
const PREFIX = "newsletters";

const DEFAULT_ITEMS = [
  { title: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.", date: "January 2023", tag: "Newsletter", pdfUrl: "" },
  { title: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.", date: "January 2023", tag: "Newsletter", pdfUrl: "" },
  { title: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.", date: "January 2023", tag: "Newsletter", pdfUrl: "" },
];

function normalizeItem(it) {
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    tag: it?.tag != null ? String(it.tag).trim() : "",
    pdfUrl: it?.pdfUrl != null ? String(it.pdfUrl).trim() : "",
    target: normalizePdfTarget(it?.target, "_blank"),
  };
}

function NewslettersEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.newslettersItems)
        ? data.newslettersItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        newslettersTitleEnabled: data?.newslettersTitleEnabled !== false,
        newslettersSubTitleEnabled: data?.newslettersSubTitleEnabled !== false,
        newslettersSubTitleColorKey: data?.newslettersSubTitleColorKey != null ? String(data.newslettersSubTitleColorKey).trim() : "",
        newslettersCardBgColorKey: data?.newslettersCardBgColorKey != null ? String(data.newslettersCardBgColorKey).trim() : "",
        newslettersIconColorKey: data?.newslettersIconColorKey != null ? String(data.newslettersIconColorKey).trim() : "",
        newslettersIconBgColorKey: data?.newslettersIconBgColorKey != null ? String(data.newslettersIconBgColorKey).trim() : "",
        newslettersViewColorKey: data?.newslettersViewColorKey != null ? String(data.newslettersViewColorKey).trim() : "",
        newslettersViewBgColorKey: data?.newslettersViewBgColorKey != null ? String(data.newslettersViewBgColorKey).trim() : "",
        newslettersTitleItemColorKey: data?.newslettersTitleItemColorKey != null ? String(data.newslettersTitleItemColorKey).trim() : "",
        newslettersDateColorKey: data?.newslettersDateColorKey != null ? String(data.newslettersDateColorKey).trim() : "",
        newslettersItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load Newsletters"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.newslettersItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        newslettersTitleEnabled: values.newslettersTitleEnabled !== false,
        newslettersSubTitleEnabled: values.newslettersSubTitleEnabled !== false,
        newslettersSubTitleColorKey: values.newslettersSubTitleColorKey != null ? String(values.newslettersSubTitleColorKey).trim() : "",
        newslettersCardBgColorKey: values.newslettersCardBgColorKey != null ? String(values.newslettersCardBgColorKey).trim() : "",
        newslettersIconColorKey: values.newslettersIconColorKey != null ? String(values.newslettersIconColorKey).trim() : "",
        newslettersIconBgColorKey: values.newslettersIconBgColorKey != null ? String(values.newslettersIconBgColorKey).trim() : "",
        newslettersViewColorKey: values.newslettersViewColorKey != null ? String(values.newslettersViewColorKey).trim() : "",
        newslettersViewBgColorKey: values.newslettersViewBgColorKey != null ? String(values.newslettersViewBgColorKey).trim() : "",
        newslettersTitleItemColorKey: values.newslettersTitleItemColorKey != null ? String(values.newslettersTitleItemColorKey).trim() : "",
        newslettersDateColorKey: values.newslettersDateColorKey != null ? String(values.newslettersDateColorKey).trim() : "",
        newslettersItems: items,
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
        .then(() => { message.success("Newsletters saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }));

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Newsletters")} />,
          },
          {
            key: "items",
            label: "Manage Newsletters",
            children: (
              <Form.List name="newslettersItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Newsletter"
                    addButtonText="Add newsletter"
                    defaultAddPayload={{
                      title: "",
                      date: "",
                      tag: "Newsletter",
                      pdfUrl: "",
                      target: "_blank",
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
                            name={[name, "title"]}
                            label="Title"
                            rules={[{ required: true, message: "Title is required" }]}
                          >
                            <Input placeholder="Newsletter title" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "date"]} label="Date">
                            <Input placeholder="e.g. January 2023" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, "tag"]} label="Tag">
                            <Input placeholder="e.g. Newsletter" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "pdfUrl"]} label="PDF URL">
                            <MediaPickerInput
                              mediaType="document"
                              showVariants={false}
                              uiVariant="stacked"
                              placeholder="/uploads/newsletter-jan-2023.pdf"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "target"]} label="Target">
                            <Select options={PDF_LINK_TARGET_OPTIONS} />
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

export default forwardRef(NewslettersEditForm);
