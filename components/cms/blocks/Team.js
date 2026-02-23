import NextImage from "next/image";

export default function TeamBlock({ members = [], columns = 3 }) {
  const list = Array.isArray(members) ? members : [];
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 4);

  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1.5rem",
        margin: "1.5rem 0",
      }}
    >
      {list.map((member, i) => (
        <div
          key={i}
          style={{
            textAlign: "center",
            padding: "1.5rem",
            borderRadius: 8,
            background: "#f8f9fa",
          }}
        >
          {member.avatar && (
            <NextImage
              src={member.avatar}
              alt={member.name || ""}
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 1rem",
                display: "block",
              }}
            />
          )}
          {member.name && <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>{member.name}</h4>}
          {member.role && <div style={{ color: "var(--primary-color, #1890ff)", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem" }}>{member.role}</div>}
          {member.bio && <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{member.bio}</p>}
          {Array.isArray(member.socials) && member.socials.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
              {member.socials.map((s, j) => (
                <a
                  key={j}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#888", textDecoration: "none", fontSize: "0.9rem" }}
                >
                  {s.label || s.platform || "Link"}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
