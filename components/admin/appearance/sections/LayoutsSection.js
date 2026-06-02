"use client";

import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tabs,
  Typography,
} from "antd";
import { LOCALE_OPTIONS } from "@/lib/localeOptions";

export default function LayoutsSection() {
  const frontendLayoutsTab = (
    <>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="layoutWidth" label="Container max-width (px)">
            <InputNumber min={600} max={1920} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="defaultLocale" label="Default locale">
            <Select options={LOCALE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="direction" label="Direction">
            <Select
              options={[
                { value: "ltr", label: "LTR" },
                { value: "rtl", label: "RTL" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="baseFontSize" label="Base font size (px)">
            <InputNumber min={10} max={40} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="lineHeight" label="Line height">
            <InputNumber min={1} max={3} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item name="letterSpacing" label="Letter spacing (px)">
            <InputNumber min={-2} max={8} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="mobileFontSize"
            label="Mobile font size override (px)"
            tooltip="Base font size on screens ≤767px. Set to 0 to use the desktop base font size."
          >
            <InputNumber min={0} max={40} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const adminLayoutsTab = (
    <>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="adminSiteName" label="Admin site name">
            <Input placeholder="Site name in admin panel" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="adminLogoUrl" label="Admin logo URL">
            <Input placeholder="/uploads/admin-logo.png" />
          </Form.Item>
        </Col>
      </Row>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Sidebar and CTA appearance can be customized from Appearance → Colors.
      </Typography.Text>
    </>
  );

  const tabItems = [
    {
      key: "frontend-layouts",
      label: "Frontend Layouts",
      children: frontendLayoutsTab,
    },
    {
      key: "admin-layouts",
      label: "Admin Layouts",
      children: adminLayoutsTab,
    },
  ];

  return (
    <>
      <Tabs
        className="appearance-line-tabs"
        items={tabItems}
        defaultActiveKey="frontend-layouts"
        size="middle"
      />
      <style jsx global>{`
        .appearance-line-tabs > .ant-tabs-nav {
          margin: 0 0 10px 0;
        }
        .appearance-line-tabs > .ant-tabs-nav::before {
          border-bottom: none !important;
        }
        .appearance-line-tabs .ant-tabs-nav-list {
          width: auto;
          display: inline-flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .appearance-line-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 8px 18px !important;
          border: 1px solid #dbdbdb !important;
          border-radius: 10px !important;
          background: #ffffff !important;
          min-height: 38px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .appearance-line-tabs .ant-tabs-tab-btn {
          color: #0f2f3a;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.1;
        }
        .appearance-line-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #0f2f3a !important;
          font-weight: 700;
        }
        .appearance-line-tabs .ant-tabs-ink-bar {
          display: none !important;
        }
        .appearance-line-tabs .ant-tabs-content-holder {
          border: 1px solid #dbdbdb;
          border-radius: 12px;
          margin-top: 10px;
          padding: 14px 12px 12px;
          background: #ffffff;
        }
        @media (max-width: 991px) {
          .appearance-line-tabs .ant-tabs-tab {
            padding: 7px 12px !important;
            min-height: 36px;
          }
          .appearance-line-tabs .ant-tabs-tab-btn {
            font-size: 14px;
          }
          .appearance-line-tabs .ant-tabs-content-holder {
            border-radius: 10px;
            margin-top: 8px;
            padding: 12px 10px 10px;
          }
        }
        @media (max-width: 575px) {
          .appearance-line-tabs .ant-tabs-nav-list {
            width: 100%;
            gap: 8px;
          }
          .appearance-line-tabs .ant-tabs-tab {
            flex: 1 1 calc(50% - 4px);
            justify-content: center;
            padding: 7px 10px !important;
          }
        }
      `}</style>
    </>
  );
}
