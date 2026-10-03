import React from 'react';

interface NutrientProgressBarProps {
  label: string;
  unit: string;
  currentValue: number;
  goalValue: number | null | undefined;
  isLimit?: boolean;
  indent?: number; // 0, 1, or 2
}

export const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
  label,
  unit,
  currentValue,
  goalValue,
  isLimit = false,
  indent = 0
}) => {
  const hasGoal = goalValue !== null && goalValue !== undefined && goalValue > 0;
  const rawFormatted = (Math.round(currentValue * 10) / 10).toString();
  const goalFormatted = hasGoal ? (Math.round(goalValue! * 10) / 10).toString() : '';

  const percentage = hasGoal ? Math.round((currentValue / goalValue!) * 100) : 0;
  const isOver = hasGoal && currentValue > goalValue!;

  // Dynamic bar colors
  let barColor = 'bg-emerald-500';
  if (isLimit) {
    if (isOver) {
      barColor = 'bg-red-500';
    } else if (percentage >= 80) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-neutral-600';
    }
  } else {
    if (percentage >= 100) {
      barColor = 'bg-emerald-600';
    } else if (percentage >= 50) {
      barColor = 'bg-emerald-500';
    } else {
      barColor = 'bg-emerald-400';
    }
  }

  const fillWidth = hasGoal ? Math.min(percentage, 100) : 0;

  return (
    <div
      className="py-2.5 transition-colors"
      style={{ paddingLeft: `${indent * 1.5}rem` }}
    >
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm gap-2 mb-1.5">
        {/* Nutrient Name and Unit */}
        <div className="flex items-center gap-1.5 font-medium text-neutral-800">
          {indent > 0 && (
            <span className="text-neutral-400 font-mono text-xs select-none">↳</span>
          )}
          <span>{label}</span>
          <span className="text-xs text-neutral-500 font-mono">({unit})</span>
          {isLimit && (
            <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
              Limit
            </span>
          )}
        </div>

        {/* Values and Percentage */}
        <div className="text-xs tabular-nums font-mono flex items-center gap-1.5">
          <span className="font-semibold text-neutral-900">
            {rawFormatted} {unit}
          </span>

          {hasGoal ? (
            <>
              <span className="text-neutral-400">/</span>
              <span className="text-neutral-500">
                {goalFormatted} {unit}
              </span>
              <span
                className={`font-semibold ml-1 ${
                  isLimit && isOver
                    ? 'text-red-600 font-bold'
                    : isLimit && percentage >= 80
                    ? 'text-amber-600'
                    : 'text-neutral-700'
                }`}
              >
                ({percentage}%)
              </span>
            </>
          ) : (
            <span className="text-neutral-400 text-xs italic">
              (No goal set)
            </span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      {hasGoal && (
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      )}
    </div>
  );
};
