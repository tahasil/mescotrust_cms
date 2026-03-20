"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Form,
  Input,
  Button,
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

const API_PATH = "/api/theme/WelcometoMESCO";
const PREFIX = "welcometoMESCO";

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

function normalizeStatItem(it) {
  return {
    number: it?.number != null ? String(it.number).trim() : "",
    label: it?.label != null ? String(it.label).trim() : "",
    iconImage: it?.iconImage != null ? String(it.iconImage).trim() : "",
  };
}

/**
 * Edit form for WelcometoMESCO. All elements are editable:
 * welcome label, main title, highlight text, descriptions, button, image, and stat items.
 */
function WelcometoMESCOEditForm(
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
      const stats = Array.isArray(data?.welcometoMESCOStats)
        ? data.welcometoMESCOStats.map(normalizeStatItem)
        : [];
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        welcomeLabel:
          data?.welcomeLabel != null ? String(data.welcomeLabel).trim() : "Welcome to MESCO",
        mainTitle:
          data?.mainTitle != null ? String(data.mainTitle).trim() : "Helping people live better tomorrow",
        highlightText:
          data?.highlightText != null ? String(data.highlightText).trim() : "We are the largest crowdfunding",
        description:
          data?.description != null ? String(data.description).trim() : "",
        secondaryText:
          data?.secondaryText != null ? String(data.secondaryText).trim() : "",
        buttonText:
          data?.buttonText != null ? String(data.buttonText).trim() : "Zakat Appeal",
        buttonLink:
          data?.buttonLink != null ? String(data.buttonLink).trim() : "/",
        imageUrl:
          data?.imageUrl != null ? String(data.imageUrl).trim() : "/images/helping.png",
        imageAlt:
          data?.imageAlt != null ? String(data.imageAlt).trim() : "Helping",
        titleColorKey:
          data?.titleColorKey != null ? String(data.titleColorKey).trim() : "",
        welcometoMESCOHighlightColorKey:
          data?.welcometoMESCOHighlightColorKey != null ? String(data.welcometoMESCOHighlightColorKey).trim() : "",
        welcometoMESCOButtonBgColorKey:
          data?.welcometoMESCOButtonBgColorKey != null ? String(data.welcometoMESCOButtonBgColorKey).trim() : "",
        welcometoMESCOButtonTextColorKey:
          data?.welcometoMESCOButtonTextColorKey != null ? String(data.welcometoMESCOButtonTextColorKey).trim() : "",
        welcometoMESCOStats:
          stats.length > 0 ? stats : [normalizeStatItem({}), normalizeStatItem({}), normalizeStatItem({}), normalizeStatItem({})],
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
      .catch(() => message.error("Failed to load Welcome to MESCO"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const rawStats = values.welcometoMESCOStats ?? [];
      const stats = Array.isArray(rawStats) ? rawStats.map(normalizeStatItem) : [];
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        welcomeLabel:
          values.welcomeLabel != null ? String(values.welcomeLabel).trim() : "Welcome to MESCO",
        mainTitle:
          values.mainTitle != null ? String(values.mainTitle).trim() : "Helping people live better tomorrow",
        highlightText:
          values.highlightText != null ? String(values.highlightText).trim() : "We are the largest crowdfunding",
        description:
          values.description != null ? String(values.description).trim() : "",
        secondaryText:
          values.secondaryText != null ? String(values.secondaryText).trim() : "",
        buttonText:
          values.buttonText != null ? String(values.buttonText).trim() : "Zakat Appeal",
        buttonLink:
          values.buttonLink != null ? String(values.buttonLink).trim() : "/",
        imageUrl:
          values.imageUrl != null ? String(values.imageUrl).trim() : "/images/helping.png",
        imageAlt:
          values.imageAlt != null ? String(values.imageAlt).trim() : "Helping",
        titleColorKey:
          values.titleColorKey != null ? String(values.titleColorKey).trim() : "",
        welcometoMESCOHighlightColorKey:
          values.welcometoMESCOHighlightColorKey != null ? String(values.welcometoMESCOHighlightColorKey).trim() : "",
        welcometoMESCOButtonBgColorKey:
          values.welcometoMESCOButtonBgColorKey != null ? String(values.welcometoMESCOButtonBgColorKey).trim() : "",
        welcometoMESCOButtonTextColorKey:
          values.welcometoMESCOButtonTextColorKey != null ? String(values.welcometoMESCOButtonTextColorKey).trim() : "",
        welcometoMESCOStats: stats,
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
          message.success("Welcome to MESCO saved");
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
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("WelcometoMESCO")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="welcomeLabel"
                    label="Welcome Label"
                    rules={[{ required: true, message: "Welcome label is required" }]}
                  >
                    <Input placeholder="e.g. Welcome to MESCO" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="mainTitle"
                    label="Main Title"
                    rules={[{ required: true, message: "Main title is required" }]}
                  >
                    <Input placeholder="e.g. Helping people live better tomorrow" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="highlightText" label="Highlight Text (colored subtitle)">
                    <Input placeholder="e.g. We are the largest crowdfunding" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Main Description">
                    <Input.TextArea rows={6} placeholder="Main paragraph text" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="secondaryText" label="Secondary Text (faded)">
                    <Input.TextArea rows={3} placeholder="Secondary paragraph text (shown at 50% opacity)" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "button",
            label: "Button",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="buttonText" label="Button Text">
                    <Input placeholder="e.g. Zakat Appeal" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="buttonLink" label="Button Link (URL)">
                    <Input placeholder="e.g. /donate" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "image",
            label: "Image",
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="imageUrl" label="Image URL">
                    <Input placeholder="e.g. /images/helping.png" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="imageAlt" label="Image Alt Text">
                    <Input placeholder="e.g. Helping" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "stats",
            label: "Stats Bar",
            children: (
              <Form.List name="welcometoMESCOStats">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Stat"
                    addButtonText="Add stat"
                    defaultAddPayload={{
                      number: "",
                      label: "",
                      iconImage: "",
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
                            name={[name, "number"]}
                            label="Number / Value"
                            rules={[{ required: true, message: "Number is required" }]}
                          >
                            <Input placeholder="e.g. 89052" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "label"]}
                            label="Label"
                            rules={[{ required: true, message: "Label is required" }]}
                          >
                            <Input placeholder="e.g. Educational Scholarships Students" size="large" />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "iconImage"]}
                            label="Icon Image URL"
                          >
                            <Input placeholder="e.g. /images/icon-education.png" size="large" />
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

export default forwardRef(WelcometoMESCOEditForm);
