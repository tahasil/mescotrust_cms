"use client";

import { Button, Col, Form, Input, Modal, Row } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { deriveComponentId } from "./constants";

export default function SliderCreateModal({
  open,
  saving,
  form,
  onCancel,
  onSubmit,
}) {
  return (
    <Modal
      title="Add Slider"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      closable={!saving}
      maskClosable={!saving}
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          displayName: "",
          _derivedId: "",
        }}
        onValuesChange={(_, all) =>
          form.setFieldValue("_derivedId", deriveComponentId(all.displayName))
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="displayName"
              label="Slider name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Home Campaign Slider" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="_derivedId"
              label="Component ID"
              tooltip="Generated from slider name (no spaces)."
            >
              <Input disabled placeholder="Generated ID" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSubmit}
            loading={saving}
          >
            Create Slider
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
