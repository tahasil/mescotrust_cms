"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  Collapse,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
  Switch,
} from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import {
  LINK_TARGET_OPTIONS,
  normalizeTarget,
} from "@/components/appearance/editorUtils";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/OurImpact";
const PREFIX = "ourImpact";

const INITIAL_CONTENT = {
  ourImpactHeading: "Numbers that",
  ourImpactHeadingAccent: "carry names.",
  ourImpactNote: "Cumulative impact since 1968, audited year after year.",
  ourImpactFooterText:
    "Every number here is a person with a name in MESCO's files.",
  ourImpactLinkLabel: "See the audited annual reports",
  ourImpactLinkUrl: "/annual-reports",
  ourImpactLinkTarget: "_self",
  ourImpactNumberLocale: "en-IN",
  ourImpactItems: [
    {
      index: "01",
      number: 89052,
      label: "Educational scholarships awarded to students",
    },
    {
      index: "02",
      number: 12199,
      label: "Patients supported with medical aid",
    },
    {
      index: "03",
      number: 833000,
      label: "Cases treated at clinics & dispensaries",
    },
    {
      index: "04",
      number: 2509,
      label: "Sewing machines given as general aid",
    },
  ],
};

const LAYOUT_DEFAULTS = {
  ourImpactHeadGap: 28,
  ourImpactHeadMarginBottomMin: 44,
  ourImpactHeadMarginBottomFluid: 5,
  ourImpactHeadMarginBottomMax: 72,
  ourImpactHeadingMinSize: 36,
  ourImpactHeadingFluidSize: 4.6,
  ourImpactHeadingMaxSize: 64,
  ourImpactHeadingFontWeight: 620,
  ourImpactHeadingLetterSpacing: -0.02,
  ourImpactHeadingLineHeight: 1.08,
  ourImpactHeadingMaxWidth: 16,
  ourImpactNoteFontSize: 15,
  ourImpactNoteMaxWidth: 30,
  ourImpactCellPaddingMin: 20,
  ourImpactCellPaddingFluid: 2.4,
  ourImpactCellPaddingMax: 44,
  ourImpactIndexFontSize: 12,
  ourImpactIndexFontWeight: 700,
  ourImpactIndexLetterSpacing: 0.2,
  ourImpactNumberMinSize: 42,
  ourImpactNumberFluidSize: 4.8,
  ourImpactNumberMaxSize: 80,
  ourImpactNumberFontWeight: 700,
  ourImpactNumberLetterSpacing: -0.025,
  ourImpactLabelFontSize: 15,
  ourImpactLabelLineHeight: 1.5,
  ourImpactLabelMaxWidth: 21,
  ourImpactFooterMarginTopMin: 44,
  ourImpactFooterMarginTopFluid: 5,
  ourImpactFooterMarginTopMax: 72,
  ourImpactFooterPaddingTop: 26,
  ourImpactFooterFontSize: 14.5,
  ourImpactLinkFontSize: 15,
};

const ANIMATION_DEFAULTS = {
  ourImpactRevealEnabled: true,
  ourImpactRevealStart: "top 86%",
  ourImpactRevealDuration: 0.9,
  ourImpactRevealStagger: 0.09,
  ourImpactRevealDistance: 30,
  ourImpactCountEnabled: true,
  ourImpactCountStart: "top 85%",
  ourImpactCountDuration: 2.4,
  ourImpactCountEase: "power2.out",
};

const COLOR_FIELDS = [
  "ourImpactBandBgColorKey",
  "ourImpactGlowColorKey",
  "ourImpactBaseTextColorKey",
  "ourImpactHeadingColorKey",
  "ourImpactHeadingAccentColorKey",
  "ourImpactNoteColorKey",
  "ourImpactIndexColorKey",
  "ourImpactNumberColorKey",
  "ourImpactLabelColorKey",
  "ourImpactLineColorKey",
  "ourImpactFooterTextColorKey",
  "ourImpactLinkColorKey",
  "ourImpactLinkHoverColorKey",
];

const text = (value) => (value == null ? "" : String(value).trim());

function normalizeItem(item = {}, index = 0) {
  return {
    index: text(item.index) || String(index + 1).padStart(2, "0"),
    number: Number.isFinite(Number(item.number)) ? Number(item.number) : 0,
    label: text(item.label),
  };
}

