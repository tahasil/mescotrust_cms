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

export function CelebrationsMilestonesIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4.2 19.8 8.6 9.4l6 6-10.4 4.4Z" />
      <path d="m8.6 9.4 6 6M12.2 7.1l1.1-3M16.1 9.2l3-1.2M15.3 5.3l1.8-1.8M18.2 12.3l2.5.4" />
      <path d="M8 12.2c1.2.5 2.3 1.6 2.8 2.8M6.5 15.5c.8.3 1.4.9 1.7 1.7" />
    </svg>
  );
}

export function GuidanceMotivationIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <rect x="4" y="3.5" width="16" height="14" rx="1.3" />
      <circle cx="12" cy="9.2" r="2.5" />
      <path d="M7.7 16.8v-1.2c0-1.7 1.9-3 4.3-3s4.3 1.3 4.3 3v1.2M8.2 20.5l3.8-3 3.8 3" />
    </svg>
  );
}

export function SportsFacilitiesIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6.2c2.8 1.2 4.3 3.2 4.4 5.8.1 2.6-1.3 4.6-4.1 5.9M18 6.2c-2.8 1.2-4.3 3.2-4.4 5.8-.1 2.6 1.3 4.6 4.1 5.9M3.6 11.2c3.1-.3 5.8.5 8.1 2.4 2.3 1.9 5.1 2.7 8.7 2.2M3.7 14.8c3.6-.5 6.4-2 8.3-4.4 1.9-2.4 4.7-3.9 8.3-4.1" />
    </svg>
  );
}

export function SaturdayActivitiesIcon(props) {
  return (
    <svg {...sharedProps} {...props}>
      <path d="M4 19.8c2.4-4.1 5.3-6.2 8.7-6.2 1.2 0 2.1-.9 2.1-2.1 0-1.3 1-2.4 2.3-2.4h2.2" />
      <path d="M7.2 17.7c0-3.8 1.7-6.2 5.1-7.1 1.2-.3 2-1.4 2-2.6 0-1.5 1.2-2.7 2.7-2.7h2.5" />
      <path d="M4 19.8h5.8M17.3 5.3l2.2-2.2" />
    </svg>
  );
}
