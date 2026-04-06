import NextImage from "next/image";
import Link from "next/link";

export default function CardBlock({
  image,
  imageAlt = "",
  title,
  description,
  linkUrl,
  linkLabel = "Read more",
  variant = "default",
}) {
  const isExternal = linkUrl?.startsWith("http");

  const cardStyle = {
    borderRadius: 8,
    overflow: "hidden",
    background: variant === "bordered" ? "#fff" : "#f8f9fa",
    border: variant === "bordered" ? "1px solid #e8e8e8" : "none",
    boxShadow: variant === "shadow" ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
    transition: "box-shadow 0.2s, transform 0.2s",
  };

  const LinkTag = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href: linkUrl, target: "_blank", rel: "noopener noreferrer" }
    : { href: linkUrl || "#" };

  return (
    <div style={cardStyle}>
      {image && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
          <NextImage loading="lazy"
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{ padding: "1.25rem" }}>
        {title && <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>{title}</h3>}
        {description && <p style={{ margin: "0 0 1rem", color: "#555", fontSize: "0.95rem", lineHeight: 1.6 }}>{description}</p>}
        {linkUrl && (
          <LinkTag
            {...linkProps}
            style={{
              color: "var(--primary-color, #1890ff)",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            {linkLabel} &rarr;
          </LinkTag>
        )}
      </div>
    </div>
  );
}
