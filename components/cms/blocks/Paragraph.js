export default function ParagraphBlock({ text }) {
  if (!text) return null;
  return <p style={{ marginBottom: "1em" }}>{text}</p>;
}
