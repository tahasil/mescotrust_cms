"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/OverlayCards";
const PREFIX = "overlayCards";

const DEFAULT_ITEMS = [
  {
    title: "Mumbai City Unit (Bandra to Colaba)",
    description: "Contact No: +91 9969937812",
    bgImageDesktop: "/images/newspaper-card-bg-1.png",
    bgImageMobile: "",
    bgImage: "/images/newspaper-card-bg-1.png",
  },
  {
    title: "Mumbai Suburban Unit (Santacruz to Borivali)",
    description: "Contact No: +91 9969937814",
    bgImageDesktop: "/images/newspaper-card-bg-2.png",
    bgImageMobile: "",
    bgImage: "/images/newspaper-card-bg-2.png",
  },
  {
    title: "Thane Unit (Thane and Navi Mumbai)",
    description: "Contact No: +91 7718038065",
    bgImageDesktop: "/images/newspaper-card-bg-3.png",
    bgImageMobile: "",
    bgImage: "/images/newspaper-card-bg-3.png",
  },
];

function normalizeItem(it) {
  const desktopImage =
    it?.bgImageDesktop != null
      ? String(it.bgImageDesktop).trim()
      : it?.bgImage != null
        ? String(it.bgImage).trim()
        : "";
  const mobileImage =
    it?.bgImageMobile != null ? String(it.bgImageMobile).trim() : "";
  return {
    title: it?.title != null ? String(it.title).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    bgImageDesktop: desktopImage,
    bgImageMobile: mobileImage,
    bgImage: desktopImage,
  };
}

function OverlayCardsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.overlayCardsItems)
        ? data.overlayCardsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        overlayCardsTitleEnabled: data?.overlayCardsTitleEnabled !== false,
        overlayCardsSubTitleEnabled: data?.overlayCardsSubTitleEnabled !== false,
        overlayCardsSubTitleColorKey: data?.overlayCardsSubTitleColorKey != null ? String(data.overlayCardsSubTitleColorKey).trim() : "",
        overlayCardsHoverColorKey: data?.overlayCardsHoverColorKey != null ? String(data.overlayCardsHoverColorKey).trim() : "",
        overlayCardsItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load Overlay Cards"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.overlayCardsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        overlayCardsTitleEnabled: values.overlayCardsTitleEnabled !== false,
        overlayCardsSubTitleEnabled: values.overlayCardsSubTitleEnabled !== false,
        overlayCardsSubTitleColorKey: values.overlayCardsSubTitleColorKey != null ? String(values.overlayCardsSubTitleColorKey).trim() : "",
        overlayCardsHoverColorKey: values.overlayCardsHoverColorKey != null ? String(values.overlayCardsHoverColorKey).trim() : "",
        overlayCardsItems: items,
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
        .then(() => { message.success("Overlay Cards saved"); onSuccess?.(); })
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("OverlayCards")} />,
          },
          {
            key: "items",
            label: "Manage Cards",
            children: (
              <Form.List name="overlayCardsItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Card"
                    addButtonText="Add card"
                    defaultAddPayload={{
                      title: "",
                      description: "",
                      bgImageDesktop: "",
                      bgImageMobile: "",
                      bgImage: "",
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
                            label="Card Title"
                            rules={[{ required: true, message: "Title is required" }]}
                          >
                            <Input placeholder="e.g. Mumbai City Unit" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "description"]} label="Description">
                            <Input.TextArea rows={2} placeholder="e.g. Contact No: +91 9969937812" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "bgImageDesktop"]} label="Desktop Background Image">
                            <MediaPickerInput
                              placeholder="/images/newspaper-card-bg-1.png"
                              uiVariant="stacked"
                              hintText="Recommended for desktop/tablet"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "bgImageMobile"]} label="Mobile Background Image">
                            <MediaPickerInput
                              placeholder="/images/newspaper-card-bg-1-mobile.png"
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

export default forwardRef(OverlayCardsEditForm);
