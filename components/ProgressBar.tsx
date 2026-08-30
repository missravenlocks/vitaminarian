"use client";

interface ProgressBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  isLimit?: boolean;
  indent?: number;
}

export default function ProgressBar({
  label,
  value,
  goal,
  unit,
  isLimit = false,
  indent = 0,
}: ProgressBarProps) {
  const hasGoal = goal > 0;
  const percentage = hasGoal ? Math.min((value / goal) * 100, 100) : 0;
  const displayValue = Math.round(value * 10) / 10;

  const barColor = isLimit
    ? percentage > 100
      ? "bg-red-500"
      : "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div style={{ paddingLeft: indent * 24 }} className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">
          {displayValue} {unit}
          {hasGoal && (
            <span className="ml-1 text-slate-400">
              ({Math.round(percentage)}%)
            </span>
          )}
        </span>
      </div>
      {hasGoal && (
        <div className="h-2.5 overflow-hidden rounded-2xl bg-emerald-100">
          <div
            className={`h-full rounded-2xl transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
