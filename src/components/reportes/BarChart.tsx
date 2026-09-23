"use client";

import { useState } from "react";

export interface BarChartDatum {
  label: string;
  value: number;
}

// Rounds up to a "clean" axis max (1/2/5 × 10^n) so ticks read as round
// numbers instead of an arbitrary max like 8,214.
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
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];

  return (
    <div className="relative">
      <div className="flex">
        {/* Y-axis ticks */}
        <div className="flex flex-col justify-between h-56 pr-2 text-right shrink-0">
          {ticks.map((tick) => (
            <span key={tick} className="text-xs text-gray-400 leading-none">
              {formatValue(tick)}
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="relative flex-1 h-56 border-l border-b border-gray-200">
          {/* Gridlines */}
          {ticks.slice(0, -1).map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-1 px-2">
            {data.map((d, i) => (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end h-full group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              >
                <div
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.label}: ${formatValue(d.value)}`}
                  className="w-full max-w-6 rounded-t transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{
                    height: `${max > 0 ? (d.value / max) * 100 : 0}%`,
                    minHeight: d.value > 0 ? 2 : 0,
                    backgroundColor: color,
                    opacity: hovered === null || hovered === i ? 1 : 0.35,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hovered !== null && data[hovered] && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg pointer-events-none z-10"
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
      </div>

      {/* X-axis labels */}
      <div className="flex pl-[3.25rem]">
        <div className="flex-1 flex gap-1 px-2 mt-1">
          {data.map((d) => (
            <span
              key={d.label}
              className="flex-1 text-center text-xs text-gray-400 truncate"
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
