"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Select, Switch, Tabs, Typography } from "antd";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import { ColorCodeInput, FormColor } from "@/components/admin/appearance/shared";
import { ThemeAppearanceLineTabs } from "@/styles/Theme";

const TARGET_OPTIONS = [
  { value: "frontend", label: "Frontend" },
  { value: "admin", label: "Admin" },
  { value: "both", label: "Both" },
];

function BackgroundBaseColors() {
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Background Base Colors
      </Typography.Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} lg={8}>
          <FormColor name="bodyBackground" label="Body background" placeholder="#ffffff" />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormColor name="sectionBackground" label="Section background" placeholder="#ffffff" />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormColor name="cardBackground" label="Card background" placeholder="#ffffff" />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormColor
            name="headerBackground"
            label="Header background"
            placeholder="rgba(255,255,255,1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormColor
            name="footerBackground"
            label="Footer background"
            placeholder="rgba(0,0,0,1)"
          />
        </Col>
      </Row>
    </>
  );
}

function BackgroundImageLibrary({ defaultTarget = "frontend" }) {
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 16 }}>
        Background Image Library
      </Typography.Title>
      <Form.List name="backgroundImages">
        {(fields, { add, remove }) => (
          <>
            <Row gutter={[16, 12]}>
              {fields.map(({ key, name }) => (
                <Col xs={24} key={key}>
                  <div
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 12,
                      background: "#fafafa",
                    }}
                  >
                    <Row gutter={[12, 0]} align="middle">
                      <Col xs={24} md={6}>
                        <Form.Item
                          name={[name, "name"]}
                          label="Name"
                          rules={[{ required: true, message: "Name required" }]}
                        >
                          <Input placeholder="e.g. default-site-bg" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[name, "url"]}
                          label="Image URL"
                          rules={[{ required: true, message: "Image is required" }]}
                        >
                          <MediaPickerInput placeholder="/uploads/..." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item name={[name, "target"]} label="Target">
                          <Select options={TARGET_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={3}>
                        <Form.Item name={[name, "enabled"]} label="Enabled" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={3}>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ marginTop: 30 }}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </Col>
              ))}
            </Row>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                add({
                  name: "",
                  url: "",
                  target: defaultTarget,
                  enabled: true,
                })
              }
            >
              Add background image
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}

function BackgroundColorLibrary({ defaultTarget = "frontend" }) {
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Background Color Library
      </Typography.Title>
      <Form.List name="backgroundColors">
        {(fields, { add, remove }) => (
          <>
            <Row gutter={[16, 12]}>
              {fields.map(({ key, name }) => (
                <Col xs={24} key={key}>
                  <div
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 12,
                      background: "#fafafa",
                    }}
                  >
                    <Row gutter={[12, 0]} align="middle">
                      <Col xs={24} md={6}>
                        <Form.Item
                          name={[name, "name"]}
                          label="Name"
                          rules={[{ required: true, message: "Name required" }]}
                        >
                          <Input placeholder="e.g. admin-shell-bg" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name={[name, "value"]}
                          label="Color value"
                          rules={[{ required: true, message: "Color is required" }]}
                        >
                          <ColorCodeInput placeholder="#0f172a or rgba(...)" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item name={[name, "target"]} label="Target">
                          <Select options={TARGET_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={3}>
                        <Form.Item name={[name, "enabled"]} label="Enabled" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={3}>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ marginTop: 30 }}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </Col>
              ))}
            </Row>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                add({
                  name: "",
                  value: "",
                  target: defaultTarget,
                  enabled: true,
                })
              }
            >
              Add background color
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}

function ActiveBackgroundMapping({
  title,
  imageField,
  imageLabel,
  colorField,
  colorLabel,
  imageOptions,
  colorOptions,
}) {
  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={imageField} label={imageLabel}>
            <Select allowClear options={imageOptions} placeholder="Select image from library" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={colorField} label={colorLabel}>
            <Select allowClear options={colorOptions} placeholder="Select color from library" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

export default function BackgroundSection({ form }) {
  const backgroundImages = Form.useWatch("backgroundImages", form) || [];
  const backgroundColors = Form.useWatch("backgroundColors", form) || [];
  const imageOptions = backgroundImages
    .filter((it) => it?.name)
    .map((it) => ({ label: it.name, value: it.name }));
  const colorOptions = backgroundColors
    .filter((it) => it?.name)
    .map((it) => ({ label: it.name, value: it.name }));

  const tabItems = [
    {
      key: "frontend",
      label: "Frontend background",
      children: (
        <>
          <BackgroundBaseColors />
          <BackgroundImageLibrary defaultTarget="frontend" />
          <BackgroundColorLibrary defaultTarget="frontend" />
          <div style={{ marginTop: 24 }}>
            <ActiveBackgroundMapping
              title="Frontend Active Background"
              imageField="activeFrontendBackgroundImage"
              imageLabel="Frontend background image"
              colorField="activeFrontendBackgroundColor"
              colorLabel="Frontend background color"
              imageOptions={imageOptions}
              colorOptions={colorOptions}
            />
          </div>
        </>
      ),
    },
    {
      key: "admin",
      label: "Admin background",
      children: (
        <ActiveBackgroundMapping
          title="Admin Active Background"
          imageField="activeAdminBackgroundImage"
          imageLabel="Admin background image"
          colorField="activeAdminBackgroundColor"
          colorLabel="Admin background color"
          imageOptions={imageOptions}
          colorOptions={colorOptions}
        />
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
        destroyInactiveTabPane
      />
    </ThemeAppearanceLineTabs>
  );
}
