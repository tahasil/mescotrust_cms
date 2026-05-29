"use client";

import { Input } from "antd";

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <Input.TextArea
      rows={6}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder || "Enter content"}
    />
  );
}

