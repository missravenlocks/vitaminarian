"use client";

import ProgressBar from "./ProgressBar";
import type { FoodInfoData, NutrientTotals } from "@/lib/types";
import { EXCLUDED_FROM_MICRONUTRIENTS, LIMIT_NUTRIENTS } from "@/lib/types";

interface MicronutrientDashboardProps {
  totals: NutrientTotals;
  foodInfo: FoodInfoData;
}

export default function MicronutrientDashboard({
  totals,
  foodInfo,
}: MicronutrientDashboardProps) {
  const microNutrients = foodInfo.nutrients.filter(
    (n) => !EXCLUDED_FROM_MICRONUTRIENTS.has(n.metadataName)
  );

  const ordered = foodInfo.headers
    .slice(1)
    .map((h) => microNutrients.find((m) => m.header === h))
    .filter(Boolean);

  if (ordered.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900">
        Micronutrient Dashboard
      </h3>
      <div className="space-y-3">
        {ordered.map((nutrient) => {
          if (!nutrient) return null;
          const val = totals[nutrient.header] ?? 0;
          const goal = foodInfo.dailyValues[nutrient.header] ?? 0;
          return (
            <ProgressBar
              key={nutrient.header}
              label={nutrient.metadataName}
              value={val}
              goal={goal}
              unit={nutrient.unit}
              isLimit={LIMIT_NUTRIENTS.has(nutrient.metadataName)}
            />
          );
        })}
      </div>
    </div>
  );
}
