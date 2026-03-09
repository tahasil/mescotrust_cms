"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Form, Input, InputNumber, message, Spin, Collapse, Row, Col } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/OverviewOfOurWork";
const PREFIX = "overviewOfOurWork";

function normalizeItem(it) {
  return {
    title: (it?.title != null ? String(it.title).trim() : "") || "Card",
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    bgImageUrl: it?.bgImageUrl != null ? String(it.bgImageUrl).trim() : "",
    link: it?.link != null ? String(it.link).trim() : it?.url != null ? String(it.url).trim() : "",
    linkText: (it?.linkText != null ? String(it.linkText).trim() : (it?.buttonText != null ? String(it.buttonText).trim() : "")) || "More Details",
    titleColorKey: it?.titleColorKey != null ? String(it.titleColorKey).trim() : it?.cardTitleColorKey != null ? String(it.cardTitleColorKey).trim() : "",
    icon: it?.icon != null ? String(it.icon).trim() : "",
  };
}

/**
 * Edit form for Overview of Our Work (OverviewOfOurWork). All content from DB (components collection or page block props).
 * Manage Section + Title & Colors + Content (cards: add/edit/delete) — same drawer for component edit and Page Builder block edit.
 */
function OverviewOfOurWorkEditForm(
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
  const componentDataLoadedRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    if (themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp, isPageBlock]);

  useEffect(() => {
    setLoading(true);
    const titleColorsConfig = getTitleAndColorsConfig("OverviewOfOurWork");
    const setFormAndColors = (data, theme) => {
      const items = Array.isArray(data?.overviewOfOurWorkItems)
        ? data.overviewOfOurWorkItems.map(normalizeItem)
        : Array.isArray(data?.items)
          ? data.items.map(normalizeItem)
          : [];
      const titleColorValues = {};
      (titleColorsConfig.titleListItems || []).forEach((item) => {
        const v = data?.[item.name];
        titleColorValues[item.name] = v != null ? String(v).trim() : "";
      });
      (titleColorsConfig.colorListItems || []).forEach((item) => {
        const v = data?.[item.name];
        titleColorValues[item.name] = v != null ? String(v).trim() : "";
      });
      const hoverOpacity =
        data?.overviewOfOurWorkHoverOverlayOpacity != null
          ? Math.min(1, Math.max(0, Number(data.overviewOfOurWorkHoverOverlayOpacity)))
          : 0.5;
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        ...titleColorValues,
        overviewOfOurWorkHoverOverlayOpacity: hoverOpacity,
        overviewOfOurWorkItems: items.length > 0 ? items : [normalizeItem({})],
      });
      if (theme) {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
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

    // Only fetch once per mount for component (non-page) path to avoid /api/theme loop
    if (componentDataLoadedRef.current) {
      setLoading(false);
      return;
    }
    componentDataLoadedRef.current = true;
    Promise.all([
      fetch(API_PATH, { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
      fetch("/api/theme", { cache: "no-store" }).then((res) => (res.ok ? res.json() : {})),
    ])
      .then(([data, theme]) => setFormAndColors(data || {}, theme))
      .catch(() => message.error("Failed to load Overview of Our Work"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawItems = values.overviewOfOurWorkItems ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];
      const titleColorsConfig = getTitleAndColorsConfig("OverviewOfOurWork");
      const titleColorPayload = {};
      (titleColorsConfig.titleListItems || []).forEach((item) => {
        const v = values[item.name];
        titleColorPayload[item.name] = v != null ? String(v).trim() : "";
      });
      (titleColorsConfig.colorListItems || []).forEach((item) => {
        const v = values[item.name];
        titleColorPayload[item.name] = v != null ? String(v).trim() : "";
      });
      const opacityVal = values.overviewOfOurWorkHoverOverlayOpacity;
      const hoverOverlayOpacity =
        opacityVal != null ? Math.min(1, Math.max(0, Number(opacityVal))) : 0.5;
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        ...titleColorPayload,
        overviewOfOurWorkHoverOverlayOpacity: hoverOverlayOpacity,
        overviewOfOurWorkItems: items,
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
          message.success("Overview of Our Work saved");
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
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <>
                <TitleAndColorsSection
                  form={form}
                  themeColorOptions={themeColorOptions}
                  {...getTitleAndColorsConfig("OverviewOfOurWork")}
                />
                <Form.Item
                  name="overviewOfOurWorkHoverOverlayOpacity"
                  label="Hover overlay opacity"
                  tooltip="Opacity for card hover overlay (0–1). Default 0.5."
                  style={{ marginTop: 16 }}
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.1}
                    placeholder="0.5"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Form.List name="overviewOfOurWorkItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Item"
                    addButtonText="Add item"
                    defaultAddPayload={normalizeItem({})}
                    reorderMovedIndex={reorderMovedIndex}
                    reorderDirection={reorderDirection}
                    onMoveWithTransition={(from, to) => {
                      setReorderDirection(to < from ? "up" : "down");
                      setReorderMovedIndex(to);
                      setTimeout(() => setReorderMovedIndex(-1), 400);
                    }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={[12, 12]}>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "title"]} label="Card title" rules={[{ required: true, message: "Title required" }]}>
                            <Input placeholder="e.g. Educational Support" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "linkText"]} label="Link text">
                            <Input placeholder="e.g. More Details, Learn More" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "link"]} label="Link URL">
                            <Input placeholder="/page or https://..." />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "bgImageUrl"]} label="Background (Image URL)">
                            <Input placeholder="https://... or /images/..." />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, "icon"]} label="Icon (image URL)">
                            <Input placeholder="/images/icon.svg or https://..." />
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

export default forwardRef(OverviewOfOurWorkEditForm);
