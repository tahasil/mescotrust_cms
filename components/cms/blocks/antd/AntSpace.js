"use client";

import { Space as AntSpace } from "antd";

export default function AntSpaceBlock({ direction, size }) {
  return (
    <AntSpace direction={direction || "horizontal"} size={size || "middle"}>
      <span style={{ color: "#999" }}>Space (add blocks in Section for grouped layout)</span>
    </AntSpace>
  );
}
