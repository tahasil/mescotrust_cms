import SafeHtml from "@/components/cms/SafeHtml";

export default function ListBlock({ items = [], ordered = false, color }) {
  if (!items || items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";

  const style = { marginBottom: "1em", paddingInlineStart: "1.5em" };
  if (color) style.color = color;

  return (
    <Tag style={style}>
      {items.map((item, i) => (
        <li key={i}>
          {/<[a-z][\s\S]*>/i.test(item) ? <SafeHtml html={item} /> : item}
        </li>
      ))}
    </Tag>
  );
}
