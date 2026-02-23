"use client";

import ComponentRenderer from "@/components/cms/ComponentRenderer";

/**
 * Section (container) block: wraps inner UI elements (text, image, icons, etc.)
 * props.layout = array of blocks; props.backgroundColor, props.padding for styling.
 */
export default function SectionBlock({ layout = [], backgroundColor, padding }) {
  const innerLayout = Array.isArray(layout) ? layout : [];
  const style = {};
  if (backgroundColor) style.backgroundColor = backgroundColor;
  if (padding) style.padding = padding;

  return (
    <section style={{ ...style, marginBottom: "1.5rem" }} className="cms-section-block">
      <ComponentRenderer layout={innerLayout} />
    </section>
  );
}
