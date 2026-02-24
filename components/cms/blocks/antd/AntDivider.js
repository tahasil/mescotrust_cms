"use client";

import { Divider as AntDivider } from "antd";

export default function AntDividerBlock({ text, orientation, type, plain }) {
  const o = orientation || "center";
  const t = type || "horizontal";
  if (text) {
    return <AntDivider orientation={o} type={t} plain={plain !== false}>{text}</AntDivider>;
  }
  return <AntDivider type={t} />;
}
