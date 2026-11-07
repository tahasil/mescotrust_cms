"use client";

import { Card, Col, DatePicker, Form, InputNumber, Row, Switch } from "antd";

/** RSVP settings shared by the Add Event and Edit Event forms. */
export default function EventRsvpFields() {
  const form = Form.useFormInstance();
  const enabled = Form.useWatch("rsvpEnabled", form);

  return (
    <Card title="RSVP (Yes / Maybe / No)" size="small" style={{ marginBottom: 24 }}>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="rsvpEnabled"
            label="Enable RSVP"
            valuePropName="checked"
            extra="Replaces the Register button on the event page."
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="rsvpCapacity"
            label="Capacity"
            extra="Yes and Maybe both use a seat. Leave empty for no limit."
          >
            <InputNumber
              min={1}
              precision={0}
              disabled={!enabled}
              placeholder="No limit"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="rsvpClosesAt"
            label="Close replies on"
            extra="Optional. Replies always close when the event ends."
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="DD-MM-YYYY HH:mm"
              disabled={!enabled}
              placeholder="When the event ends"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}
