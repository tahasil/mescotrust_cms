import SafeHtml from "@/components/cms/SafeHtml";

export default function ParagraphBlock({ text, color, align }) {
  if (!text) return null;

  const style = { marginBottom: "1em" };
  if (color) style.color = color;
  if (align) style.textAlign = align;

  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  if (isHtml) {
    return (
      <div style={style}>
        <SafeHtml html={text} />
      </div>
    );
  }
  return <p style={style}>{text}</p>;
}
