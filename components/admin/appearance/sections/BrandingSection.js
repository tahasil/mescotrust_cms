"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Col, Form, Input, Row, Select } from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";

const GOOGLE_FONT_OPTIONS = [
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Inter", value: "Inter" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Roboto Condense", value: "Roboto Condensed" },
];

const GOOGLE_FONT_WEIGHTS = [300, 400, 500, 600, 700];

export default function BrandingSection({ form }) {
  const siteTitle = Form.useWatch("siteTitle", form);
  const logoDesktop = Form.useWatch("logoLightUrl", form);
  const googleFontFamily = Form.useWatch("googleFontFamily", form);

  const adminTextColor = Form.useWatch("adminTextColor", form) || "#333333";
  const adminBorderColor =
    Form.useWatch("adminBorderColor", form) || "rgba(0,0,0,0.06)";

  const fontOptions = useMemo(() => GOOGLE_FONT_OPTIONS, []);

  const cardStyle = {
    border: `1px solid ${adminBorderColor}`,
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    height: "100%",
  };

  const previewFrameStyle = {
    border: `1px dashed ${adminBorderColor}`,
    borderRadius: 10,
    minHeight: 88,
    padding: 12,
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fafafa",
  };

  const onGoogleFontChange = useCallback(
    (family) => {
      form.setFieldsValue({
        googleFontFamily: family || "",
      });
    },
    [form],
  );

  useEffect(() => {
    if (!logoDesktop) return;
    const currentLegacy = form.getFieldValue("logoImageUrl");
    if (!currentLegacy || String(currentLegacy).trim() === "") {
      form.setFieldValue("logoImageUrl", logoDesktop);
    }
  }, [form, logoDesktop]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Form.Item name="logoType" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="logoImageUrl" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="bodyFont" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="googleFontFamily" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="headingFont" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="buttonFont" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="fontFamily" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="headingFontFamily" hidden>
        <Input />
      </Form.Item>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item name="siteTitle" label="Site Title">
              <Input placeholder="Enter site title" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item label="Google Fonts" required>
              <Select
                showSearch
                allowClear
                placeholder="Select Google Font"
                options={fontOptions}
                value={googleFontFamily || undefined}
                onChange={onGoogleFontChange}
                optionFilterProp="label"
              />
            </Form.Item>
            <div
              style={{
                ...previewFrameStyle,
                minHeight: 68,
                justifyContent: "flex-start",
              }}
            >
              <span
                style={{
                  color: adminTextColor,
                  fontSize: 16,
                  fontFamily: googleFontFamily || "system-ui, sans-serif",
                }}
              >
                {googleFontFamily || "System default"} preview
              </span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item name="logoLightUrl" label="Logo (Desktop)">
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item name="logoMobileUrl" label="Logo (Mobile)">
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item name="faviconUrl" label="Favicon URL">
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <Form.Item name="adminLogoUrl" label="Admin Logo URL">
              <MediaPickerInput placeholder="/media/..." />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <div
        style={{
          ...cardStyle,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: adminTextColor, fontWeight: 600 }}>
          Current Site Title
        </div>
        <div style={{ color: "rgba(0,0,0,0.65)" }}>
          {String(siteTitle || "").trim() || "Not set"}
        </div>
      </div>
    </div>
  );
}
