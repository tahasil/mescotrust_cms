"use client";

import { Typography } from "antd";

const { Title, Paragraph: AntParagraph, Text } = Typography;

export default function AntTypographyBlock({ variant = "title", level = 3, title = "Title", paragraph = "", text = "" }) {
  if (variant === "paragraph") {
    return <AntParagraph>{paragraph || "Paragraph text"}</AntParagraph>;
  }
  if (variant === "text") {
    return <Text>{text || "Text"}</Text>;
  }
  return <Title level={Number(level) || 3}>{title || "Title"}</Title>;
}
