"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";
import {
  REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT,
  REPORTS_DESKTOP_REQUIRED_TEXT,
  isAllowedReportsDesktopSize,
} from "@/lib/reportsImageConfig";

const API_PATH = "/api/theme/Reports";
const PREFIX = "reports";

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
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    pdfUrl: it?.pdfUrl != null ? String(it.pdfUrl).trim() : "",
  };
}

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

function buildDesktopImageValidationError(width, height, reportLabel) {
  const selectedWidth = Number(width) || 0;
  const selectedHeight = Number(height) || 0;
  const prefix = reportLabel ? `${reportLabel}: ` : "";
  return `${prefix}Supports Only ${REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${selectedWidth}X${selectedHeight} px.`;
}

function createDesktopImageValidator(reportIndex) {
  return async (_, value) => {
    const imageUrl = String(value || "").trim();
    if (!imageUrl) return Promise.resolve();

    const reportLabel = Number.isInteger(Number(reportIndex))
      ? `Report #${Number(reportIndex) + 1}`
      : "";

    try {
      const { width, height } = await getImageDimensions(imageUrl);
      if (isAllowedReportsDesktopSize(width, height)) {
        return Promise.resolve();
      }
      return Promise.reject(
        new Error(buildDesktopImageValidationError(width, height, reportLabel)),
      );
    } catch {
      return Promise.reject(
        new Error(
          `${reportLabel ? `${reportLabel}: ` : ""}Unable to validate desktop image size. Supports Only ${REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
        ),
      );
    }
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
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        reportsTitleEnabled: data?.reportsTitleEnabled !== false,
        reportsSubTitleEnabled: data?.reportsSubTitleEnabled !== false,
        reportsSubTitleColorKey: data?.reportsSubTitleColorKey != null ? String(data.reportsSubTitleColorKey).trim() : "",
        reportsNameColorKey: data?.reportsNameColorKey != null ? String(data.reportsNameColorKey).trim() : "",
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

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.reportsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "Reports",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        reportsTitleEnabled: values.reportsTitleEnabled !== false,
        reportsSubTitleEnabled: values.reportsSubTitleEnabled !== false,
        reportsSubTitleColorKey: values.reportsSubTitleColorKey != null ? String(values.reportsSubTitleColorKey).trim() : "",
        reportsNameColorKey: values.reportsNameColorKey != null ? String(values.reportsNameColorKey).trim() : "",
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
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Reports")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
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
                      imageDesktop: "",
                      imageMobile: "",
                      image: "",
                      pdfUrl: "",
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
                          <Form.Item {...restField} name={[name, "tag"]} label="Tag">
                            <Input placeholder="e.g. Annual Report" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageDesktop"]}
                            label="Desktop Image"
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[{ validator: createDesktopImageValidator(name) }]}
                          >
                            <MediaPickerInput
                              placeholder="/uploads/report-cover.webp"
                              uiVariant="stacked"
                              hintText={`Required size: ${REPORTS_DESKTOP_REQUIRED_TEXT}`}
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
                          <Form.Item {...restField} name={[name, "pdfUrl"]} label="PDF URL (opens in new tab)">
                            <Input placeholder="/uploads/annual-report-2024.pdf" size="large" />
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

export default forwardRef(ReportsEditForm);
