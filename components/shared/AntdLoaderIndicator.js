"use client";

import { useEffect } from "react";
import { Spin } from "antd";

function createIndicator() {
  return (
    <span className="app-global-loader-indicator" aria-hidden="true">
      <span className="app-global-loader-spinner app-global-loader-spinner-inline" />
    </span>
  );
}

export default function AntdLoaderIndicator() {
  useEffect(() => {
    Spin.setDefaultIndicator(createIndicator());
    return () => {
      Spin.setDefaultIndicator(null);
    };
  }, []);

  return null;
}

