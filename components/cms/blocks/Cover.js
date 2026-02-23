import NextImage from "next/image";

export default function CoverBlock({
  src,
  alt,
  overlayColor = "rgba(0,0,0,0.45)",
  heading,
  text,
  minHeight = 300,
}) {
  if (!src) return null;

  return (
    <div
      style={{
        position: "relative",
        minHeight: Number(minHeight) || 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 6,
        marginBottom: "1em",
      }}
    >
      <NextImage
        src={src}
        alt={alt || ""}
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
        priority={false}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlayColor,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          color: "#fff",
          padding: "2em",
          maxWidth: 700,
        }}
      >
        {heading && <h2 style={{ marginBottom: "0.5em", fontSize: "2em" }}>{heading}</h2>}
        {text && <p style={{ fontSize: "1.1em", opacity: 0.9 }}>{text}</p>}
      </div>
    </div>
  );
}
