"use client";

import {
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Tabs } from "antd";
import { ColorCodeInput, FormColor } from "@/components/admin/appearance/shared";
import { ThemeAppearanceLineTabs } from "@/styles/Theme";

export default function ColorsSection() {
  const tabItems = [
    {
      key: "frontend",
      label: "Frontend UI Colors",
      children: (
        <Form.List name="paletteColors">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 12]}>
                {fields.map(({ key, name }) => (
                  <Col xs={24} md={12} key={key}>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <Form.Item
                        name={[name, "key"]}
                        rules={[{ required: true, message: "Key required" }]}
                        style={{ marginBottom: 0, flex: "1 1 100px", minWidth: 0 }}
                      >
                        <Input placeholder="e.g. headerBg" />
                      </Form.Item>
                      <Form.Item
                        name={[name, "value"]}
                        rules={[{ required: true, message: "Value required" }]}
                        style={{ marginBottom: 0, flex: "1 1 140px", minWidth: 0 }}
                      >
                        <ColorCodeInput placeholder="#hex or rgba(...)" />
                      </Form.Item>
                      <Button
                        type="default"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ flexShrink: 0, marginTop: 4 }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
              <Button
                type="primary"
                onClick={() => add({ key: "", value: "" })}
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
              >
                Add Color
              </Button>
            </>
          )}
        </Form.List>
      ),
    },
    {
      key: "admin-ui",
      label: "Admin UI Colors",
      children: (
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminTextColor" label="Admin text color" placeholder="#333333" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminBorderColor" label="Admin border color" placeholder="rgba(0,0,0,0.06)" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminCtaBgColor" label="Admin CTA bg" placeholder="#1677ff" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminCtaTextColor" label="Admin CTA text" placeholder="#ffffff" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminCtaHoverBgColor" label="Admin CTA hover bg" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminCtaHoverTextColor" label="Admin CTA hover text" />
          </Col>
        </Row>
      ),
    },
    {
      key: "admin-sidebar",
      label: "Admin Sidebar UI Colors",
      children: (
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarBg" label="Sidebar bg" placeholder="#ffffff" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarText" label="Sidebar text" placeholder="rgba(0,0,0,0.65)" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarHoverBg" label="Sidebar hover bg" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarHoverText" label="Sidebar hover text" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarActiveBg" label="Sidebar active bg" />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormColor name="adminSidebarActiveText" label="Sidebar active text" />
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <ThemeAppearanceLineTabs>
      <Tabs
        className="appearance-line-tabs"
        items={tabItems}
        defaultActiveKey="frontend"
        size="middle"
      />
    </ThemeAppearanceLineTabs>
  );
}
