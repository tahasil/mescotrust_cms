import SafeHtml from "@/components/cms/SafeHtml";

export default function ListBlock({ items = [], ordered = false }) {
  if (!items || items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag style={{ marginBottom: "1em", paddingInlineStart: "1.5em" }}>
      {items.map((item, i) => (
        <li key={i}>
          {/<[a-z][\s\S]*>/i.test(item) ? <SafeHtml html={item} /> : item}
        </li>
      ))}
    </Tag>
  );
}
