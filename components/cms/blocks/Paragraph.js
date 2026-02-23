import SafeHtml from "@/components/cms/SafeHtml";

export default function ParagraphBlock({ text }) {
  if (!text) return null;
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  if (isHtml) {
    return (
      <div style={{ marginBottom: "1em" }}>
        <SafeHtml html={text} />
      </div>
    );
  }
  return <p style={{ marginBottom: "1em" }}>{text}</p>;
}
