export type ButtonVariant = "primary" | "secondary" | "danger" | "dangerOutline" | "ghost";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
  dangerOutline: "border border-danger-200 bg-white text-danger-700 hover:bg-danger-50",
  ghost: "text-gray-600 hover:bg-gray-100",
};

const SIZES: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
