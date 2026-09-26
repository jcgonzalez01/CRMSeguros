export type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-gray-300 bg-gray-100 text-gray-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-success-200 bg-success-50 text-success-700",
  amber: "border-warning-200 bg-warning-50 text-warning-700",
  red: "border-danger-200 bg-danger-50 text-danger-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function badgeClasses(tone: BadgeTone = "neutral", className?: string) {
  return [
    "inline-flex h-[26px] items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold",
    TONES[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: BadgeTone }) {
  return <span className={badgeClasses(tone, className)} {...props} />;
}
