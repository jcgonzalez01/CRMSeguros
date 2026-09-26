const FIELD =
  "h-10 rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60";

function fieldClass(fullWidth: boolean, extra?: string, multiline = false) {
  return [fullWidth ? "w-full" : "", FIELD, multiline ? "h-auto py-2" : "", extra]
    .filter(Boolean)
    .join(" ");
}

export function Input({
  fullWidth = true,
  className,
  ...props
}: React.ComponentProps<"input"> & { fullWidth?: boolean }) {
  return <input className={fieldClass(fullWidth, className)} {...props} />;
}

export function Select({
  fullWidth = true,
  className,
  ...props
}: React.ComponentProps<"select"> & { fullWidth?: boolean }) {
  return <select className={fieldClass(fullWidth, className)} {...props} />;
}

export function Textarea({
  fullWidth = true,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { fullWidth?: boolean }) {
  return <textarea className={fieldClass(fullWidth, className, true)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={["mb-1.5 block text-sm font-medium text-gray-700", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
