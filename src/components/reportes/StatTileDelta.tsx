import { Icon } from "@/components/ui/Icon";

function calcularDelta(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? null : null; // sin base para %, se omite
  return ((actual - anterior) / anterior) * 100;
}

export function StatTileDelta({
  label,
  value,
  actual,
  anterior,
}: {
  label: string;
  value: string;
  actual: number;
  anterior: number;
}) {
  const delta = calcularDelta(actual, anterior);
  const subiendo = delta !== null && delta > 0;
  const bajando = delta !== null && delta < 0;

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-gray-200 bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[13px] font-medium text-gray-600">{label}</p>
      <p className="text-[26px] font-semibold leading-tight tracking-tight tabular-nums text-gray-900">
        {value}
      </p>
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-[3px] rounded-full px-2 py-0.5 font-semibold ${
              subiendo
                ? "bg-success-50 text-success-700"
                : bajando
                  ? "bg-danger-50 text-danger-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {(subiendo || bajando) && (
              <Icon name={subiendo ? "arrowUp" : "arrowDown"} size={11} strokeWidth={3} />
            )}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        vs. mes anterior
      </p>
    </div>
  );
}
