"use client";

import { Form, Input } from "antd";

export default function AdvancedSection() {
  return (
    <>
      <Form.Item name="customCss" label="Custom CSS">
        <Input.TextArea
          rows={8}
          placeholder=".my-class { color: red; }"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Form.Item>
      <Form.Item name="customJs" label="Custom JS">
        <Input.TextArea
          rows={6}
          placeholder="console.log('custom js');"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Form.Item>
      <Form.Item name="headScripts" label="Head scripts">
        <Input.TextArea
          rows={4}
          placeholder="<script>...</script>"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Form.Item>
      <Form.Item name="footerScripts" label="Footer scripts">
        <Input.TextArea
          rows={4}
          placeholder="<script>...</script>"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Form.Item>
      <Form.Item name="googleAnalyticsId" label="Google Analytics ID">
        <Input placeholder="G-XXXXXXXXXX" />
      </Form.Item>
    </>
  );
}

