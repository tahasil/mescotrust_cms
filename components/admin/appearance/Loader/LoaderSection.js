"use client";

import { Col, Form, InputNumber, Row, Switch, Tabs, Typography } from "antd";
import { ColorCodeInput, FormColor } from "@/components/admin/appearance/shared";

export default function LoaderSection({ form }) {
  const pageLoaderEnabled = Form.useWatch("pageLoaderEnabled", form);
  const pageLoaderBgColor =
    Form.useWatch("pageLoaderBgColor", form) || "rgba(0,0,0,0.85)";
  const pageLoaderBarColor = Form.useWatch("pageLoaderBarColor", form) || "#CF372F";
  const pageLoaderMinDuration =
    Form.useWatch("pageLoaderMinDuration", form) ?? 400;
  const adminLoaderColor = Form.useWatch("adminLoaderColor", form) || "#1677ff";
  const adminLoaderBgColor =
    Form.useWatch("adminLoaderBgColor", form) || "rgba(255,255,255,0.5)";

  const frontendLoaderTab = (
    <Row gutter={[20, 0]} align="top">
      <Col xs={24} lg={12}>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="pageLoaderEnabled"
              label="Enable page loader"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="pageLoaderMinDuration"
              label="Minimum duration (ms)"
            >
              <InputNumber min={0} max={3000} step={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item name="pageLoaderBgColor" label="Page loader overlay">
              <ColorCodeInput placeholder="#000000 or rgba(0,0,0,0.8)" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="pageLoaderBarColor" label="Page loader bar color">
              <ColorCodeInput placeholder="#CF372F" />
            </Form.Item>
          </Col>
        </Row>
      </Col>
      <Col xs={24} lg={12}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Frontend Preview:
        </Typography.Text>
        <div
          className="loader-preview-shell"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 176,
            padding: 24,
            marginTop: 8,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        >
          <div
            className="loader-preview-card"
            style={{
              width: "100%",
              maxWidth: 560,
              minHeight: 210,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #f0f0f0",
              background: "#ffffff",
              position: "relative"
            }}
          >
            <div
              className="frontend-loader-preview-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: pageLoaderBgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {pageLoaderEnabled !== false ? (
                <span
                  className="frontend-loader-preview-spinner"
                  style={{
                    borderTopColor: pageLoaderBarColor,
                  }}
                />
              ) : (
                <Typography.Text
                  type="secondary"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Loader Disabled
                </Typography.Text>
              )}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );

  const adminLoaderTab = (
    <Row gutter={[20, 0]} align="top">
      <Col xs={24} lg={12}>
        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item label="Minimum duration (ms)">
              <InputNumber
                min={0}
                max={3000}
                step={100}
                value={Number(pageLoaderMinDuration) || 0}
                onChange={(value) =>
                  form.setFieldsValue({
                    pageLoaderMinDuration:
                      value == null ? 0 : Number(value),
                  })
                }
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <FormColor
              name="adminLoaderColor"
              label="Page loader color"
              placeholder="#1677ff"
            />
          </Col>
          <Col xs={24} md={12}>
            <FormColor
              name="adminLoaderBgColor"
              label="Page loader overlay"
              placeholder="rgba(255,255,255,0.5)"
            />
          </Col>
        </Row>
      </Col>
      <Col xs={24} lg={12}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Admin Preview:
        </Typography.Text>
        <div
          className="loader-preview-shell"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 176,
            padding: 24,
            marginTop: 8,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        >
          <div
            className="loader-preview-card"
            style={{
              width: "100%",
              maxWidth: 560,
              minHeight: 210,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #f0f0f0",
              background: "#202a33",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: adminLoaderBgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="frontend-loader-preview-spinner"
                style={{
                  borderColor: "rgba(0,0,0,0.18)",
                  borderTopColor: adminLoaderColor,
                }}
              />
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: "frontend-loader",
      label: "Frontend Loader",
      children: frontendLoaderTab,
    },
    {
      key: "admin-loader",
      label: "Admin Loader",
      children: adminLoaderTab,
    },
  ];

  return (
    <>
      <Tabs
        className="appearance-line-tabs"
        items={tabItems}
        defaultActiveKey="frontend-loader"
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
          .loader-preview-shell {
            min-height: 154px !important;
            padding: 16px !important;
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
          .loader-preview-shell {
            min-height: 132px !important;
            padding: 12px !important;
          }
          .loader-preview-card {
            min-height: 156px !important;
          }
        }
        .frontend-loader-preview-spinner {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.25);
          animation: frontendLoaderPreviewSpin 0.8s linear infinite;
          display: inline-block;
          background: transparent;
        }
        @keyframes frontendLoaderPreviewSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
