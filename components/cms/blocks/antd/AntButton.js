"use client";

import { Button as AntButton } from "antd";

export default function AntButtonBlock({ text = "Button", type = "primary", size = "middle", danger = false, disabled = false }) {
  return (
    <AntButton type={type} size={size} danger={danger} disabled={disabled}>
      {text || "Button"}
    </AntButton>
  );
}
