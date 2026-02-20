export default function HeadingBlock({ level = 2, text }) {
  if (!text) return null;
  const Tag = level >= 1 && level <= 6 ? `h${level}` : "h2";
  return <Tag style={{ marginBottom: "0.5em" }}>{text}</Tag>;
}
