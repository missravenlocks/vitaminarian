import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Calendar, Search } from 'lucide-react';
import {
  DailyValues,
  Food,
  FoodLog,
  Meal,
  TreeNode
} from '../types/nutrition.ts';
import {
  formatDateLong,
  formatQuantity,
  buildFoodBreakdownTree,
  resolveBaseFoodsInGrams,
  calculateNutrients
} from '../utils/nutritionCalculations.ts';
import { FoodBreakdownTree } from './FoodBreakdownTree.tsx';
import { CalorieProgressBar } from './CalorieProgressBar.tsx';
import { MacroPieChart } from './MacroPieChart.tsx';
import { NutrientProgressBar } from './NutrientProgressBar.tsx';

interface NutrientBreakdownModuleProps {
  selectedLogDate: string; // From Food Log Entry Date Picker
  foodsMap: Map<string, Food>;
  mealsMap: Map<string, Meal>;
  foodLog: FoodLog;
  dailyValues: DailyValues;
  orderedNutrientCols: string[];
}

// Known macronutrient canonical base names
const MACRO_NAMES = [
  'Fat',
  'Saturated Fat',
  'Trans Fat',
  'Carbohydrates',
  'Dietary Fiber',
  'Sugars',
  'Added Sugars',
  'Protein'
];

