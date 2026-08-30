"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ProgressBar from "./ProgressBar";
import type { FoodInfoData, NutrientTotals } from "@/lib/types";
import {
  EXCLUDED_FROM_MICRONUTRIENTS,
  LIMIT_NUTRIENTS,
  MACRONUTRIENT_NAMES,
} from "@/lib/types";
import { getMacroCalories } from "@/lib/nutrients";

interface MacronutrientDashboardProps {
  totals: NutrientTotals;
  foodInfo: FoodInfoData;
}

const MACRO_COLORS = ["#10B981", "#059669", "#047857"];

function getIndent(metadataName: string): number {
  if (metadataName === "Saturated Fat" || metadataName === "Trans Fat") return 1;
  if (metadataName === "Dietary Fiber" || metadataName === "Sugars") return 1;
  if (metadataName === "Added Sugars") return 2;
  return 0;
}

export default function MacronutrientDashboard({
  totals,
  foodInfo,
}: MacronutrientDashboardProps) {
  const macros = getMacroCalories(totals, foodInfo);
  const pieData = [
    { name: "Carbohydrates", value: macros.carbs },
    { name: "Protein", value: macros.protein },
    { name: "Fat", value: macros.fat },
  ].filter((d) => d.value > 0);

  const macroHeaders = foodInfo.nutrients.filter((n) =>
    MACRONUTRIENT_NAMES.includes(
      n.metadataName as (typeof MACRONUTRIENT_NAMES)[number]
    )
  );

  const orderedMacros = foodInfo.headers
    .slice(1)
    .map((h) => macroHeaders.find((m) => m.header === h))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900">
        Macronutrient Dashboard
      </h3>

      {pieData.length > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${Math.round(Number(value))} kcal`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-600">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MACRO_COLORS[i] }}
                />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {orderedMacros.map((nutrient) => {
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
              indent={getIndent(nutrient.metadataName)}
            />
          );
        })}
      </div>
    </div>
  );
}
