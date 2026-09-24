import React, { useState, useEffect } from 'react';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import { FoodItem, MealItem } from '../types/nutrition';
import { formatDateLong, toMMDDYYYY, toInputDate, fromInputDate } from '../utils/date';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';

interface FoodLogEntryModuleProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
  foods: FoodItem[];
  meals: MealItem[];
  onLogItem: (dateStr: string, itemName: string, quantity: number, unit: 'g' | 'servings', isFood: boolean) => void;
}

export const FoodLogEntryModule: React.FC<FoodLogEntryModuleProps> = ({
  selectedDate,
  onDateChange,
  foods,
  meals,
  onLogItem,
}) => {
  const [selectedItemName, setSelectedItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'g' | 'servings'>('g');
  const [errorMsg, setErrorMsg] = useState('');

  // Determine if selected item is a Food or a Meal
  const isMeal = meals.some(m => m.name === selectedItemName);
  const isFood = foods.some(f => f.name === selectedItemName);

  // When selected item changes, adjust unit field
  useEffect(() => {
    if (isMeal) {
      setUnit('servings');
    } else if (isFood && unit !== 'g' && unit !== 'servings') {
      setUnit('g');
    }
  }, [selectedItemName, isMeal, isFood, unit]);

  // Options for items
  const itemOptions: DropdownOption[] = [
    ...foods.map(f => ({ label: f.name, value: f.name, category: 'Food' })),
    ...meals.map(m => ({ label: m.name, value: m.name, category: 'Meal' })),
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedItemName) {
      setErrorMsg('Please select an item to log.');
      return;
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Quantity must be a positive number.');
      return;
    }

    const dateStr = toMMDDYYYY(selectedDate);
    onLogItem(dateStr, selectedItemName, qtyNum, isMeal ? 'servings' : unit, isFood);

    // Reset inputs
    setQuantity('');
    setErrorMsg('');
  };

  return (
    <section className="w-full bg-white border-b border-slate-200 py-6 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Food Log Entry Selector Row */}
        <div className="flex flex-wrap items-center gap-3 text-slate-800">
          <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Log foods for
          </span>
          <div className="relative inline-flex items-center">
            {/* Native date picker with formatted overlay or accessible input */}
            <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-300 rounded-xl px-3.5 py-1.5 text-emerald-950 font-semibold shadow-2xs hover:bg-emerald-100/70 transition-colors cursor-pointer group">
              <Calendar className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">
                {formatDateLong(selectedDate)}
              </span>
              <input
                type="date"
                value={toInputDate(selectedDate)}
                onChange={e => {
                  if (e.target.value) {
                    onDateChange(fromInputDate(e.target.value));
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Food Log Entry Date Picker"
              />
            </div>
          </div>
        </div>

        {/* Food Log Entry Row: Item Dropdown, Quantity Field, Unit Field, Add Button */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex flex-col md:flex-row items-end gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            {/* 1. Item Dropdown */}
            <div className="w-full md:w-80 shrink-0">
              <SearchableDropdown
                label="Item"
                hintText="Search for an item…"
                options={itemOptions}
                value={selectedItemName}
                onChange={val => {
                  setSelectedItemName(val);
                  setErrorMsg('');
                }}
              />
            </div>

            {/* 2. Quantity Field */}
            <div className="w-full md:w-36 shrink-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 52"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 3. Unit Field */}
            <div className="w-full md:w-36 shrink-0">
              {isMeal ? (
                <SearchableDropdown
                  label="Unit"
                  options={['servings']}
                  value="servings"
                  onChange={() => {}}
                  readOnly={true}
                />
              ) : (
                <SearchableDropdown
                  label="Unit"
                  options={['g', 'servings']}
                  value={unit}
                  onChange={val => setUnit(val as 'g' | 'servings')}
                />
              )}
            </div>

            {/* 4. Add Button */}
            <div className="w-full md:w-auto shrink-0">
              <button
                type="submit"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm transition-all duration-150 h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 px-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
