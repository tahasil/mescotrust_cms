import CardBlock from "./Card";

export default function CardGridBlock({ cards = [], columns = 3, gap = 24 }) {
  const items = Array.isArray(cards) ? cards : [];
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 4);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: Number(gap) || 24,
        margin: "1.5rem 0",
      }}
    >
      {items.map((card, i) => (
        <CardBlock key={i} variant="shadow" {...card} />
      ))}
    </div>
  );
}
