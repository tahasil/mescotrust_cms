"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, message, Spin, Collapse, InputNumber, Row, Col, Select } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/SectionIntro";
const PREFIX = "sectionIntro";
const DEFAULT_DESCRIPTION_FONT_SIZE = 16;
const DEFAULT_DESCRIPTION_FONT_WEIGHT = 400;
const DEFAULT_DESCRIPTION_LINE_HEIGHT = 1.7;

function normalizeDescriptionHtml(value) {
  if (value == null) return "";
  return String(value).replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ").trim();
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Edit form for SectionIntro — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function SectionIntroEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Section Title",
        subTitle: data.subTitle ?? "Subtitle",
        titleColorKey: data.titleColorKey ?? "",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
        sectionIntroTitleEnabled:
          data?.sectionIntroTitleEnabled !== false &&
          data?.sectionIntroTitleEnabled !== "false",
        sectionIntroSubTitleEnabled:
          data?.sectionIntroSubTitleEnabled !== false &&
          data?.sectionIntroSubTitleEnabled !== "false",
        sectionIntroDescriptionFontSize: clamp(
          toNumber(data?.sectionIntroDescriptionFontSize, DEFAULT_DESCRIPTION_FONT_SIZE),
          10,
          80,
        ),
        sectionIntroDescriptionFontWeight: clamp(
          toNumber(data?.sectionIntroDescriptionFontWeight, DEFAULT_DESCRIPTION_FONT_WEIGHT),
          100,
          900,
        ),
        sectionIntroDescriptionLineHeight: clamp(
          toNumber(data?.sectionIntroDescriptionLineHeight, DEFAULT_DESCRIPTION_LINE_HEIGHT),
          1,
          3,
        ),
        sectionIntroParagraph: normalizeDescriptionHtml(data?.sectionIntroParagraph),
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? "Section Title",
          subTitle: (data && data.subTitle) ?? "Subtitle",
          titleColorKey: (data && data.titleColorKey) ?? "",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
          sectionIntroTitleEnabled:
            data?.sectionIntroTitleEnabled !== false &&
            data?.sectionIntroTitleEnabled !== "false",
          sectionIntroSubTitleEnabled:
            data?.sectionIntroSubTitleEnabled !== false &&
            data?.sectionIntroSubTitleEnabled !== "false",
          sectionIntroDescriptionFontSize: clamp(
            toNumber(data?.sectionIntroDescriptionFontSize, DEFAULT_DESCRIPTION_FONT_SIZE),
            10,
            80,
          ),
          sectionIntroDescriptionFontWeight: clamp(
            toNumber(data?.sectionIntroDescriptionFontWeight, DEFAULT_DESCRIPTION_FONT_WEIGHT),
            100,
            900,
          ),
          sectionIntroDescriptionLineHeight: clamp(
            toNumber(data?.sectionIntroDescriptionLineHeight, DEFAULT_DESCRIPTION_LINE_HEIGHT),
            1,
            3,
          ),
          sectionIntroParagraph: normalizeDescriptionHtml(data?.sectionIntroParagraph),
        });
      })
      .catch(() => message.error("Failed to load SectionIntro"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        sectionIntroTitleEnabled:
          values.sectionIntroTitleEnabled !== false &&
          values.sectionIntroTitleEnabled !== "false",
        sectionIntroSubTitleEnabled:
          values.sectionIntroSubTitleEnabled !== false &&
          values.sectionIntroSubTitleEnabled !== "false",
        sectionIntroDescriptionFontSize: clamp(
          toNumber(values.sectionIntroDescriptionFontSize, DEFAULT_DESCRIPTION_FONT_SIZE),
          10,
          80,
        ),
        sectionIntroDescriptionFontWeight: clamp(
          toNumber(values.sectionIntroDescriptionFontWeight, DEFAULT_DESCRIPTION_FONT_WEIGHT),
          100,
          900,
        ),
        sectionIntroDescriptionLineHeight: clamp(
          toNumber(values.sectionIntroDescriptionLineHeight, DEFAULT_DESCRIPTION_LINE_HEIGHT),
          1,
          3,
        ),
        sectionIntroParagraph: normalizeDescriptionHtml(values.sectionIntroParagraph),
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
          message.success("Section Intro saved");
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
        defaultActiveKey={["manage-section", "title-colors", "description-typography", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("SectionIntro")} />,
          },
          {
            key: "description-typography",
            label: "Description Typography",
            children: (
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item name="sectionIntroDescriptionFontSize" label="Font Size">
                    <InputNumber min={10} max={80} step={1} style={{ width: "100%" }} addonAfter="px" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sectionIntroDescriptionFontWeight" label="Font Weight">
                    <Select
                      options={[
                        { label: "100", value: 100 },
                        { label: "200", value: 200 },
                        { label: "300", value: 300 },
                        { label: "400", value: 400 },
                        { label: "500", value: 500 },
                        { label: "600", value: 600 },
                        { label: "700", value: 700 },
                        { label: "800", value: 800 },
                        { label: "900", value: 900 },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sectionIntroDescriptionLineHeight" label="Line Height">
                    <InputNumber min={1} max={3} step={0.1} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="sectionIntroParagraph" label="Description">
                  <RichTextEditor placeholder="Enter description..." />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(SectionIntroEditForm);
