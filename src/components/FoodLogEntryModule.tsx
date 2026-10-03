import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Calendar, ChevronDown, Trash2 } from 'lucide-react';
import { Food, Meal, FoodLog } from '../types/nutrition.ts';
import { formatDateLong, formatQuantity, toMMDDYYYY, toYYYYMMDD } from '../utils/nutritionCalculations.ts';

interface FoodLogEntryModuleProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  foodsMap: Map<string, Food>;
  mealsMap: Map<string, Meal>;
  foodLog: FoodLog;
  onLogItem: (date: string, item: string, quantity: number, unit: 'g' | 'servings') => void;
  onDeleteItem: (date: string, item: string) => void;
}

export const FoodLogEntryModule: React.FC<FoodLogEntryModuleProps> = ({
  selectedDate,
  onDateChange,
  foodsMap,
  mealsMap,
  foodLog,
  onLogItem,
  onDeleteItem
}) => {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<'g' | 'servings'>('g');

  // Search dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update unit rules when selected item changes
  const isSelectedMeal = mealsMap.has(selectedItem);
  const isSelectedFood = foodsMap.has(selectedItem);

  useEffect(() => {
    if (isSelectedMeal) {
      setUnit('servings');
    } else if (isSelectedFood) {
      // Default to 'g' or keep current if valid
      if (unit !== 'g' && unit !== 'servings') {
        setUnit('g');
      }
    }
  }, [selectedItem, isSelectedMeal, isSelectedFood]);

  // Combine and filter foods & meals
  const allItemNames: { name: string; type: 'Food' | 'Meal' }[] = [
    ...Array.from(foodsMap.keys()).map(name => ({ name, type: 'Food' as const })),
    ...Array.from(mealsMap.keys()).map(name => ({ name, type: 'Meal' as const }))
  ];

  const filteredItems = allItemNames.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (name: string) => {
    setSelectedItem(name);
    setSearchQuery('');
    setIsDropdownOpen(false);

    // If it's a meal, lock unit to servings
    if (mealsMap.has(name)) {
      setUnit('servings');
    }
  };

  const handleAdd = () => {
    const qtyNum = parseFloat(quantity);
    if (!selectedItem || isNaN(qtyNum) || qtyNum <= 0) return;

    onLogItem(selectedDate, selectedItem, qtyNum, unit);
    // Reset item and quantity
    setSelectedItem('');
    setQuantity('1');
  };

  const datePickerInputRef = useRef<HTMLInputElement>(null);
  const formattedDisplayDate = formatDateLong(selectedDate);
  const mmddyyyy = toMMDDYYYY(selectedDate);
  const currentDayLog = foodLog[mmddyyyy];
  const loggedItemsList = currentDayLog ? Object.entries(currentDayLog.items).filter(([_, q]) => q > 0) : [];

  return (
    <section className="w-full bg-white border-b border-neutral-200 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
        {/* Food Log Entry Selector Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-base sm:text-lg font-medium text-neutral-800">
          <span className="text-neutral-600">Log foods for</span>

          {/* Interactive Date Picker Container */}
          <div className="relative inline-flex items-center">
            <button
              onClick={() => {
                if (datePickerInputRef.current) {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    datePickerInputRef.current.showPicker();
                  } else {
                    datePickerInputRef.current.focus();
                  }
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-base font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 rounded-md transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{formattedDisplayDate}</span>
            </button>

            <input
              ref={datePickerInputRef}
              type="date"
              min="2000-01-01"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="sr-only"
              aria-label="Food Log Entry Date Picker"
            />
          </div>
        </div>

        {/* Food Log Entry Row: Item Dropdown, Quantity Field, Unit Field, Add Button */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Item Dropdown */}
            <div className="sm:col-span-5 relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Item
              </label>

              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full min-h-[40px] px-3 py-2 bg-white border border-neutral-300 rounded-md flex items-center justify-between cursor-pointer hover:border-neutral-400 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-colors"
              >
                <span className={`text-sm ${selectedItem ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                  {selectedItem || 'Search for an item…'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-neutral-100 sticky top-0 bg-white">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-50 rounded border border-neutral-200">
                      <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search for an item…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs text-neutral-800 bg-transparent outline-hidden"
                      />
                    </div>
                  </div>

                  <ul className="py-1 text-sm divide-y divide-neutral-100">
                    {filteredItems.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-neutral-400 italic text-center">
                        No foods or meals found
                      </li>
                    ) : (
                      filteredItems.map(item => (
                        <li
                          key={item.name}
                          onClick={() => handleSelectItem(item.name)}
                          className={`px-3 py-2 flex items-center justify-between hover:bg-neutral-100 cursor-pointer ${
                            selectedItem === item.name ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-neutral-700'
                          }`}
                        >
                          <span>{item.name}</span>
                          <span className="text-xs text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 font-mono">
                            {item.type}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Quantity Field */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 52"
                className="w-full h-[40px] px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden tabular-nums"
              />
            </div>

            {/* Unit Field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Unit
              </label>
              {isSelectedMeal ? (
                <div className="w-full h-[40px] px-3 py-2 text-sm bg-neutral-100 border border-neutral-300 rounded-md text-neutral-600 flex items-center justify-between cursor-not-allowed select-none">
                  <span>servings</span>
                  <span className="text-[10px] text-neutral-400 font-mono">lock</span>
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'g' | 'servings')}
                  className="w-full h-[40px] px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="g">g</option>
                  <option value="servings">servings</option>
                </select>
              )}
            </div>

            {/* Add Button */}
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedItem || !quantity || parseFloat(quantity) <= 0}
                className="w-full h-[40px] inline-flex items-center justify-center gap-1.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Display Current Day's Logged Items */}
        {loggedItemsList.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
              Logged Items for {formattedDisplayDate} ({loggedItemsList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {loggedItemsList.map(([itemName, qty]) => {
                const isFood = foodsMap.has(itemName);
                const displayUnit = isFood ? 'g' : (qty === 1 ? 'serving' : 'servings');
                return (
                  <div
                    key={itemName}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs text-neutral-800 transition-colors"
                  >
                    <span className="font-semibold">{itemName}</span>
                    <span className="text-neutral-500 font-mono">
                      {formatQuantity(qty)} {displayUnit}
                    </span>
                    <button
                      onClick={() => onDeleteItem(selectedDate, itemName)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer ml-1"
                      title={`Remove ${itemName}`}
                      aria-label={`Remove ${itemName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
