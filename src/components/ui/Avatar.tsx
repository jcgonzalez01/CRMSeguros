const TONES = [
  "bg-blue-50 text-blue-700",
  "bg-success-50 text-success-700",
  "bg-warning-50 text-warning-700",
  "bg-violet-50 text-violet-700",
  "bg-pink-50 text-pink-700",
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

export function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-[13px]",
  lg: "h-10 w-10 text-sm",
  xl: "h-16 w-16 text-[22px]",
};

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        TONES[hash(name) % TONES.length],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {initialsOf(name)}
    </span>
  );
}
