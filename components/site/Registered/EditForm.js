"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, Row, Col, Collapse, message, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Registered";
const PREFIX = "registered";

function normalizeItem(it) {
  return {
    text: it?.text != null ? String(it.text).trim() : "",
    iconUrl:
      it?.iconUrl != null
        ? String(it.iconUrl).trim()
        : it?.icon != null
          ? String(it.icon).trim()
          : "",
  };
}

/**
 * Edit form for Registered — used in component edit drawer.
 * Title & Colors: main title + title color.
 * Content: repeater list of registration items (text + highlight).
 */
function RegisteredEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
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

  function applyFormValues(data) {
    const rawItems = data?.registeredItems;
    const items =
      Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map(normalizeItem)
        : [normalizeItem({})];
    form.setFieldsValue({
      registeredSubTitle: data?.registeredSubTitle != null ? String(data.registeredSubTitle).trim() : data?.registeredMainTitle != null ? String(data.registeredMainTitle).trim() : "Registered Under",
      registeredHeading: data?.registeredHeading != null ? String(data.registeredHeading).trim() : "Accountable, *by design.*",
      registeredMainTitle: data?.registeredMainTitle != null ? String(data.registeredMainTitle).trim() : "Registered Under",
      registeredSubTitleColorKey: data?.registeredSubTitleColorKey != null ? String(data.registeredSubTitleColorKey).trim() : "",
      registeredHeadingColorKey: data?.registeredHeadingColorKey != null ? String(data.registeredHeadingColorKey).trim() : data?.registeredTitleColorKey != null ? String(data.registeredTitleColorKey).trim() : "",
      registeredTitleColorKey: data?.registeredTitleColorKey != null ? String(data.registeredTitleColorKey).trim() : "",
      registeredCardBgColorKey: data?.registeredCardBgColorKey != null ? String(data.registeredCardBgColorKey).trim() : "",
      registeredCardTextColorKey: data?.registeredCardTextColorKey != null ? String(data.registeredCardTextColorKey).trim() : "",
      registeredIconColorKey: data?.registeredIconColorKey != null ? String(data.registeredIconColorKey).trim() : "",
      registeredItems: items,
      ...getManageSectionInitialValues(PREFIX, data),
    });
  }

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      applyFormValues(data);
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
        applyFormValues(data);
      })
      .catch(() => message.error("Failed to load Registered"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.registeredItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        registeredSubTitle: values.registeredSubTitle != null ? String(values.registeredSubTitle).trim() : "",
        registeredHeading: values.registeredHeading != null ? String(values.registeredHeading).trim() : "",
        registeredMainTitle: values.registeredSubTitle != null ? String(values.registeredSubTitle).trim() : "",
        registeredSubTitleColorKey: values.registeredSubTitleColorKey != null ? String(values.registeredSubTitleColorKey).trim() : "",
        registeredHeadingColorKey: values.registeredHeadingColorKey != null ? String(values.registeredHeadingColorKey).trim() : "",
        registeredTitleColorKey: values.registeredTitleColorKey != null ? String(values.registeredTitleColorKey).trim() : "",
        registeredCardBgColorKey: values.registeredCardBgColorKey != null ? String(values.registeredCardBgColorKey).trim() : "",
        registeredCardTextColorKey: values.registeredCardTextColorKey != null ? String(values.registeredCardTextColorKey).trim() : "",
        registeredIconColorKey: values.registeredIconColorKey != null ? String(values.registeredIconColorKey).trim() : "",
        registeredItems: items,
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
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("Registered saved");
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
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Registered")} />,
          },
          {
            key: "items",
            label: "Manage Items",
            children: (
              <Form.List name="registeredItems">
                  {(fields, { add, remove, move }) => (
                    <SortableFormList
                      fields={fields}
                      add={add}
                      remove={remove}
                      move={move}
                      itemLabel="Item"
                      addButtonText="Add registration"
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
                            <Form.Item
                              {...restField}
                              name={[name, "iconUrl"]}
                              label="Icon/Image"
                            >
                              <MediaPickerInput
                                mediaType="image"
                                uiVariant="stacked"
                                allowManual={false}
                                placeholder="Select an icon or image"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "text"]}
                              label="Text"
                              rules={[{ required: true, message: "Text is required" }]}
                            >
                              <Input placeholder="e.g. The Societies Registration Act, *1860.*" size="large" />
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

export default forwardRef(RegisteredEditForm);
