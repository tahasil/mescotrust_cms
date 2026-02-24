"use client";

import { Alert as AntAlert } from "antd";

export default function AntAlertBlock({ message, description, type, showIcon }) {
  return (
    <AntAlert
      message={message || "Alert message"}
      description={description || undefined}
      type={type || "info"}
      showIcon={showIcon !== false}
      style={{ margin: "8px 0" }}
    />
  );
}
