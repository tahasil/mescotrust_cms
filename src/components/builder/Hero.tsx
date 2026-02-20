type HeroProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function Hero({ title = "Welcome", subtitle = "", className = "" }: HeroProps) {
  return (
    <section className={`py-16 text-center ${className}`}>
      <h1 className="text-4xl font-bold">{title}</h1>
      {subtitle && <p className="mt-4 text-xl text-gray-600">{subtitle}</p>}
    </section>
  );
}
