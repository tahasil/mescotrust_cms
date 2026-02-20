import ParagraphBlock from "@/components/cms/blocks/Paragraph";
import HeadingBlock from "@/components/cms/blocks/Heading";
import ImageBlock from "@/components/cms/blocks/Image";

const COMPONENT_MAP = {
  Paragraph: ParagraphBlock,
  Heading: HeadingBlock,
  Image: ImageBlock,
};

function UnavailableBlock({ baseComponent }) {
  return (
    <div style={{ padding: "1rem", background: "#f5f5f5", color: "#666", borderRadius: 4 }}>
      Unavailable block: {baseComponent || "unknown"}
    </div>
  );
}

export default function ComponentRenderer({ layout }) {
  if (!Array.isArray(layout) || layout.length === 0) return null;

  const sorted = [...layout].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="cms-layout">
      {sorted.map((block) => {
        const baseComponent =
          block.baseComponent ||
          (block.componentId && typeof block.componentId === "object" && block.componentId.baseComponent) ||
          "Paragraph";
        const Component = COMPONENT_MAP[baseComponent];
        const props = block.props || {};
        const key = block.instanceId || block._id?.toString() || Math.random().toString(36);

        if (!Component) {
          return <UnavailableBlock key={key} baseComponent={baseComponent} />;
        }

        return <Component key={key} {...props} />;
      })}
    </div>
  );
}
