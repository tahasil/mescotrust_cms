import Link from "next/link";

type ButtonsProps = {
  primaryLabel?: string;
  primaryUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  className?: string;
};

export function Buttons({
  primaryLabel = "Primary",
  primaryUrl = "#",
  secondaryLabel,
  secondaryUrl = "#",
  className = "",
}: ButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <Link
        href={primaryUrl}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {primaryLabel}
      </Link>
      {secondaryLabel && (
        <Link
          href={secondaryUrl}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}
