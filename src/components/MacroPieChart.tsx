import React, { useState } from 'react';

interface MacroPieChartProps {
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
}

export const MacroPieChart: React.FC<MacroPieChartProps> = ({
  carbsGrams,
  proteinGrams,
  fatGrams,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const carbsKcal = Math.max(0, carbsGrams) * 4;
  const proteinKcal = Math.max(0, proteinGrams) * 4;
  const fatKcal = Math.max(0, fatGrams) * 9;
  const totalKcal = carbsKcal + proteinKcal + fatKcal;

  const data = [
    {
      name: 'Carbohydrates',
      grams: carbsGrams,
      kcal: carbsKcal,
      color: '#3b82f6', // blue-500
      hoverColor: '#2563eb',
      lightColor: '#eff6ff',
      percent: totalKcal > 0 ? (carbsKcal / totalKcal) * 100 : 0,
    },
    {
      name: 'Protein',
      grams: proteinGrams,
      kcal: proteinKcal,
      color: '#10b981', // emerald-500
      hoverColor: '#059669',
      lightColor: '#ecfdf5',
      percent: totalKcal > 0 ? (proteinKcal / totalKcal) * 100 : 0,
    },
    {
      name: 'Fat',
      grams: fatGrams,
      kcal: fatKcal,
      color: '#f59e0b', // amber-500
      hoverColor: '#d97706',
      lightColor: '#fffbeb',
      percent: totalKcal > 0 ? (fatKcal / totalKcal) * 100 : 0,
    },
  ];

  // SVG Pie chart calculation
  const radius = 70;
  const center = 100;
  let accumulatedAngle = -90; // start at top

  const slices = data.map((d, idx) => {
    const angle = totalKcal > 0 ? (d.kcal / totalKcal) * 360 : 120;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData =
      totalKcal > 0
        ? `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
        : '';

    return {
      ...d,
      pathData,
      isFullCircle: angle >= 359.9,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* SVG Pie */}
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        {totalKcal === 0 ? (
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium text-center p-4">
            No macronutrients logged
          </div>
        ) : (
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xs">
            {slices.map((slice, index) => {
              if (slice.kcal <= 0) return null;
              if (slice.isFullCircle) {
                return (
                  <circle
                    key={slice.name}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={hoveredIndex === index ? slice.hoverColor : slice.color}
                    className="transition-colors duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              }
              return (
                <path
                  key={slice.name}
                  d={slice.pathData}
                  fill={hoveredIndex === index ? slice.hoverColor : slice.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
            {/* Center inner donut circle for modern look */}
            <circle cx={center} cy={center} r={38} fill="#ffffff" />
            <text
              x={center}
              y={center - 4}
              textAnchor="middle"
              className="text-[11px] font-bold fill-slate-800"
            >
              {Math.round(totalKcal)}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="text-[9px] font-semibold fill-slate-400 uppercase tracking-wider"
            >
              Macro kcal
            </text>
          </svg>
        )}
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 w-full max-w-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Calorie Proportions
        </h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2.5 rounded-xl border transition-all ${
                hoveredIndex === index
                  ? 'border-slate-300 bg-slate-50 shadow-2xs'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pl-5">
                <span>{item.grams.toFixed(1)} g</span>
                <span>{Math.round(item.kcal)} kcal</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
