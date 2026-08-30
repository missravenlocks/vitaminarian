"use client";

import SearchableDropdown from "./SearchableDropdown";
import FoodBreakdownTree from "./FoodBreakdownTree";
import MacronutrientDashboard from "./MacronutrientDashboard";
import MicronutrientDashboard from "./MicronutrientDashboard";
import {
  formatDisplayDate,
  fromInputDateValue,
  toInputDateValue,
} from "@/lib/dates";
import {
  buildFoodBreakdownTree,
  computeBreakdownNutrients,
  getCalorieGoal,
  isMealName,
} from "@/lib/nutrients";
import type {
  BreakdownSelection,
  FoodInfoData,
  FoodLogData,
  MealsData,
} from "@/lib/types";

interface NutrientBreakdownModuleProps {
  selection: BreakdownSelection;
  onSelectionChange: (selection: BreakdownSelection) => void;
  foodInfo: FoodInfoData;
  meals: MealsData;
  foodLog: FoodLogData;
  logDate: Date;
}

export default function NutrientBreakdownModule({
  selection,
  onSelectionChange,
  foodInfo,
  meals,
  foodLog,
  logDate,
}: NutrientBreakdownModuleProps) {
  const foodMap = new Map(foodInfo.foods.map((f) => [f.name, f]));
  const mealMap = new Map(meals.meals.map((m) => [m.name, m]));

  const foodOptions = foodInfo.foods.map((f) => ({
    value: f.name,
    label: f.name,
  }));
  const mealOptions = meals.meals.map((m) => ({
    value: m.name,
    label: m.name,
  }));

  const dropdownOptions = [
    { value: "foodLog", label: "Food Log" },
    {
      value: "specificItem",
      label: "Specific Item",
      children: [...foodOptions, ...mealOptions].sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    },
  ];

  const dropdownValue =
    selection.type === "foodLog" ? "foodLog" : selection.name;

  const handleDropdownChange = (value: string) => {
    if (value === "foodLog") {
      onSelectionChange({ type: "foodLog", date: logDate });
    } else {
      const meal = isMealName(value, foodMap, mealMap);
      onSelectionChange({
        type: "item",
        name: value,
        quantity: 1,
        unit: meal ? "servings" : "g",
      });
    }
  };

  const itemQuantity =
    selection.type === "item" ? String(selection.quantity) : "100";
  const itemUnit = selection.type === "item" ? selection.unit : "g";
  const isItemMeal =
    selection.type === "item"
      ? isMealName(selection.name, foodMap, mealMap)
      : false;

  const totals = computeBreakdownNutrients(
    selection,
    foodInfo,
    meals,
    foodLog
  );
  const calorieGoal = getCalorieGoal(foodInfo);
  const calHeader = foodInfo.headers.find((h) => h.startsWith("Calories"));
  const currentCalories = calHeader ? totals[calHeader] ?? 0 : 0;
  const calPercentage =
    calorieGoal > 0
      ? Math.min((currentCalories / calorieGoal) * 100, 100)
      : 0;

  const breakdownTree = buildFoodBreakdownTree(
    selection,
    foodInfo,
    meals,
    foodLog
  );

  const showTree =
    breakdownTree &&
    (selection.type === "foodLog" ||
      (selection.type === "item" && isItemMeal));

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <span className="text-sm font-medium text-slate-700">
          Show nutrient breakdown for
        </span>

        <SearchableDropdown
          label=""
          value={dropdownValue}
          onChange={handleDropdownChange}
          options={dropdownOptions}
          className="min-w-[180px]"
        />

        {selection.type === "foodLog" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">on</span>
            <input
              type="date"
              value={toInputDateValue(selection.date)}
              onChange={(e) =>
                onSelectionChange({
                  type: "foodLog",
                  date: fromInputDateValue(e.target.value),
                })
              }
              className="rounded-2xl border border-emerald-200 px-3 py-1.5 text-sm"
            />
            <span className="text-sm text-slate-600">
              {formatDisplayDate(selection.date)}
            </span>
          </div>
        )}

        {selection.type === "item" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={itemQuantity}
                onChange={(e) => {
                  const q = parseFloat(e.target.value);
                  if (q > 0) {
                    onSelectionChange({
                      ...selection,
                      quantity: q,
                    });
                  }
                }}
                className="w-24 rounded-2xl border border-emerald-200 px-3 py-2 text-sm"
              />
            </div>
            <SearchableDropdown
              label="Unit"
              value={isItemMeal ? "servings" : itemUnit}
              onChange={(v) =>
                onSelectionChange({
                  ...selection,
                  unit: v as "g" | "servings",
                })
              }
              options={
                isItemMeal
                  ? [{ value: "servings", label: "servings" }]
                  : [
                      { value: "g", label: "g" },
                      { value: "servings", label: "servings" },
                    ]
              }
              readOnly={isItemMeal}
              className="w-32"
            />
          </>
        )}
      </div>

      {selection.type === "foodLog" && (
        <p className="mb-4 text-sm text-slate-600">
          Food Log on {formatDisplayDate(selection.date)}
        </p>
      )}
      {selection.type === "item" && (
        <p className="mb-4 text-sm text-slate-600">
          {selection.name} {selection.quantity}{" "}
          {isItemMeal ? "servings" : selection.unit}
        </p>
      )}

      {showTree && breakdownTree && (
        <div className="mb-6">
          <FoodBreakdownTree tree={breakdownTree} />
        </div>
      )}

      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium text-slate-700">Calories</span>
          <span className="text-slate-600">
            {Math.round(currentCalories)} kcal
            {calorieGoal > 0 && (
              <span className="ml-1 text-slate-400">
                ({Math.round(calPercentage)}% of {calorieGoal} kcal goal)
              </span>
            )}
          </span>
        </div>
        {calorieGoal > 0 && (
          <div className="h-3 overflow-hidden rounded-2xl bg-emerald-100">
            <div
              className="h-full rounded-2xl bg-emerald-500 transition-all"
              style={{ width: `${calPercentage}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <MacronutrientDashboard totals={totals} foodInfo={foodInfo} />
        <MicronutrientDashboard totals={totals} foodInfo={foodInfo} />
      </div>
    </section>
  );
}