export const NutrientBreakdownModule: React.FC<NutrientBreakdownModuleProps> = ({
  selectedLogDate,
  foodsMap,
  mealsMap,
  foodLog,
  dailyValues,
  orderedNutrientCols
}) => {
  // Mode: "foodLog" or "specificItem"
  const [viewMode, setViewMode] = useState<'foodLog' | 'specificItem'>('foodLog');
  const [breakdownDate, setBreakdownDate] = useState<string>(selectedLogDate);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<'g' | 'servings'>('g');

  // Nutrient Breakdown Dropdown menu open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [submenuSearch, setSubmenuSearch] = useState('');
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Sync date when Food Log Entry Date Picker changes
  useEffect(() => {
    setViewMode('foodLog');
    setBreakdownDate(selectedLogDate);
  }, [selectedLogDate]);

  // Adjust unit if selectedItem changes
  useEffect(() => {
    if (mealsMap.has(selectedItem)) {
      setUnit('servings');
    } else if (foodsMap.has(selectedItem)) {
      if (unit !== 'g' && unit !== 'servings') {
        setUnit('g');
      }
    }
  }, [selectedItem, mealsMap, foodsMap]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setIsSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allItems: { name: string; type: 'Food' | 'Meal' }[] = [
    ...Array.from(foodsMap.keys()).map(name => ({ name, type: 'Food' as const })),
    ...Array.from(mealsMap.keys()).map(name => ({ name, type: 'Meal' as const }))
  ];

  const filteredSubmenuItems = allItems.filter(i =>
    i.name.toLowerCase().includes(submenuSearch.toLowerCase())
  );

  const handleSelectFoodLog = () => {
    setViewMode('foodLog');
    setIsDropdownOpen(false);
    setIsSubmenuOpen(false);
  };

  const handleSelectSpecificItem = (itemName: string) => {
    setViewMode('specificItem');
    setSelectedItem(itemName);
    if (mealsMap.has(itemName)) {
      setUnit('servings');
    }
    setIsDropdownOpen(false);
    setIsSubmenuOpen(false);
  };

  const qtyNumber = parseFloat(quantity) || 0;

  // Build the Food Breakdown Tree
  const breakdownTree: TreeNode = buildFoodBreakdownTree(
    viewMode,
    breakdownDate,
    selectedItem,
    qtyNumber,
    unit,
    foodsMap,
    mealsMap,
    foodLog
  );

  // Calculate Nutrients
  const baseFoodsGrams = resolveBaseFoodsInGrams(
    viewMode,
    breakdownDate,
    selectedItem,
    qtyNumber,
    unit,
    foodsMap,
    mealsMap,
    foodLog
  );

  const calculated = calculateNutrients(baseFoodsGrams, foodsMap);
  const goalCalories = dailyValues['Calories (kcal)'];

  // Helper to extract nutrient name from header, e.g. "Fat (g)" -> "Fat"
  const getNutrientBaseName = (colHeader: string): string => {
    const match = colHeader.match(/^([A-Za-z0-9 ]+) \(/);
    return match ? match[1].trim() : colHeader;
  };

  const getNutrientUnit = (colHeader: string): string => {
    const match = colHeader.match(/\(([^)]+)\)$/);
    return match ? match[1].trim() : '';
  };

  // Partition orderedNutrientCols into Macronutrients and Micronutrients
  const macroColumns = orderedNutrientCols.filter(col => {
    const base = getNutrientBaseName(col);
    return MACRO_NAMES.includes(base);
  });

  const microColumns = orderedNutrientCols.filter(col => {
    const base = getNutrientBaseName(col);
    return !MACRO_NAMES.includes(base);
  });

  // Indentation for macronutrients:
  // Saturated Fat and Trans Fat indented under Fat (indent 1)
  // Dietary Fiber and Sugars indented under Carbohydrates (indent 1)
  // Added Sugars indented under Sugars (indent 2)
  const getMacroIndent = (baseName: string): number => {
    if (baseName === 'Saturated Fat' || baseName === 'Trans Fat') return 1;
    if (baseName === 'Dietary Fiber' || baseName === 'Sugars') return 1;
    if (baseName === 'Added Sugars') return 2;
    return 0;
  };

  // Limits
  const isMacroLimit = (baseName: string): boolean => {
    return baseName === 'Saturated Fat' || baseName === 'Trans Fat' || baseName === 'Added Sugars';
  };

  const isMicroLimit = (baseName: string): boolean => {
    return baseName === 'Sodium';
  };

  return (
    <section className="w-full bg-white py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Nutrient Breakdown Selector Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-base sm:text-lg font-medium text-neutral-800">
          <span className="text-neutral-600">Show nutrient breakdown for</span>

          {/* Nutrient Breakdown Dropdown */}
          <div className="relative inline-block" ref={dropdownContainerRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-base font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 rounded-md transition-colors cursor-pointer"
            >
              <span>
                {viewMode === 'foodLog' ? 'Food Log' : selectedItem || 'Specific Item'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-40 left-0 mt-1 w-52 bg-white border border-neutral-200 rounded-md shadow-lg py-1 text-sm font-normal">
                {/* Menu Item 1: Food Log */}
                <button
                  onClick={handleSelectFoodLog}
                  className={`w-full text-left px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center justify-between ${
                    viewMode === 'foodLog' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-neutral-800'
                  }`}
                >
                  <span>Food Log</span>
                </button>

                {/* Menu Item 2: Specific Item (expands to submenu on hover / click) */}
                <div
                  className="relative group"
                  onMouseEnter={() => setIsSubmenuOpen(true)}
                  onMouseLeave={() => setIsSubmenuOpen(false)}
                >
                  <div
                    onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center justify-between ${
                      viewMode === 'specificItem' ? 'text-emerald-900 font-semibold' : 'text-neutral-800'
                    }`}
                  >
                    <span>Specific Item</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700" />
                  </div>

                  {/* Submenu on hover */}
                  {isSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 w-64 bg-white border border-neutral-200 rounded-md shadow-xl py-1 z-50 max-h-72 overflow-y-auto">
                      <div className="p-2 border-b border-neutral-100 sticky top-0 bg-white">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-50 rounded border border-neutral-200">
                          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Filter foods & meals…"
                            value={submenuSearch}
                            onChange={(e) => setSubmenuSearch(e.target.value)}
                            className="w-full text-xs text-neutral-800 bg-transparent outline-hidden"
                          />
                        </div>
                      </div>

                      <ul className="divide-y divide-neutral-100">
                        {filteredSubmenuItems.length === 0 ? (
                          <li className="px-3 py-2 text-xs text-neutral-400 italic">
                            No matching items
                          </li>
                        ) : (
                          filteredSubmenuItems.map(item => (
                            <li
                              key={item.name}
                              onClick={() => handleSelectSpecificItem(item.name)}
                              className={`px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center justify-between ${
                                selectedItem === item.name ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-neutral-700'
                              }`}
                            >
                              <span className="truncate pr-1">{item.name}</span>
                              <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200 font-mono shrink-0">
                                {item.type}
                              </span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* If Food Log is selected: "on" label + Nutrient Breakdown Date Picker */}
          {viewMode === 'foodLog' && (
            <div className="inline-flex items-center gap-2">
              <span className="text-neutral-600">on</span>
              <div className="relative inline-flex items-center">
                <button
                  onClick={() => {
                    if (datePickerRef.current) {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        datePickerRef.current.showPicker();
                      } else {
                        datePickerRef.current.focus();
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-base font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 rounded-md transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{formatDateLong(breakdownDate)}</span>
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  min="2000-01-01"
                  value={breakdownDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setBreakdownDate(e.target.value);
                    }
                  }}
                  className="sr-only"
                  aria-label="Nutrient Breakdown Date Picker"
                />
              </div>
            </div>
          )}

          {/* If Specific Item is selected: Quantity Field + Unit Field */}
          {viewMode === 'specificItem' && (
            <div className="inline-flex items-center gap-2">
              {/* Quantity Field */}
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                aria-label="Quantity"
                className="w-20 px-2.5 py-1.5 text-base font-semibold bg-white border border-neutral-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden tabular-nums"
              />

              {/* Unit Field */}
              {mealsMap.has(selectedItem) ? (
                <span className="px-3 py-1.5 text-base font-semibold text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-md select-none">
                  servings
                </span>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'g' | 'servings')}
                  aria-label="Unit"
                  className="px-3 py-1.5 text-base font-semibold bg-white border border-neutral-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="g">g</option>
                  <option value="servings">servings</option>
                </select>
              )}
            </div>
          )}
        </div>

        {/* Food Breakdown Tree */}
        <div className="space-y-2">
          <FoodBreakdownTree tree={breakdownTree} />
        </div>

        {/* Calorie Progress Bar */}
        <div>
          <CalorieProgressBar
            currentCalories={calculated.calories}
            goalCalories={goalCalories}
          />
        </div>

        {/* Macronutrient Dashboard */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">
              Macronutrient Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Caloric composition and progress toward daily targets or limits
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Pie Chart */}
            <div className="lg:col-span-5">
              <MacroPieChart
                fatGrams={calculated.nutrients['Fat (g)'] || 0}
                carbGrams={calculated.nutrients['Carbohydrates (g)'] || 0}
                proteinGrams={calculated.nutrients['Protein (g)'] || 0}
              />
            </div>

            {/* Macronutrient Progress Bars */}
            <div className="lg:col-span-7 bg-neutral-50/60 border border-neutral-200/80 rounded-lg p-4 divide-y divide-neutral-100">
              {macroColumns.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  No macronutrient columns detected in the Foods file.
                </p>
              ) : (
                macroColumns.map(col => {
                  const baseName = getNutrientBaseName(col);
                  const unitStr = getNutrientUnit(col);
                  const curVal = calculated.nutrients[col] || 0;
                  const goalVal = dailyValues[col];
                  const indent = getMacroIndent(baseName);
                  const isLimit = isMacroLimit(baseName);

                  return (
                    <NutrientProgressBar
                      key={col}
                      label={baseName}
                      unit={unitStr}
                      currentValue={curVal}
                      goalValue={goalVal}
                      isLimit={isLimit}
                      indent={indent}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Micronutrient Dashboard */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-bold text-neutral-900">
              Micronutrient Dashboard
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Vitamins, essential minerals, and trace elements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 divide-y md:divide-y-0 divide-neutral-100">
            {microColumns.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2 col-span-2">
                No micronutrient columns detected in the Foods file.
              </p>
            ) : (
              microColumns.map(col => {
                const baseName = getNutrientBaseName(col);
                const unitStr = getNutrientUnit(col);
                const curVal = calculated.nutrients[col] || 0;
                const goalVal = dailyValues[col];
                const isLimit = isMicroLimit(baseName);

                return (
                  <div key={col} className="border-b border-neutral-100/70 pb-1">
                    <NutrientProgressBar
                      label={baseName}
                      unit={unitStr}
                      currentValue={curVal}
                      goalValue={goalVal}
                      isLimit={isLimit}
                      indent={0}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
