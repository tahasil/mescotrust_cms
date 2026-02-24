"use client";

import { Card as AntCard } from "antd";

export default function AntCardBlock({ title, content, extra }) {
  return (
    <AntCard title={title || undefined} extra={extra || undefined}>
      {content || "Card content"}
    </AntCard>
  );
}
