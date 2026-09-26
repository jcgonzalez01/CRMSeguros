/*
 * Tabla basada en grid: cada fila recibe la misma clase `cols`
 * (p. ej. "grid-cols-[44px_minmax(0,2fr)_120px]"), declarada como constante
 * estática por vista para que Tailwind la detecte.
 */
export function Table({
  label,
  minWidth = "min-w-[880px]",
  children,
}: {
  label: string;
  minWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div role="table" aria-label={label} className={minWidth}>
        {children}
      </div>
    </div>
  );
}

export function TableHeader({
  cols,
  children,
}: {
  cols: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="row"
      className={`grid ${cols} items-center gap-4 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600`}
    >
      {children}
    </div>
  );
}

export function TableRow({
  cols,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { cols: string }) {
  return (
    <div
      role="row"
      className={[
        `grid ${cols} items-center gap-4 border-t border-gray-100 px-5 py-3.5 text-sm`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function TableHead({
  className,
  children,
  srOnly,
}: {
  className?: string;
  children: React.ReactNode;
  srOnly?: boolean;
}) {
  return (
    <span role="columnheader" className={className}>
      {srOnly ? <span className="sr-only">{children}</span> : children}
    </span>
  );
}

export function TableCell({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="cell" className={["min-w-0", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function TableMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-600">
      {children}
    </div>
  );
}
