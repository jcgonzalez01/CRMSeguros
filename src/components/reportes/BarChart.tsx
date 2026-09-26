"use client";

import { useState } from "react";

export interface BarChartDatum {
  label: string;
  value: number;
}

// Rounds up to a "clean" scale max (1/2/5 × 10^n) so the guide lines fall on
// round values instead of an arbitrary max like 8,214.
function niceMax(max: number) {
  if (max <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export function BarChart({
  data,
  color,
  formatValue,
}: {
  data: BarChartDatum[];
  color: string;
  formatValue: (value: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const guides = [0.25, 0.5, 0.75, 1];
  const lastIndex = data.length - 1;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative h-[150px] border-b border-gray-200">
        {guides.map((g) => (
          <div
            key={g}
            aria-hidden="true"
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ bottom: `${g * 100}%` }}
          />
        ))}

        <div className="absolute inset-0 flex items-end gap-2">
          {data.map((d, i) => (
            <div
              key={d.label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              <div
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${formatValue(d.value)}`}
                className="w-full max-w-10 rounded-t transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  height: `${max > 0 ? (d.value / max) * 100 : 0}%`,
                  minHeight: d.value > 0 ? 2 : 0,
                  backgroundColor: color,
                  opacity:
                    hovered === null
                      ? i === lastIndex
                        ? 1
                        : 0.72
                      : hovered === i
                        ? 1
                        : 0.35,
                }}
              />
            </div>
          ))}
        </div>

        {hovered !== null && data[hovered] && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{
              left: `${((hovered + 0.5) / data.length) * 100}%`,
              bottom: `calc(${max > 0 ? (data[hovered].value / max) * 100 : 0}% + 10px)`,
            }}
          >
            <div className="font-semibold">{formatValue(data[hovered].value)}</div>
            <div className="text-gray-300">{data[hovered].label}</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="min-w-0 flex-1 truncate text-center text-[11px] text-gray-600"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
