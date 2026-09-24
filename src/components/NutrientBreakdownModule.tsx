import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  Utensils,
  BookOpen,
} from 'lucide-react';
import {
  DailyValuesData,
  FoodItem,
  FoodLogDay,
  MealItem,
  NutrientColumn,
  TreeNode,
} from '../types/nutrition';
import { formatDateLong, toMMDDYYYY, toInputDate, fromInputDate } from '../utils/date';
import {
  calculateFoodLogNutrients,
  calculateFoodNutrients,
  calculateMealNutrients,
  buildFoodLogBreakdownTree,
  buildMealBreakdownTree,
  MACRO_NAMES,
  formatQty,
} from '../utils/nutrition';
import { FoodBreakdownTree } from './FoodBreakdownTree';
import { MacroPieChart } from './MacroPieChart';
import { ProgressBar } from './ProgressBar';

interface NutrientBreakdownModuleProps {
  selectedBreakdownType: 'food-log' | 'specific-item';
  onSelectBreakdownType: (type: 'food-log' | 'specific-item') => void;
  breakdownDate: Date;
  onBreakdownDateChange: (d: Date) => void;
  breakdownItemName: string;
  onBreakdownItemChange: (name: string) => void;
  breakdownQuantity: number;
  onBreakdownQuantityChange: (q: number) => void;
  breakdownUnit: 'g' | 'servings';
  onBreakdownUnitChange: (u: 'g' | 'servings') => void;
  foods: FoodItem[];
  foodNutrientColumns: NutrientColumn[];
  meals: MealItem[];
  dailyValues: DailyValuesData;
  foodLog: FoodLogDay[];
}

