"use client";

import { Input as AntInput } from "antd";

export default function AntInputBlock({ placeholder, value, size, disabled }) {
  return (
    <AntInput placeholder={placeholder || "Placeholder"} defaultValue={value || ""} size={size || "middle"} disabled={!!disabled} style={{ maxWidth: 320 }} />
  );
}
