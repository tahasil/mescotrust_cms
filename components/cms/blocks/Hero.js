import NextImage from "next/image";
import Link from "next/link";

export default function HeroBlock({
  backgroundImage,
  backgroundAlt = "",
  heading,
  subheading,
  buttonLabel,
  buttonUrl,
  buttonVariant = "solid",
  secondaryButtonLabel,
  secondaryButtonUrl,
  align = "center",
  minHeight = 500,
  overlayColor = "rgba(0,0,0,0.5)",
}) {
  const isExternal = (url) => url?.startsWith("http");

  const btnBase = {
    display: "inline-block",
    padding: "0.75em 2em",
    borderRadius: 6,
    fontWeight: 600,
    textDecoration: "none",
    fontSize: "1.05rem",
    transition: "opacity 0.2s",
  };

  const primaryBtn = {
    ...btnBase,
    background: buttonVariant === "outline" ? "transparent" : "#fff",
    color: buttonVariant === "outline" ? "#fff" : "#333",
    border: buttonVariant === "outline" ? "2px solid #fff" : "none",
  };

  const secondaryBtn = {
    ...btnBase,
    background: "transparent",
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.6)",
  };

  const renderLink = (url, style, label) => {
    if (!url || !label) return null;
    const Tag = isExternal(url) ? "a" : Link;
    const props = isExternal(url)
      ? { href: url, target: "_blank", rel: "noopener noreferrer" }
      : { href: url };
    return <Tag {...props} style={style}>{label}</Tag>;
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: Number(minHeight) || 500,
        display: "flex",
        alignItems: "center",
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        overflow: "hidden",
        marginBottom: "1em",
      }}
    >
      {backgroundImage && (
        <NextImage
          src={backgroundImage}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          priority
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: overlayColor }} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: align,
          color: "#fff",
          padding: "3em 2em",
          maxWidth: 800,
          width: "100%",
        }}
      >
        {heading && (
          <h1 style={{ fontSize: "2.75rem", fontWeight: 700, marginBottom: "0.5em", lineHeight: 1.2 }}>
            {heading}
          </h1>
        )}
        {subheading && (
          <p style={{ fontSize: "1.2rem", opacity: 0.9, marginBottom: "1.5em", lineHeight: 1.6 }}>
            {subheading}
          </p>
        )}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
          {renderLink(buttonUrl, primaryBtn, buttonLabel)}
          {renderLink(secondaryButtonUrl, secondaryBtn, secondaryButtonLabel)}
        </div>
      </div>
    </section>
  );
}
