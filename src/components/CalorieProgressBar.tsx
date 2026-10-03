import React from 'react';
import { Flame } from 'lucide-react';

interface CalorieProgressBarProps {
  currentCalories: number;
  goalCalories: number | null | undefined;
}

export const CalorieProgressBar: React.FC<CalorieProgressBarProps> = ({
  currentCalories,
  goalCalories
}) => {
  const hasGoal = goalCalories !== null && goalCalories !== undefined && goalCalories > 0;
  const currentFormatted = Math.round(currentCalories).toString();
  const goalFormatted = hasGoal ? Math.round(goalCalories!).toString() : '';

  const percentage = hasGoal ? Math.round((currentCalories / goalCalories!) * 100) : 0;
  const fillWidth = hasGoal ? Math.min(percentage, 100) : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 leading-tight">
              Calorie Intake
            </h3>
            <p className="text-xs text-neutral-500">
              Daily energy balance
            </p>
          </div>
        </div>

        <div className="text-right font-mono tabular-nums">
          <div className="text-lg font-bold text-neutral-900">
            {currentFormatted}{' '}
            <span className="text-xs font-normal text-neutral-500">kcal</span>
            {hasGoal && (
              <span className="text-sm font-normal text-neutral-400">
                {' '}/ {goalFormatted} kcal
              </span>
            )}
          </div>
          {hasGoal ? (
            <div className="text-xs font-semibold text-emerald-700">
              {percentage}% of daily goal
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              No daily calorie goal configured
            </div>
          )}
        </div>
      </div>

      {hasGoal && (
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 105 ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      )}
    </div>
  );
};
