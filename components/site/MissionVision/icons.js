"use client";

const sharedProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  focusable: "false",
  "aria-hidden": "true",
};

export function MedicalAidDispensaryIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M8.5 7V5.2c0-.66.54-1.2 1.2-1.2h4.6c.66 0 1.2.54 1.2 1.2V7" />
      <rect x="3.5" y="7" width="17" height="13" rx="1.7" />
      <path d="M12 10.5v6M9 13.5h6" />
    </svg>
  );
}

export function CharitablePhysiotherapyIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="4.2" r="2.1" />
      <path d="M12 6.7v7.1M5 8.6l7 3.2 7-3.2M12 13.8l-4.2 6.4M12 13.8l4.2 6.4" />
    </svg>
  );
}
