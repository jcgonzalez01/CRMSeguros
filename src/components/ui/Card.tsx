export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={[
        "rounded-[14px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  id,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <h2 id={id} className="text-[15px] font-semibold text-gray-900">
        {title}
      </h2>
      {action}
    </div>
  );
}
