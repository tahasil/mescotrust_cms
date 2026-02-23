import Link from "next/link";

export default function CallToActionBlock({
  heading,
  text,
  buttonLabel = "Learn more",
  buttonUrl = "#",
  buttonVariant = "solid",
  align = "center",
}) {
  const isExternal = buttonUrl?.startsWith("http");

  const btnStyle = {
    display: "inline-block",
    padding: "0.6em 1.5em",
    borderRadius: 6,
    fontWeight: 500,
    textDecoration: "none",
    fontSize: "1em",
    ...(buttonVariant === "outline"
      ? {
          border: "2px solid var(--primary-color, #1890ff)",
          color: "var(--primary-color, #1890ff)",
          background: "transparent",
        }
      : {
          background: "var(--primary-color, #1890ff)",
          color: "#fff",
          border: "none",
        }),
  };

  return (
    <section
      style={{
        textAlign: align,
        padding: "2em",
        marginBottom: "1em",
        background: "#f8f9fa",
        borderRadius: 8,
      }}
    >
      {heading && <h2 style={{ marginBottom: "0.5em" }}>{heading}</h2>}
      {text && <p style={{ marginBottom: "1em", color: "#555", maxWidth: 600, marginInline: align === "center" ? "auto" : undefined }}>{text}</p>}
      {buttonLabel && (
        isExternal ? (
          <a href={buttonUrl} style={btnStyle} target="_blank" rel="noopener noreferrer">{buttonLabel}</a>
        ) : (
          <Link href={buttonUrl || "#"} style={btnStyle}>{buttonLabel}</Link>
        )
      )}
    </section>
  );
}
