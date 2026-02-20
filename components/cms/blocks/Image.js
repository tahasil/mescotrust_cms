export default function ImageBlock({ src, alt, width, height }) {
  if (!src) return null;
  return (
    <figure style={{ margin: "1em 0" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ""} width={width} height={height} style={{ maxWidth: "100%", height: "auto" }} />
      {alt && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{alt}</figcaption>}
    </figure>
  );
}
