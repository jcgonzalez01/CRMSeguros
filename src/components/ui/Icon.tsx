const PATHS = {
  pencil: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6",
  x: "M18 6L6 18 M6 6l12 12",
  arrowLeft: "M19 12H5 M12 19l-7-7 7-7",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M18 15l-6-6-6 6",
  chevronRight: "M9 6l6 6-6 6",
  check: "M20 6L9 17l-5-5",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  alert:
    "M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  arrowUp: "M12 19V5 M5 12l7-7 7 7",
  arrowDown: "M12 5v14 M19 12l-7 7-7-7",
  dashboard: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  building: "M4 21V3h10v18 M14 9h6v12 M8 7h2 M8 11h2 M8 15h2 M4 21h16",
  tasks:
    "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  chart: "M18 20V10 M12 20V4 M6 20v-6",
  sliders:
    "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function IconButton({
  icon,
  label,
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  icon: IconName;
  label: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50",
        tone === "danger"
          ? "text-danger-700 hover:bg-danger-50"
          : "text-gray-600 hover:bg-gray-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