function getInitialValues(data = {}) {
  const savedItems = Array.isArray(data.ourImpactItems)
    ? data.ourImpactItems.map(normalizeItem)
    : [];
  return {
    ...INITIAL_CONTENT,
    ...LAYOUT_DEFAULTS,
    ...ANIMATION_DEFAULTS,
    ...getManageSectionInitialValues(PREFIX, data),
    ourImpactHeading:
      data.ourImpactHeading != null
        ? text(data.ourImpactHeading)
        : INITIAL_CONTENT.ourImpactHeading,
    ourImpactHeadingAccent:
      data.ourImpactHeadingAccent != null
        ? text(data.ourImpactHeadingAccent)
        : INITIAL_CONTENT.ourImpactHeadingAccent,
    ourImpactNote:
      data.ourImpactNote != null
        ? text(data.ourImpactNote)
        : INITIAL_CONTENT.ourImpactNote,
    ourImpactFooterText:
      data.ourImpactFooterText != null
        ? text(data.ourImpactFooterText)
        : INITIAL_CONTENT.ourImpactFooterText,
    ourImpactLinkLabel:
      data.ourImpactLinkLabel != null
        ? text(data.ourImpactLinkLabel)
        : INITIAL_CONTENT.ourImpactLinkLabel,
    ourImpactLinkUrl:
      data.ourImpactLinkUrl != null
        ? text(data.ourImpactLinkUrl)
        : INITIAL_CONTENT.ourImpactLinkUrl,
    ourImpactLinkTarget: normalizeTarget(data.ourImpactLinkTarget),
    ourImpactNumberLocale:
      data.ourImpactNumberLocale != null
        ? text(data.ourImpactNumberLocale)
        : INITIAL_CONTENT.ourImpactNumberLocale,
    ourImpactItems:
      savedItems.length > 0 ? savedItems : INITIAL_CONTENT.ourImpactItems,
    ...Object.fromEntries(
      Object.entries(LAYOUT_DEFAULTS).map(([key, fallback]) => [
        key,
        data[key] !== undefined ? data[key] : fallback,
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(ANIMATION_DEFAULTS).map(([key, fallback]) => [
        key,
        data[key] !== undefined ? data[key] : fallback,
      ]),
    ),
    ...Object.fromEntries(
      COLOR_FIELDS.map((key) => [key, text(data[key])]),
    ),
  };
}

function OurImpactEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: providedColors = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState(providedColors);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (providedColors.length) setColors(providedColors);
  }, [providedColors]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const data = isPageBlock
        ? initialDataProp || {}
        : await fetch(API_PATH, { cache: "no-store" }).then((response) =>
            response.ok ? response.json() : {},
          );
      const theme = providedColors.length
        ? {}
        : await fetch("/api/theme", { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : {}))
            .catch(() => ({}));
      if (cancelled) return;

      if (!providedColors.length) {
        const names = [
          ...new Set([
            ...Object.keys(theme?.themePalette || {}),
            ...(Array.isArray(theme?.colors)
              ? theme.colors.map((item) => item?.name).filter(Boolean)
              : []),
          ]),
        ].sort();
        setColors(names.map((name) => ({ label: name, value: name })));
      }
      form.setFieldsValue(getInitialValues(data));
    }

    load()
      .catch(() => message.error("Failed to load Our Impact"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [form, initialDataProp, isPageBlock, providedColors.length]);

  const update = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      ...getManageSectionPayload(PREFIX, values),
      ourImpactHeading: text(values.ourImpactHeading),
      ourImpactHeadingAccent: text(values.ourImpactHeadingAccent),
      ourImpactNote: text(values.ourImpactNote),
      ourImpactFooterText: text(values.ourImpactFooterText),
      ourImpactLinkLabel: text(values.ourImpactLinkLabel),
      ourImpactLinkUrl: text(values.ourImpactLinkUrl),
      ourImpactLinkTarget: normalizeTarget(values.ourImpactLinkTarget),
      ourImpactNumberLocale: text(values.ourImpactNumberLocale) || "en-IN",
      ourImpactItems: Array.isArray(values.ourImpactItems)
        ? values.ourImpactItems.map(normalizeItem)
        : [],
    };

    if (isPageBlock && onSaveToPage) {
      onSaveToPage(payload);
      message.success("Changes will be saved with the page");
      onSuccess?.();
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await response.json();
      message.success("Our Impact saved");
      onSuccess?.();
    } catch (error) {
      message.error(error?.error || "Failed to save Our Impact");
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update }), [
    form,
    isPageBlock,
    onSaveToPage,
    onSuccess,
  ]);

  if (loading || saving) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const colorField = (name, label) => (
    <Form.Item name={name} label={label}>
      <Select allowClear options={colors} placeholder="From theme" />
    </Form.Item>
  );
  const numberField = (name, label, options = {}) => (
    <Col span={12}>
      <Form.Item name={name} label={label}>
        <InputNumber style={{ width: "100%" }} {...options} />
      </Form.Item>
    </Col>
  );

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["content"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={colors}
              />
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="ourImpactHeading" label="Heading">
                  <Input placeholder="Numbers that" />
                </Form.Item>
                <Form.Item
                  name="ourImpactHeadingAccent"
                  label="Heading accent"
                >
                  <Input placeholder="carry names." />
                </Form.Item>
                <Form.Item name="ourImpactNote" label="Audit note">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="ourImpactFooterText" label="Footer statement">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="ourImpactLinkLabel" label="Report link label">
                  <Input />
                </Form.Item>
                <Form.Item name="ourImpactLinkUrl" label="Report link URL">
                  <Input />
                </Form.Item>
                <Form.Item name="ourImpactLinkTarget" label="Report link target">
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
                <Form.Item
                  name="ourImpactNumberLocale"
                  label="Number locale"
                  tooltip="Locale used for number grouping, for example en-IN."
                >
                  <Input placeholder="en-IN" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "items",
            label: "Ledger Items",
            children: (
              <Form.List name="ourImpactItems">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Impact item"
                    addButtonText="Add impact item"
                    defaultAddPayload={{ index: "", number: 0, label: "" }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, "index"]}
                            label="Index"
                          >
                            <Input placeholder="01" />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item
                            {...restField}
                            name={[name, "number"]}
                            label="Number"
                            rules={[{ required: true, message: "Number is required" }]}
                          >
                            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "label"]}
                            label="Label"
                            rules={[{ required: true, message: "Label is required" }]}
                          >
                            <Input.TextArea rows={2} />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "colors",
            label: "Colors",
            children: (
              <>
                {colorField("ourImpactBandBgColorKey", "Band background")}
                {colorField("ourImpactGlowColorKey", "Background glow")}
                {colorField("ourImpactBaseTextColorKey", "Base text")}
                {colorField("ourImpactHeadingColorKey", "Heading")}
                {colorField("ourImpactHeadingAccentColorKey", "Heading accent")}
                {colorField("ourImpactNoteColorKey", "Audit note")}
                {colorField("ourImpactIndexColorKey", "Item indexes")}
                {colorField("ourImpactNumberColorKey", "Numbers")}
                {colorField("ourImpactLabelColorKey", "Item labels")}
                {colorField("ourImpactLineColorKey", "Divider lines")}
                {colorField("ourImpactFooterTextColorKey", "Footer statement")}
                {colorField("ourImpactLinkColorKey", "Report link")}
                {colorField("ourImpactLinkHoverColorKey", "Report link hover")}
              </>
            ),
          },
          {
            key: "animations",
            label: "Animations",
            children: (
              <>
                <Form.Item
                  name="ourImpactRevealEnabled"
                  label="Reveal content"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item name="ourImpactRevealStart" label="Reveal trigger">
                  <Input placeholder="top 86%" />
                </Form.Item>
                <Row gutter={16}>
                  {numberField("ourImpactRevealDuration", "Reveal duration s", {
                    min: 0,
                    step: 0.1,
                  })}
                  {numberField("ourImpactRevealStagger", "Reveal stagger s", {
                    min: 0,
                    step: 0.01,
                  })}
                  {numberField("ourImpactRevealDistance", "Reveal distance px", {
                    min: 0,
                  })}
                </Row>
                <Form.Item
                  name="ourImpactCountEnabled"
                  label="Count-up numbers"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item name="ourImpactCountStart" label="Counter trigger">
                  <Input placeholder="top 85%" />
                </Form.Item>
                <Form.Item name="ourImpactCountEase" label="Counter easing">
                  <Input placeholder="power2.out" />
                </Form.Item>
                <Row gutter={16}>
                  {numberField("ourImpactCountDuration", "Counter duration s", {
                    min: 0,
                    step: 0.1,
                  })}
                </Row>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(OurImpactEditForm);
