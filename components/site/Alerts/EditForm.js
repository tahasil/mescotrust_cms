"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Alerts";
const PREFIX = "alerts";

const DEFAULT_ITEMS = [
  { year: "2016", heading: "Certificate of Merit — The World CSR Day", text: "Awarded by the Jury of The World CSR Day on 18th February 2016." },
  { year: "2015", heading: "BSE Sammaan Empanelment", text: "Empanelled on the BSE SAMMAAN Project in collaboration with the Confederation of Indian Industry (CII), the Bombay Stock Exchange (BSE) and The Indian Institute of Corporate Affairs (IICA), launched by the Hon'ble President of India on 29th April 2015." },
  { year: "", heading: "Guide Star Gold Transparency Award", text: "Awarded by GuideStar India for exemplary transparency in reporting and governance." },
];

function normalizeItem(it) {
  return {
    year: it?.year != null ? String(it.year).trim() : "",
    heading: it?.heading != null ? String(it.heading).trim() : "",
    text: it?.text != null ? String(it.text).trim() : "",
    iconUrl: it?.iconUrl != null ? String(it.iconUrl).trim() : "",
  };
}

function AlertsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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
      const items = Array.isArray(data?.alertsItems)
        ? data.alertsItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle: data?.mainTitle != null ? String(data.mainTitle).trim() : "",
        subTitle: data?.subTitle != null ? String(data.subTitle).trim() : "",
        titleColorKey: data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        alertsTitleEnabled: data?.alertsTitleEnabled !== false,
        alertsSubTitleEnabled: data?.alertsSubTitleEnabled !== false,
        alertsSubTitleColorKey: data?.alertsSubTitleColorKey != null ? String(data.alertsSubTitleColorKey).trim() : "",
        alertsIconColorKey: data?.alertsIconColorKey != null ? String(data.alertsIconColorKey).trim() : "",
        alertsHeadingColorKey: data?.alertsHeadingColorKey != null ? String(data.alertsHeadingColorKey).trim() : "",
        alertsTextColorKey: data?.alertsTextColorKey != null ? String(data.alertsTextColorKey).trim() : "",
        alertsItems: items.length > 0 ? items : DEFAULT_ITEMS.map(normalizeItem),
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
      .catch(() => message.error("Failed to load Alerts"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.alertsItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle: values.mainTitle != null ? String(values.mainTitle).trim() : "",
        subTitle: values.subTitle != null ? String(values.subTitle).trim() : "",
        titleColorKey: values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        alertsTitleEnabled: values.alertsTitleEnabled !== false,
        alertsSubTitleEnabled: values.alertsSubTitleEnabled !== false,
        alertsSubTitleColorKey: values.alertsSubTitleColorKey != null ? String(values.alertsSubTitleColorKey).trim() : "",
        alertsIconColorKey: values.alertsIconColorKey != null ? String(values.alertsIconColorKey).trim() : "",
        alertsHeadingColorKey: values.alertsHeadingColorKey != null ? String(values.alertsHeadingColorKey).trim() : "",
        alertsTextColorKey: values.alertsTextColorKey != null ? String(values.alertsTextColorKey).trim() : "",
        alertsItems: items,
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
        .then(() => { message.success("Alerts saved"); onSuccess?.(); })
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Alerts")} />,
          },
          {
            key: "items",
            label: "Manage Recognition",
            children: (
              <Form.List name="alertsItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Recognition"
                    addButtonText="Add recognition"
                    defaultAddPayload={{ year: "", heading: "", text: "", iconUrl: "" }}
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
                          <Form.Item {...restField} name={[name, "year"]} label="Year (optional)">
                            <Input placeholder="e.g. 2016" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "heading"]} label="Heading (optional)">
                            <Input placeholder="e.g. Achievements" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "text"]}
                            label="Description"
                            rules={[{ required: true, message: "Description is required" }]}
                          >
                            <Input.TextArea rows={3} placeholder="Alert description text" size="large" />
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

export default forwardRef(AlertsEditForm);
