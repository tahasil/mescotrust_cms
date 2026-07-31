"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Col, Collapse, Form, Input, InputNumber, Row, Spin, message } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/ContactUs";
const PREFIX = "contactUs";
const TYPOGRAPHY_DEFAULTS = {
  contactUsFormHeadingFontSize: 24,
  contactUsFormHeadingFontWeight: 620,
  contactUsFormHeadingLineHeight: 1.2,
  contactUsInfoLabelFontSize: 13,
  contactUsInfoLabelFontWeight: 620,
  contactUsInfoLabelLineHeight: 1.4,
  contactUsInfoTextFontSize: 13,
  contactUsInfoTextLineHeight: 1.55,
  contactUsFieldLabelFontSize: 12,
  contactUsFieldLabelLineHeight: 1.4,
  contactUsInputTextFontSize: 13,
  contactUsButtonFontSize: 13,
};

function numericValue(data, key) {
  const value = Number(data?.[key]);
  return Number.isFinite(value) ? value : TYPOGRAPHY_DEFAULTS[key];
}

function ContactUsEditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const themeFetchedForColorsRef = useRef(false);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) setThemeColorOptions(themeColorOptionsProp);
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    const setFormAndColors = (data, theme) => {
      form.setFieldsValue({
        ...getManageSectionInitialValues(PREFIX, data),
        contactUsBtnBgColorKey: data?.contactUsBtnBgColorKey != null ? String(data.contactUsBtnBgColorKey).trim() : "",
        contactUsBtnTextColorKey: data?.contactUsBtnTextColorKey != null ? String(data.contactUsBtnTextColorKey).trim() : "",
        contactUsFormHeadingColorKey: data?.contactUsFormHeadingColorKey != null ? String(data.contactUsFormHeadingColorKey).trim() : "",
        contactUsInfoLabelColorKey: data?.contactUsInfoLabelColorKey != null ? String(data.contactUsInfoLabelColorKey).trim() : "Primary",
        contactUsInfoTextColorKey: data?.contactUsInfoTextColorKey != null ? String(data.contactUsInfoTextColorKey).trim() : "Black Light",
        contactUsInfoCardBgColorKey: data?.contactUsInfoCardBgColorKey != null ? String(data.contactUsInfoCardBgColorKey).trim() : "White",
        contactUsInfoCardBorderColorKey: data?.contactUsInfoCardBorderColorKey != null ? String(data.contactUsInfoCardBorderColorKey).trim() : "Border",
        contactUsFormCardBgColorKey: data?.contactUsFormCardBgColorKey != null ? String(data.contactUsFormCardBgColorKey).trim() : "White",
        contactUsFormCardBorderColorKey: data?.contactUsFormCardBorderColorKey != null ? String(data.contactUsFormCardBorderColorKey).trim() : "Border",
        contactUsFieldLabelColorKey: data?.contactUsFieldLabelColorKey != null ? String(data.contactUsFieldLabelColorKey).trim() : "Black",
        contactUsInputBgColorKey: data?.contactUsInputBgColorKey != null ? String(data.contactUsInputBgColorKey).trim() : "White",
        contactUsInputBorderColorKey: data?.contactUsInputBorderColorKey != null ? String(data.contactUsInputBorderColorKey).trim() : "Border",
        contactUsInputFocusColorKey: data?.contactUsInputFocusColorKey != null ? String(data.contactUsInputFocusColorKey).trim() : "Primary",
        contactUsInputTextColorKey: data?.contactUsInputTextColorKey != null ? String(data.contactUsInputTextColorKey).trim() : "Black",
        contactUsRegdOffice: data?.contactUsRegdOffice ?? "110, Natalwala Building, V. S. Road, Mahim(W), Mumbai - 400 016.",
        contactUsAdminOffice: data?.contactUsAdminOffice ?? "1 & 2, Plot No 423, Landmark Building, Next to Johnson & Johnson, Near Saraswati Mandir School, Senapati Bapat Marg, Mahim(W), Mumbai - 400016.",
        contactUsEmail: data?.contactUsEmail ?? "mescotrust@mescotrust.org",
        contactUsPhone: data?.contactUsPhone ?? "(+9122) 24441442, (+9122) 24448637",
        contactUsSubjects: data?.contactUsSubjects ?? "General Inquiry, Volunteering, Donation, Partnership, Other",
        contactUsMapEmbedUrl: data?.contactUsMapEmbedUrl ?? "",
        ...Object.fromEntries(
          Object.keys(TYPOGRAPHY_DEFAULTS).map((key) => [key, numericValue(data, key)]),
        ),
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
      .catch(() => message.error("Failed to load Contact Us"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...getManageSectionPayload(PREFIX, values),
        contactUsBtnBgColorKey: values.contactUsBtnBgColorKey != null ? String(values.contactUsBtnBgColorKey).trim() : "",
        contactUsBtnTextColorKey: values.contactUsBtnTextColorKey != null ? String(values.contactUsBtnTextColorKey).trim() : "",
        contactUsFormHeadingColorKey: values.contactUsFormHeadingColorKey != null ? String(values.contactUsFormHeadingColorKey).trim() : "",
        contactUsInfoLabelColorKey: String(values.contactUsInfoLabelColorKey ?? "").trim(),
        contactUsInfoTextColorKey: String(values.contactUsInfoTextColorKey ?? "").trim(),
        contactUsInfoCardBgColorKey: String(values.contactUsInfoCardBgColorKey ?? "").trim(),
        contactUsInfoCardBorderColorKey: String(values.contactUsInfoCardBorderColorKey ?? "").trim(),
        contactUsFormCardBgColorKey: String(values.contactUsFormCardBgColorKey ?? "").trim(),
        contactUsFormCardBorderColorKey: String(values.contactUsFormCardBorderColorKey ?? "").trim(),
        contactUsFieldLabelColorKey: String(values.contactUsFieldLabelColorKey ?? "").trim(),
        contactUsInputBgColorKey: String(values.contactUsInputBgColorKey ?? "").trim(),
        contactUsInputBorderColorKey: String(values.contactUsInputBorderColorKey ?? "").trim(),
        contactUsInputFocusColorKey: String(values.contactUsInputFocusColorKey ?? "").trim(),
        contactUsInputTextColorKey: String(values.contactUsInputTextColorKey ?? "").trim(),
        contactUsRegdOffice: values.contactUsRegdOffice != null ? String(values.contactUsRegdOffice).trim() : "",
        contactUsAdminOffice: values.contactUsAdminOffice != null ? String(values.contactUsAdminOffice).trim() : "",
        contactUsEmail: values.contactUsEmail != null ? String(values.contactUsEmail).trim() : "",
        contactUsPhone: values.contactUsPhone != null ? String(values.contactUsPhone).trim() : "",
        contactUsSubjects: values.contactUsSubjects != null ? String(values.contactUsSubjects).trim() : "",
        contactUsMapEmbedUrl: values.contactUsMapEmbedUrl != null ? String(values.contactUsMapEmbedUrl).trim() : "",
        ...Object.fromEntries(
          Object.keys(TYPOGRAPHY_DEFAULTS).map((key) => [
            key,
            Number.isFinite(Number(values[key]))
              ? Number(values[key])
              : TYPOGRAPHY_DEFAULTS[key],
          ]),
        ),
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
        .then(() => { message.success("Contact Us saved"); onSuccess?.(); })
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
        defaultActiveKey={["title-colors", "typography", "contact-info"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("ContactUs")} />,
          },
          {
            key: "typography",
            label: "Typography",
            children: (
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsFormHeadingFontSize" label="Form heading size (px)">
                    <InputNumber min={16} max={64} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsFormHeadingFontWeight" label="Form heading weight">
                    <InputNumber min={100} max={900} step={10} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsFormHeadingLineHeight" label="Form heading line height">
                    <InputNumber min={0.8} max={2.2} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInfoLabelFontSize" label="Information label size (px)">
                    <InputNumber min={10} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInfoLabelFontWeight" label="Information label weight">
                    <InputNumber min={100} max={900} step={10} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInfoLabelLineHeight" label="Information label line height">
                    <InputNumber min={0.8} max={2.2} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInfoTextFontSize" label="Information text size (px)">
                    <InputNumber min={10} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInfoTextLineHeight" label="Information text line height">
                    <InputNumber min={0.8} max={2.2} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsFieldLabelFontSize" label="Field label size (px)">
                    <InputNumber min={10} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsFieldLabelLineHeight" label="Field label line height">
                    <InputNumber min={0.8} max={2.2} step={0.05} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsInputTextFontSize" label="Input text size (px)">
                    <InputNumber min={10} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="contactUsButtonFontSize" label="Button text size (px)">
                    <InputNumber min={10} max={28} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ),
          },
          {
            key: "contact-info",
            label: "Contact Information",
            children: (
              <>
                <Form.Item name="contactUsRegdOffice" label="Regd. Office Address">
                  <Input.TextArea rows={2} placeholder="Registered office address" />
                </Form.Item>
                <Form.Item name="contactUsAdminOffice" label="Admin Office Address">
                  <Input.TextArea rows={3} placeholder="Admin office address" />
                </Form.Item>
                <Form.Item name="contactUsEmail" label="Email">
                  <Input placeholder="e.g. mescotrust@mescotrust.org" />
                </Form.Item>
                <Form.Item name="contactUsPhone" label="Phone">
                  <Input placeholder="e.g. (+9122) 24441442, (+9122) 24448637" />
                </Form.Item>
                <Form.Item name="contactUsSubjects" label="Subject Options" extra="Comma-separated list of subjects for the dropdown">
                  <Input placeholder="General Inquiry, Volunteering, Donation, Partnership, Other" />
                </Form.Item>
                <Form.Item name="contactUsMapEmbedUrl" label="Google Map Embed URL" extra="Go to Google Maps → Share → Embed a map → copy the src URL">
                  <Input.TextArea rows={2} placeholder="https://www.google.com/maps/embed?pb=..." />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(ContactUsEditForm);
