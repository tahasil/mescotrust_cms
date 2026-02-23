import NextImage from "next/image";
import Link from "next/link";

const editableWrap = (onElementClick, elementKey, children, style = {}) => {
  if (!onElementClick || typeof onElementClick !== "function") return children;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onElementClick(elementKey); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onElementClick(elementKey); } }}
      style={{
        cursor: "pointer",
        outline: "2px dashed rgba(24, 144, 255, 0.5)",
        outlineOffset: 2,
        borderRadius: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

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
  onElementClick,
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

  const renderLink = (url, style, label, elementKey) => {
    if (!label) return null;
    const content = url ? (
      (() => {
        const Tag = isExternal(url) ? "a" : Link;
        const props = isExternal(url)
          ? { href: url, target: "_blank", rel: "noopener noreferrer" }
          : { href: url };
        return <Tag {...props} style={style}>{label}</Tag>;
      })()
    ) : (
      <span style={style}>{label}</span>
    );
    if (onElementClick && elementKey) {
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onElementClick(elementKey); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onElementClick(elementKey); } }}
          style={{ display: "inline-block", cursor: "pointer", outline: "2px dashed rgba(24, 144, 255, 0.5)", outlineOffset: 2, borderRadius: 4 }}
        >
          {content}
        </div>
      );
    }
    return content;
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
      {editableWrap(
        onElementClick,
        "background",
        <>
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
        </>,
        { position: "absolute", inset: 0 }
      )}
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
        {heading != null && heading !== "" ? (
          editableWrap(onElementClick, "heading", (
            <h1 style={{ fontSize: "2.75rem", fontWeight: 700, marginBottom: "0.5em", lineHeight: 1.2 }}>
              {heading}
            </h1>
          ))
        ) : onElementClick ? (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onElementClick("heading"); }}
            style={{ cursor: "pointer", outline: "2px dashed rgba(24, 144, 255, 0.5)", outlineOffset: 2, borderRadius: 4, minHeight: 48 }}
          >
            <h1 style={{ fontSize: "2.75rem", fontWeight: 700, marginBottom: "0.5em", lineHeight: 1.2, opacity: 0.7 }}>Heading</h1>
          </div>
        ) : null}
        {subheading != null && subheading !== "" ? (
          editableWrap(onElementClick, "subheading", (
            <p style={{ fontSize: "1.2rem", opacity: 0.9, marginBottom: "1.5em", lineHeight: 1.6 }}>
              {subheading}
            </p>
          ))
        ) : onElementClick ? (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onElementClick("subheading"); }}
            style={{ cursor: "pointer", outline: "2px dashed rgba(24, 144, 255, 0.5)", outlineOffset: 2, borderRadius: 4, minHeight: 32, marginBottom: "1.5em" }}
          >
            <p style={{ fontSize: "1.2rem", opacity: 0.7, lineHeight: 1.6 }}>Subheading</p>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
          {renderLink(buttonUrl, primaryBtn, buttonLabel, "primaryButton")}
          {renderLink(secondaryButtonUrl, secondaryBtn, secondaryButtonLabel, "secondaryButton")}
        </div>
      </div>
    </section>
  );
}
