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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {delta !== null && (
          <span
            className={`text-xs font-medium ${
              subiendo ? "text-green-600" : bajando ? "text-red-600" : "text-gray-400"
            }`}
          >
            {subiendo ? "▲" : bajando ? "▼" : "—"} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">vs. mes anterior</p>
    </div>
  );
}
