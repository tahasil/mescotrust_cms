"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Row,
  Col,
  Collapse,
  Select,
  message,
  Spin,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import { SwitchSettingsCard } from "@/components/admin/SettingsCardList";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/Notices";
const PREFIX = "notices";

const FALLBACK_THEME_COLOR_KEYS = [
  "primary",
  "secondary",
  "white",
  "black",
  "headingColor",
  "paragraphColor",
  "linkColor",
  "mutedTextColor",
  "borderColor",
  "gradient",
];

function normalizeItem(it) {
  return {
    indexLabel: it?.indexLabel != null ? String(it.indexLabel).trim() : "",
    label: it?.label != null ? String(it.label).trim() : "",
    subLabel: it?.subLabel != null ? String(it.subLabel).trim() : "",
    link: it?.link != null ? String(it.link).trim() : "",
    target: it?.target === "_blank" ? "_blank" : "_self",
  };
}

/**
 * Edit form for Notices. Editable fields:
 * main title, and a sortable list of notice items (label + link).
 */
function NoticesEditForm(
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
      const items = Array.isArray(data?.noticesItems)
        ? data.noticesItems.map(normalizeItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        mainTitle:
          data?.mainTitle != null ? String(data.mainTitle).trim() : "Important Notices",
        noticesTitleEnabled: data?.noticesTitleEnabled !== false,
        titleColorKey:
          data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        noticesSubTitle: String(data?.noticesSubTitle ?? data?.mainTitle ?? "").trim(),
        noticesHeading: String(data?.noticesHeading ?? "").trim(),
        noticesHeadingAccent: String(data?.noticesHeadingAccent ?? "").trim(),
        noticesDescription: String(data?.noticesDescription ?? "").trim(),
        noticesMoreLabel: String(data?.noticesMoreLabel ?? "").trim(),
        noticesMoreUrl: String(data?.noticesMoreUrl ?? "").trim(),
        noticesMoreTarget: data?.noticesMoreTarget === "_blank" ? "_blank" : "_self",
        noticesRevealEnabled: data?.noticesRevealEnabled !== false,
        noticesRevealStart: String(data?.noticesRevealStart ?? "top 86%").trim(),
        noticesRevealDuration: data?.noticesRevealDuration ?? 0.9,
        noticesRevealStagger: data?.noticesRevealStagger ?? 0.08,
        noticesRevealDistance: data?.noticesRevealDistance ?? 30,
        ...Object.fromEntries(["noticesSubTitleColorKey","noticesHeadingColorKey","noticesAccentColorKey","noticesDescriptionColorKey","noticesBorderColorKey","noticesMetaColorKey","noticesItemTitleColorKey","noticesArrowColorKey","noticesArrowHoverColorKey","noticesLinkColorKey"].map((key)=>[key,String(data?.[key]??"").trim()])),
        noticesItems:
          items.length > 0 ? items : [normalizeItem({}), normalizeItem({}), normalizeItem({})],
      });
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...customColors.map((c) => c?.name).filter(Boolean),
        ]),
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
      .then(([data, theme]) => {
        setFormAndColors(data, theme);
      })
      .catch(() => message.error("Failed to load Notices"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.noticesItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        mainTitle:
          values.mainTitle != null ? String(values.mainTitle).trim() : "Important Notices",
        noticesTitleEnabled: values.noticesTitleEnabled !== false,
        titleColorKey:
          values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        noticesSubTitle: String(values.noticesSubTitle ?? "").trim(),
        noticesHeading: String(values.noticesHeading ?? "").trim(),
        noticesHeadingAccent: String(values.noticesHeadingAccent ?? "").trim(),
        noticesDescription: String(values.noticesDescription ?? "").trim(),
        noticesMoreLabel: String(values.noticesMoreLabel ?? "").trim(),
        noticesMoreUrl: String(values.noticesMoreUrl ?? "").trim(),
        noticesMoreTarget: values.noticesMoreTarget === "_blank" ? "_blank" : "_self",
        noticesRevealEnabled: values.noticesRevealEnabled !== false,
        noticesRevealStart: String(values.noticesRevealStart ?? "").trim(),
        noticesRevealDuration: Number(values.noticesRevealDuration ?? 0.9),
        noticesRevealStagger: Number(values.noticesRevealStagger ?? 0.08),
        noticesRevealDistance: Number(values.noticesRevealDistance ?? 30),
        ...Object.fromEntries(["noticesSubTitleColorKey","noticesHeadingColorKey","noticesAccentColorKey","noticesDescriptionColorKey","noticesBorderColorKey","noticesMetaColorKey","noticesItemTitleColorKey","noticesArrowColorKey","noticesArrowHoverColorKey","noticesLinkColorKey"].map((key)=>[key,String(values?.[key]??"").trim()])),
        noticesItems: items,
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
          message.success("Notices saved");
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
            key: "section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("Notices")} />,
          },
          {
            key: "more-link",
            label: "All Notices Link",
            children: <><Form.Item name="noticesMoreLabel" label="Label"><Input /></Form.Item><Form.Item name="noticesMoreUrl" label="URL"><Input /></Form.Item><Form.Item name="noticesMoreTarget" label="Target"><Select options={[{label:"Same Tab (_self)",value:"_self"},{label:"New Tab (_blank)",value:"_blank"}]} /></Form.Item><SwitchSettingsCard items={[{ name: "noticesRevealEnabled", label: "Reveal on scroll", tooltip: "Animate notices into view while scrolling." }]} /><Form.Item name="noticesRevealStart" label="Reveal trigger"><Input /></Form.Item><Row gutter={16}><Col span={8}><Form.Item name="noticesRevealDuration" label="Duration s"><Input type="number" /></Form.Item></Col><Col span={8}><Form.Item name="noticesRevealStagger" label="Stagger s"><Input type="number" /></Form.Item></Col><Col span={8}><Form.Item name="noticesRevealDistance" label="Distance px"><Input type="number" /></Form.Item></Col></Row></>,
          },
          {
            key: "items",
            label: "Notice Items",
            children: (
              <Form.List name="noticesItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Notice"
                    addButtonText="Add notice"
                    defaultAddPayload={{
                      indexLabel: "",
                      label: "",
                      subLabel: "",
                      link: "",
                      target: "_self",
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
                        <Col span={8}><Form.Item {...restField} name={[name, "indexLabel"]} label="Index"><Input placeholder="01" /></Form.Item></Col>
                        <Col span={16}><Form.Item {...restField} name={[name, "subLabel"]} label="Type / meta"><Input placeholder="PDF download" /></Form.Item></Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "label"]}
                            label="Label"
                            rules={[{ required: true, message: "Label is required" }]}
                          >
                            <Input placeholder="e.g. Form5A PF" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}><Form.Item {...restField} name={[name, "target"]} label="Target"><Select options={[{label:"Same Tab (_self)",value:"_self"},{label:"New Tab (_blank)",value:"_blank"}]} /></Form.Item></Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "link"]}
                            label="PDF Path"
                          >
                            <Input placeholder="e.g. /documents/form5a.pdf" size="large" />
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

export default forwardRef(NoticesEditForm);
