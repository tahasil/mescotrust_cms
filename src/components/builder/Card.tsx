type CardProps = {
  title?: string;
  body?: string;
  className?: string;
};

export function CardBlock({ title = "Card", body = "", className = "" }: CardProps) {
  return (
    <div className={`rounded border bg-white p-6 shadow-sm ${className}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      {body && <p className="mt-2 text-gray-600">{body}</p>}
    </div>
  );
}
