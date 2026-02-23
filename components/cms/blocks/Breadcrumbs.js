import Link from "next/link";

export default function BreadcrumbsBlock({ items = [], separator = "/" }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "1em", fontSize: "0.9em" }}>
      <ol style={{ display: "flex", flexWrap: "wrap", listStyle: "none", padding: 0, margin: 0, gap: "0.25em" }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.25em" }}>
              {isLast || !item.url ? (
                <span style={{ color: "#666" }}>{item.label || item}</span>
              ) : (
                <Link href={item.url} style={{ color: "var(--primary-color, #1890ff)", textDecoration: "none" }}>
                  {item.label || item}
                </Link>
              )}
              {!isLast && <span style={{ color: "#999", marginInline: "0.25em" }}>{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
