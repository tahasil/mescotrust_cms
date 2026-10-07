"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin, Select } from "antd";
import {
  PDF_LINK_TARGET_OPTIONS,
  normalizePdfTarget,
} from "@/components/site/shared/PdfViewerModal";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Reports";
const PREFIX = "reports";
const REPORTS_COLOR_FIELDS = [
  "titleColorKey",
  "reportsSubTitleColorKey",
  "reportsCardBgColorKey",
  "reportsCardBorderColorKey",
  "reportsCardShadowColorKey",
  "reportsNameColorKey",
  "reportsDescriptionColorKey",
  "reportsDateColorKey",
  "reportsButtonBgColorKey",
  "reportsButtonTextColorKey",
  "reportsButtonBorderColorKey",
  "reportsButtonHoverBgColorKey",
  "reportsButtonHoverTextColorKey",
  "reportsButtonHoverBorderColorKey",
  "reportsOverlayColorKey",
  "reportsOverlayTextColorKey",
];

const DEFAULT_ITEMS = [
  {
    name: "57th Annual Report 2024-25",
    tag: "Annual Report",
    image: "/images/media-1.png",
    pdfUrl: "",
  },
  {
    name: "56th Annual Report 2024-25",
    tag: "Annual Report",
    image: "/images/media-2.png",
    pdfUrl: "",
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
    tag: it?.tag != null ? String(it.tag).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    pdfUrl: it?.pdfUrl != null ? String(it.pdfUrl).trim() : "",
    target: normalizePdfTarget(it?.target, "_blank"),
  };
}

function ReportsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.reportsItems)
        ? data.reportsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "Reports",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        reportsTitleEnabled: data?.reportsTitleEnabled !== false,
        reportsSubTitleEnabled: data?.reportsSubTitleEnabled !== false,
        reportsImageDisplayMode:
          data?.reportsImageDisplayMode || data?.imageDisplayMode || "compress",
        reportsImageMaxHeight:
          data?.reportsImageMaxHeight != null
            ? String(data.reportsImageMaxHeight).trim()
            : data?.imageMaxHeight != null
              ? String(data.imageMaxHeight).trim()
              : "260px",
        ...Object.fromEntries(
          REPORTS_COLOR_FIELDS.map((key) => [key, String(data?.[key] ?? "").trim()]),
        ),
        reportsItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load Reports"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const watchedDisplayMode = Form.useWatch("reportsImageDisplayMode", form);
  const isFitFullImage = watchedDisplayMode === "fit";

  const handleUpdate = useCallback(() => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.reportsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "Reports",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        reportsTitleEnabled: values.reportsTitleEnabled !== false,
        reportsSubTitleEnabled: values.reportsSubTitleEnabled !== false,
        reportsImageDisplayMode: values.reportsImageDisplayMode || "compress",
        reportsImageMaxHeight:
          values.reportsImageMaxHeight != null
            ? String(values.reportsImageMaxHeight).trim()
            : "",
        ...Object.fromEntries(
          REPORTS_COLOR_FIELDS.map((key) => [key, String(values?.[key] ?? "").trim()]),
        ),
        reportsItems: items,
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
        .then(() => { message.success("Reports saved"); onSuccess?.(); })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  }, [form, isPageBlock, onSaveToPage, onSuccess]);

  useImperativeHandle(ref, () => ({ update: handleUpdate }), [handleUpdate]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spin /></div>;
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["title-colors", "items"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Reports")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <Form.Item
                      name="reportsImageDisplayMode"
                      label="Image Display Mode"
                      initialValue="compress"
                      tooltip="Compress: keeps current display | Fit Full Image: fits entire image preserving original aspect ratio without cropping"
                    >
                      <Select
                        size="large"
                        options={[
                          { label: "Compress", value: "compress" },
                          { label: "Fit Full Image", value: "fit" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  {isFitFullImage && (
                    <Col span={24}>
                      <Form.Item
                        name="reportsImageMaxHeight"
                        label="Max height"
                        tooltip="Define maximum height for images in px or % (e.g. 260px, 300px, 100%)"
                      >
                        <Input placeholder="e.g. 260px or 100%" size="large" />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
                <Form.List name="reportsItems">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Report"
                      addButtonText="Add report"
                      defaultAddPayload={{
                        name: "",
                        tag: "",
                        description: "",
                        imageDesktop: "",
                        imageMobile: "",
                        image: "",
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
                              name={[name, "name"]}
                              label="Title"
                              rules={[{ required: true, message: "Title is required" }]}
                            >
                              <Input placeholder="e.g. Annual Report 2023-24" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "description"]} label="Description">
                              <Input.TextArea placeholder="Optional report or album description" rows={3} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "tag"]} label="Date">
                              <Input placeholder="e.g. January 2026" size="large" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "imageDesktop"]}
                              label="Desktop Image"
                            >
                              <MediaPickerInput
                                placeholder="/uploads/report-cover.webp"
                                uiVariant="stacked"
                                cropWidth={isFitFullImage ? null : 348}
                                cropHeight={isFitFullImage ? null : 200}
                                hintText={isFitFullImage ? "" : "Recommended: 348 × 200 px"}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "imageMobile"]} label="Mobile Image">
                              <MediaPickerInput
                                placeholder="/uploads/report-cover-mobile.webp"
                                uiVariant="stacked"
                                hintText="Optional. Desktop image will be used if empty."
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, "pdfUrl"]} label="Document URL">
                              <MediaPickerInput
                                mediaType="document"
                                showVariants={false}
                                uiVariant="stacked"
                                placeholder="/uploads/annual-report-2024.pdf"
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
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ReportsEditForm);