export const NutrientBreakdownModule: React.FC<NutrientBreakdownModuleProps> = ({
  selectedBreakdownType,
  onSelectBreakdownType,
  breakdownDate,
  onBreakdownDateChange,
  breakdownItemName,
  onBreakdownItemChange,
  breakdownQuantity,
  onBreakdownQuantityChange,
  breakdownUnit,
  onBreakdownUnitChange,
  foods,
  foodNutrientColumns,
  meals,
  dailyValues,
  foodLog,
}) => {
  // Dropdown open states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const foodsMap = new Map<string, FoodItem>(foods.map(f => [f.name, f]));
  const mealsMap = new Map<string, MealItem>(meals.map(m => [m.name, m]));

  const isSelectedSpecificMeal = selectedBreakdownType === 'specific-item' && mealsMap.has(breakdownItemName);
  const isSelectedSpecificFood = selectedBreakdownType === 'specific-item' && foodsMap.has(breakdownItemName);

  // Calculate nutrients based on selection
  let calculatedCalories = 0;
  let calculatedNutrients: Record<string, number> = {};
  let breakdownTreeRoot: TreeNode | null = null;

  if (selectedBreakdownType === 'food-log') {
    const dateStr = toMMDDYYYY(breakdownDate);
    const day = foodLog.find(d => d.date === dateStr) || { date: dateStr, items: {} };
    const res = calculateFoodLogNutrients(day, foodsMap, mealsMap);
    calculatedCalories = res.calories;
    calculatedNutrients = res.nutrients;
    breakdownTreeRoot = buildFoodLogBreakdownTree(day, formatDateLong(breakdownDate), foodsMap, mealsMap);
  } else if (isSelectedSpecificFood) {
    const food = foodsMap.get(breakdownItemName)!;
    const res = calculateFoodNutrients(food, breakdownQuantity, breakdownUnit);
    calculatedCalories = res.calories;
    calculatedNutrients = res.nutrients;
    // Food Breakdown Tree does NOT appear for a single Food
    breakdownTreeRoot = null;
  } else if (isSelectedSpecificMeal) {
    const meal = mealsMap.get(breakdownItemName)!;
    const res = calculateMealNutrients(meal, breakdownQuantity, foodsMap, mealsMap);
    calculatedCalories = res.calories;
    calculatedNutrients = res.nutrients;

    const unitLabel = breakdownQuantity === 1 ? 'serving' : 'servings';
    const children = buildMealBreakdownTree(meal, breakdownQuantity, foodsMap, mealsMap);
    breakdownTreeRoot = {
      id: `meal-root-${meal.name}`,
      title: `Food Breakdown for ${formatQty(breakdownQuantity)} ${unitLabel} ${meal.name}`,
      isExpandable: true,
      type: 'root',
      children,
    };
  }

  // Filtered specific items for submenu
  const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredMeals = meals.filter(m => m.name.toLowerCase().includes(itemSearch.toLowerCase()));

  // Macronutrient progress bars order:
  // Follow order in Foods file!
  // Saturated Fat and Trans Fat indented under Fat (indent: 1)
  // Dietary Fiber and Sugars indented under Carbohydrates (indent: 1)
  // Added Sugars indented under Sugars (indent: 2)
  const macroNutrientItems: {
    fullName: string;
    name: string;
    unit: string;
    indent: 0 | 1 | 2;
  }[] = [];

  foodNutrientColumns.forEach(col => {
    if (MACRO_NAMES.includes(col.name)) {
      let indent: 0 | 1 | 2 = 0;
      if (['Saturated Fat', 'Trans Fat'].includes(col.name)) {
        indent = 1;
      } else if (['Dietary Fiber', 'Sugars'].includes(col.name)) {
        indent = 1;
      } else if (col.name === 'Added Sugars') {
        indent = 2;
      }
      macroNutrientItems.push({
        fullName: col.fullName,
        name: col.name,
        unit: col.unit,
        indent,
      });
    }
  });

  // Micronutrient progress bars: all columns other than MACRO_NAMES
  const microNutrientItems = foodNutrientColumns.filter(col => !MACRO_NAMES.includes(col.name));

  // Macronutrient grams for pie chart
  const fatGrams = calculatedNutrients['Fat'] || 0;
  const carbsGrams = calculatedNutrients['Carbohydrates'] || 0;
  const proteinGrams = calculatedNutrients['Protein'] || 0;

  return (
    <section className="w-full bg-slate-100/50 py-8 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Nutrient Breakdown Selector Row */}
        <div className="flex flex-wrap items-center gap-3 text-slate-800 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight shrink-0">
            Show nutrient breakdown for
          </span>

          {/* Nutrient Breakdown Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-950 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <span>
                {selectedBreakdownType === 'food-log'
                  ? 'Food Log'
                  : breakdownItemName || 'Select Item'}
              </span>
              <ChevronDown className="w-4 h-4 text-emerald-700" />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-100">
                <div className="p-1 text-sm divide-y divide-slate-100">
                  {/* Option 1: Food Log */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBreakdownType('food-log');
                      setIsDropdownOpen(false);
                      setIsSubmenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                      selectedBreakdownType === 'food-log'
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Food Log</span>
                  </button>

                  {/* Option 2: Specific Item with Submenu */}
                  <div
                    className="relative"
                    onMouseEnter={() => setIsSubmenuOpen(true)}
                    onMouseLeave={() => setIsSubmenuOpen(false)}
                  >
                    <div
                      onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
                      className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between cursor-pointer transition-colors ${
                        selectedBreakdownType === 'specific-item'
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Specific Item</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {/* Submenu of Foods and Meals */}
                    {isSubmenuOpen && (
                      <div className="absolute top-0 left-full ml-1 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100 max-h-80 overflow-y-auto">
                        <div className="p-1 mb-2 border-b border-slate-100 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter foods/meals..."
                            value={itemSearch}
                            onChange={e => setItemSearch(e.target.value)}
                            className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800"
                            onClick={e => e.stopPropagation()}
                          />
                        </div>

                        {/* Foods section */}
                        <div className="mb-2">
                          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Foods</span>
                          </div>
                          {filteredFoods.length === 0 ? (
                            <div className="text-[11px] text-slate-400 px-2 py-1">No foods</div>
                          ) : (
                            filteredFoods.map(f => (
                              <button
                                key={f.name}
                                type="button"
                                onClick={() => {
                                  onSelectBreakdownType('specific-item');
                                  onBreakdownItemChange(f.name);
                                  onBreakdownUnitChange('g');
                                  setIsDropdownOpen(false);
                                  setIsSubmenuOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium truncate transition-colors ${
                                  breakdownItemName === f.name && selectedBreakdownType === 'specific-item'
                                    ? 'bg-emerald-100 text-emerald-900 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {f.name}
                              </button>
                            ))
                          )}
                        </div>

                        {/* Meals section */}
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            <span>Meals</span>
                          </div>
                          {filteredMeals.length === 0 ? (
                            <div className="text-[11px] text-slate-400 px-2 py-1">No meals</div>
                          ) : (
                            filteredMeals.map(m => (
                              <button
                                key={m.name}
                                type="button"
                                onClick={() => {
                                  onSelectBreakdownType('specific-item');
                                  onBreakdownItemChange(m.name);
                                  onBreakdownUnitChange('servings');
                                  setIsDropdownOpen(false);
                                  setIsSubmenuOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium truncate transition-colors ${
                                  breakdownItemName === m.name && selectedBreakdownType === 'specific-item'
                                    ? 'bg-emerald-100 text-emerald-900 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditional fields based on selection */}
          {selectedBreakdownType === 'food-log' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">on</span>
              <div className="relative inline-flex items-center">
                <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-300 rounded-xl px-3.5 py-1.5 text-emerald-950 font-semibold shadow-2xs hover:bg-emerald-100/70 transition-colors cursor-pointer group">
                  <Calendar className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">
                    {formatDateLong(breakdownDate)}
                  </span>
                  <input
                    type="date"
                    value={toInputDate(breakdownDate)}
                    onChange={e => {
                      if (e.target.value) {
                        onBreakdownDateChange(fromInputDate(e.target.value));
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Nutrient Breakdown Date Picker"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Quantity Field */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={breakdownQuantity || ''}
                  onChange={e => onBreakdownQuantityChange(Math.max(0.01, Number(e.target.value)))}
                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Unit Field */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Unit:</label>
                {isSelectedSpecificMeal ? (
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium">
                    servings
                  </div>
                ) : (
                  <select
                    value={breakdownUnit}
                    onChange={e => onBreakdownUnitChange(e.target.value as 'g' | 'servings')}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="g">g</option>
                    <option value="servings">servings</option>
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Food Breakdown Tree (Only appears if user selected "Food Log" or a specific Meal) */}
        {breakdownTreeRoot && (
          <FoodBreakdownTree rootNode={breakdownTreeRoot} />
        )}

        {/* Calorie Progress Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Daily Calorie Goal
          </h3>
          <ProgressBar
            label="Calories"
            currentValue={calculatedCalories}
            goalValue={dailyValues.caloriesKcal}
            unit="kcal"
            barColor="#059669"
          />
        </div>

        {/* Macronutrient Dashboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Macronutrient Dashboard
            </h3>
            <p className="text-xs text-slate-500">
              Macronutrient distribution and daily targets
            </p>
          </div>

          {/* Macronutrient Pie Chart */}
          <MacroPieChart
            carbsGrams={carbsGrams}
            proteinGrams={proteinGrams}
            fatGrams={fatGrams}
          />

          {/* Macronutrient Progress Bars */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Macronutrient Progress
            </h4>
            <div className="divide-y divide-slate-100">
              {macroNutrientItems.map(item => {
                const currentVal = calculatedNutrients[item.name] || 0;
                const goalVal = dailyValues.nutrients[item.name] ?? null;

                return (
                  <ProgressBar
                    key={item.fullName}
                    label={item.name}
                    currentValue={currentVal}
                    goalValue={goalVal}
                    unit={item.unit}
                    indent={item.indent}
                    isLimit={item.name === 'Trans Fat'}
                    barColor={
                      item.name === 'Protein' ? '#10b981' :
                      item.name === 'Carbohydrates' || item.indent > 0 && item.name !== 'Saturated Fat' && item.name !== 'Trans Fat' ? '#3b82f6' :
                      '#f59e0b'
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Micronutrient Dashboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Micronutrient Dashboard
            </h3>
            <p className="text-xs text-slate-500">
              Vitamins, essential minerals, and sodium limits
            </p>
          </div>

          {microNutrientItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No micronutrients defined in Foods file.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 divide-y md:divide-y-0 divide-slate-100">
              {microNutrientItems.map(item => {
                const currentVal = calculatedNutrients[item.name] || 0;
                const goalVal = dailyValues.nutrients[item.name] ?? null;
                const isLimit = item.name === 'Sodium';

                return (
                  <ProgressBar
                    key={item.fullName}
                    label={item.name}
                    currentValue={currentVal}
                    goalValue={goalVal}
                    unit={item.unit}
                    isLimit={isLimit}
                    barColor={isLimit ? '#f59e0b' : '#0ea5e9'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
