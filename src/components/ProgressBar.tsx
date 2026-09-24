import React from 'react';
import { formatQty } from '../utils/nutrition';

interface ProgressBarProps {
  label: string;
  currentValue: number;
  goalValue: number | null;
  unit: string;
  indent?: 0 | 1 | 2; // 0 = root, 1 = indented under Fat/Carbs, 2 = indented under Sugars
  isLimit?: boolean;  // e.g. Sodium or Trans Fat
  barColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  currentValue,
  goalValue,
  unit,
  indent = 0,
  isLimit = false,
  barColor,
}) => {
  const hasGoal = goalValue !== null && goalValue > 0;
  const percentage = hasGoal ? (currentValue / goalValue) * 100 : null;

  // Indentation styling
  const indentClass =
    indent === 1 ? 'ml-5 sm:ml-8 border-l-2 border-slate-200 pl-3' :
    indent === 2 ? 'ml-10 sm:ml-16 border-l-2 border-slate-200 pl-3' : '';

  // Determine progress bar fill percentage (clamped to 100% for visual width, but show real percentage in text)
  const clampedWidth = percentage !== null ? Math.min(Math.max(percentage, 0), 100) : 0;

  // Colors
  let fillColor = barColor || '#10b981'; // default emerald
  if (isLimit && percentage !== null) {
    if (percentage > 100) {
      fillColor = '#ef4444'; // red-500 exceeded limit
    } else if (percentage > 85) {
      fillColor = '#f59e0b'; // amber-500 near limit
    } else {
      fillColor = '#10b981';
    }
  }

  return (
    <div className={`py-2 ${indentClass}`}>
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{label}</span>
          {isLimit && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              Limit
            </span>
          )}
        </div>

        <div className="text-right text-xs sm:text-sm">
          {hasGoal ? (
            <span className="text-slate-700">
              <span className="font-bold text-slate-900">{formatQty(currentValue)}</span>
              <span className="text-slate-500"> / {formatQty(goalValue!)} {unit}</span>{' '}
              <span className="font-semibold text-slate-600">
                ({percentage!.toFixed(1)}%)
              </span>
            </span>
          ) : (
            <span className="font-bold text-slate-900">
              {formatQty(currentValue)} {unit}
            </span>
          )}
        </div>
      </div>

      {/* Bar container */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60">
        {hasGoal ? (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clampedWidth}%`,
              backgroundColor: fillColor,
            }}
          />
        ) : (
          <div className="h-full w-full bg-slate-200/50" />
        )}
      </div>
    </div>
  );
};
