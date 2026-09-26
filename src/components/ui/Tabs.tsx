export function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-7 border-b border-gray-200"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`-mb-px border-b-2 px-0.5 pb-3 pt-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              active
                ? "border-blue-600 font-semibold text-blue-700"
                : "border-transparent font-medium text-gray-600 hover:text-gray-900"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string | number>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-[10px] bg-gray-200 p-[3px]"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={String(item.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={`h-8 rounded-lg px-3.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              active
                ? "bg-white font-semibold text-gray-900 shadow-sm"
                : "font-medium text-gray-600 hover:text-gray-900"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
