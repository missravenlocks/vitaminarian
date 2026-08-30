"use client";

import { Plus } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";
import {
  formatDisplayDate,
  fromInputDateValue,
  toInputDateValue,
} from "@/lib/dates";
import { isMealName } from "@/lib/nutrients";
import type { FoodInfoData, MealsData } from "@/lib/types";

interface FoodLogEntryModuleProps {
  logDate: Date;
  onLogDateChange: (date: Date) => void;
  itemName: string;
  onItemChange: (name: string) => void;
  quantity: string;
  onQuantityChange: (qty: string) => void;
  unit: "g" | "servings";
  onUnitChange: (unit: "g" | "servings") => void;
  onAdd: () => void;
  foodInfo: FoodInfoData;
  meals: MealsData;
}

export default function FoodLogEntryModule({
  logDate,
  onLogDateChange,
  itemName,
  onItemChange,
  quantity,
  onQuantityChange,
  unit,
  onUnitChange,
  onAdd,
  foodInfo,
  meals,
}: FoodLogEntryModuleProps) {
  const foodMap = new Map(foodInfo.foods.map((f) => [f.name, f]));
  const mealMap = new Map(meals.meals.map((m) => [m.name, m]));

  const itemOptions = [
    ...foodInfo.foods.map((f) => ({ value: f.name, label: f.name })),
    ...meals.meals.map((m) => ({ value: m.name, label: m.name })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  const isMeal = itemName
    ? isMealName(itemName, foodMap, mealMap)
    : false;

  const unitOptions = isMeal
    ? [{ value: "servings", label: "servings" }]
    : [
        { value: "g", label: "g" },
        { value: "servings", label: "servings" },
      ];

  const canAdd =
    itemName &&
    quantity &&
    parseFloat(quantity) > 0 &&
    unit;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="font-medium">Log foods for</span>
        <input
          type="date"
          value={toInputDateValue(logDate)}
          onChange={(e) => onLogDateChange(fromInputDateValue(e.target.value))}
          className="rounded-2xl border border-emerald-200 px-3 py-1.5 text-sm text-slate-900"
        />
        <span className="text-slate-600">{formatDisplayDate(logDate)}</span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SearchableDropdown
          label="Item"
          hint="Search for an item…"
          value={itemName}
          onChange={(v) => {
            onItemChange(v);
            const meal = mealMap.has(v) && !foodMap.has(v);
            if (meal) onUnitChange("servings");
          }}
          options={itemOptions}
          className="min-w-[200px] flex-1"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Quantity
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            className="w-24 rounded-2xl border border-emerald-200 px-3 py-2 text-sm"
          />
        </div>
        <SearchableDropdown
          label="Unit"
          value={isMeal ? "servings" : unit}
          onChange={(v) => onUnitChange(v as "g" | "servings")}
          options={unitOptions}
          readOnly={isMeal}
          className="w-32"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {itemName && quantity && parseFloat(quantity) > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          {itemName} {quantity} {isMeal ? "servings" : unit}
        </p>
      )}
    </section>
  );
}
