import React, { useState } from 'react';

interface MacroPieChartProps {
  fatGrams: number;
  carbGrams: number;
  proteinGrams: number;
}

export const MacroPieChart: React.FC<MacroPieChartProps> = ({
  fatGrams,
  carbGrams,
  proteinGrams
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fatCals = fatGrams * 9;
  const carbCals = carbGrams * 4;
  const proteinCals = proteinGrams * 4;
  const totalCals = fatCals + carbCals + proteinCals;

  const data = [
    {
      name: 'Carbohydrates',
      grams: carbGrams,
      cals: carbCals,
      color: '#F59E0B',
      hoverColor: '#D97706'
    },
    {
      name: 'Protein',
      grams: proteinGrams,
      cals: proteinCals,
      color: '#3B82F6',
      hoverColor: '#2563EB'
    },
    {
      name: 'Fat',
      grams: fatGrams,
      cals: fatCals,
      color: '#10B981',
      hoverColor: '#059669'
    }
  ];

  // SVG dimensions
  const size = 180;
  const center = size / 2;
  const radius = 64;
  const strokeWidth = 28;

  if (totalCals <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 rounded-lg h-full text-center">
        <div className="w-28 h-28 rounded-full border-4 border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 text-xs font-mono">
          0 kcal
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          No macronutrients logged for this selection
        </p>
      </div>
    );
  }

  // Calculate SVG arc paths using stroke-dasharray and stroke-dashoffset
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const slices = data.map((item, index) => {
    const fraction = item.cals / totalCals;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;
    const percentage = Math.round(fraction * 100);

    return {
      ...item,
      fraction,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      index
    };
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col sm:flex-row items-center gap-6 justify-around">
      {/* SVG Donut */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => (
            <circle
              key={slice.name}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={hoveredIndex === slice.index ? slice.hoverColor : slice.color}
              strokeWidth={hoveredIndex === slice.index ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xs text-neutral-400 font-medium">Macro Energy</span>
          <span className="text-base font-bold text-neutral-900 tabular-nums">
            {Math.round(totalCals)}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">kcal</span>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
          Caloric Proportions
        </h4>
        {slices.map((slice) => (
          <div
            key={slice.name}
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer ${
              hoveredIndex === slice.index ? 'bg-neutral-100' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-sm font-semibold text-neutral-800">
                {slice.name}
              </span>
            </div>
            <div className="text-right tabular-nums text-xs">
              <span className="font-bold text-neutral-900">
                {slice.percentage}%
              </span>
              <span className="text-neutral-400 mx-1">·</span>
              <span className="text-neutral-600">
                {Math.round(slice.grams * 10) / 10}g
              </span>
              <span className="text-neutral-400 ml-1">
                ({Math.round(slice.cals)} kcal)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
