"use client";

import { Col, Divider, Form, InputNumber, Row, Switch } from "antd";

// MESCO-only frontend motion controls (smooth scroll + scroll-fade animation).
// Ported from the legacy /admin/theme editor so the Appearance module is the single
// surface. Field names match THEME_DEFAULTS in lib/layoutData.js; AppearanceModule
// loads/saves them via /api/theme (sitesettings), and PublicShell reads them to drive
// Lenis smooth scrolling + the scroll-into-view fade on the public site.
export default function EffectsSection() {
  return (
    <>
      <Divider orientation="left" plain style={{ margin: "0 0 12px" }}>
        Smooth Scroll (Lenis)
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="smoothScrollEnabled"
            label="Enable smooth scroll"
            valuePropName="checked"
            tooltip="Smooth scroll effect using the Lenis library"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="smoothScrollDuration"
            label="Duration"
            tooltip="Scroll animation duration (higher = slower, smoother)"
          >
            <InputNumber min={0.5} max={5} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="smoothScrollWheelMultiplier"
            label="Wheel speed"
            tooltip="Mouse wheel scroll speed multiplier"
          >
            <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="smoothScrollTouchMultiplier"
            label="Touch speed"
            tooltip="Touch/swipe scroll speed multiplier (mobile)"
          >
            <InputNumber min={0.1} max={5} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" plain style={{ margin: "16px 0 12px" }}>
        Scroll Animation
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="fadeAnimationEnabled"
            label="Enable scroll animation"
            valuePropName="checked"
            tooltip="Fade-in effect when sections scroll into view"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="fadeAnimationDuration"
            label="Duration (seconds)"
            tooltip="How long the fade-in transition takes"
          >
            <InputNumber min={0.1} max={3} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="fadeAnimationDistance"
            label="Distance (vh)"
            tooltip="How far the section slides up from (in viewport height units)"
          >
            <InputNumber min={0} max={50} step={1} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            name="fadeAnimationThreshold"
            label="Trigger threshold"
            tooltip="How much of the section must be visible to trigger (0 = any part, 1 = fully visible)"
          >
            <InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
