import React, { useState, useEffect } from 'react';
import { ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';
import disclaimerRaw from './data/disclaimer.txt?raw';
import tutorialRaw from './data/tutorial.md?raw';
import {
  DEFAULT_FOODS_CSV,
  DEFAULT_DAILY_VALUES_CSV,
  DEFAULT_MEALS_CSV,
  DEFAULT_FOOD_LOG_CSV,
  SAMPLE_MEALS_EXAMPLE,
} from './data/defaultData';
import {
  parseFoodsData,
  parseMealsData,
  parseDailyValuesData,
  parseFoodLogData,
} from './utils/nutrition';
import { toCSV, parseCSV } from './utils/csv';
import { HeaderModule } from './components/HeaderModule';
import { UploadDownloadModule } from './components/UploadDownloadModule';
import { FoodLogEntryModule } from './components/FoodLogEntryModule';
import { NutrientBreakdownModule } from './components/NutrientBreakdownModule';
import { FooterModule } from './components/FooterModule';
import { DialogModal } from './components/DialogModal';

const STORAGE_KEYS = {
  FOODS: 'vitaminarian_foods_csv',
  MEALS: 'vitaminarian_meals_csv',
  DAILY_VALUES: 'vitaminarian_daily_values_csv',
  FOOD_LOG: 'vitaminarian_food_log_csv',
  DISCLAIMER_SEEN: 'vitaminarian_disclaimer_acknowledged',
};

export default function App() {
  // Raw CSV state
  const [foodsCsv, setFoodsCsv] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FOODS) || DEFAULT_FOODS_CSV;
  });

  const [mealsCsv, setMealsCsv] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MEALS) || DEFAULT_MEALS_CSV;
  });

  const [dailyValuesCsv, setDailyValuesCsv] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.DAILY_VALUES) || DEFAULT_DAILY_VALUES_CSV;
  });

  const [foodLogCsv, setFoodLogCsv] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FOOD_LOG) || DEFAULT_FOOD_LOG_CSV;
  });

  // Initial Disclaimer Popup (Guaranteed to show on initial load)
  const [showInitialDisclaimer, setShowInitialDisclaimer] = useState<boolean>(true);

  // Date selection (Defaults to today: September 23, 2026)
  const [logSelectedDate, setLogSelectedDate] = useState<Date>(() => new Date());

  // Nutrient Breakdown selection states
  const [breakdownType, setBreakdownType] = useState<'food-log' | 'specific-item'>('food-log');
  const [breakdownDate, setBreakdownDate] = useState<Date>(() => new Date());
  const [breakdownItemName, setBreakdownItemName] = useState<string>('');
  const [breakdownQuantity, setBreakdownQuantity] = useState<number>(100);
  const [breakdownUnit, setBreakdownUnit] = useState<'g' | 'servings'>('g');

  // Parsed data structures
  const { foods, columns: foodNutrientColumns } = React.useMemo(
    () => parseFoodsData(foodsCsv),
    [foodsCsv]
  );
  const meals = React.useMemo(() => parseMealsData(mealsCsv), [mealsCsv]);
  const { dailyValues } = React.useMemo(
    () => parseDailyValuesData(dailyValuesCsv),
    [dailyValuesCsv]
  );
  const { foodLog } = React.useMemo(
    () => parseFoodLogData(foodLogCsv),
    [foodLogCsv]
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOODS, foodsCsv);
  }, [foodsCsv]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEALS, mealsCsv);
  }, [mealsCsv]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_VALUES, dailyValuesCsv);
  }, [dailyValuesCsv]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOG, foodLogCsv);
  }, [foodLogCsv]);

  // When user selects a new date for Food Log Entry Date Picker:
  // "Food Log" is automatically selected for Nutrient Breakdown Dropdown and the same date is automatically selected!
  const handleFoodLogDateChange = (newDate: Date) => {
    setLogSelectedDate(newDate);
    setBreakdownType('food-log');
    setBreakdownDate(newDate);
  };

  // Commit changes from Upload Data Menu
  const handleCommitUploadedFiles = (newFiles: {
    foodsCsv?: string;
    mealsCsv?: string;
    dailyValuesCsv?: string;
    foodLogCsv?: string;
  }) => {
    if (newFiles.foodsCsv !== undefined) setFoodsCsv(newFiles.foodsCsv);
    if (newFiles.mealsCsv !== undefined) setMealsCsv(newFiles.mealsCsv);
    if (newFiles.dailyValuesCsv !== undefined) setDailyValuesCsv(newFiles.dailyValuesCsv);
    if (newFiles.foodLogCsv !== undefined) setFoodLogCsv(newFiles.foodLogCsv);
  };

  // Handler for adding an entry from Food Log Entry Row
  const handleLogItem = (
    dateStr: string,
    itemName: string,
    quantity: number,
    unit: 'g' | 'servings',
    isFood: boolean
  ) => {
    // In Food Log.csv:
    // First column is Date
    // All subsequent columns are food/meal names
    // Unit is assumed to be grams for Foods and servings for Meals
    let loggedQty = quantity;
    if (isFood && unit === 'servings') {
      const foodObj = foods.find(f => f.name === itemName);
      const servingSize = foodObj ? foodObj.servingSizeG : 100;
      loggedQty = quantity * servingSize;
    }

    const rows = parseCSV(foodLogCsv);
    let headers: string[] = [];

    if (rows.length === 0) {
      headers = ['Date', itemName];
    } else {
      headers = [...rows[0]];
      if (!headers.includes(itemName)) {
        headers.push(itemName);
      }
    }

    const itemColIndex = headers.indexOf(itemName);
    const dateRowIndex = rows.findIndex((r, idx) => idx > 0 && (r[0] || '').trim() === dateStr);

    let updatedRows: string[][] = [];

    if (rows.length === 0) {
      updatedRows = [headers, [dateStr, String(loggedQty)]];
    } else {
      updatedRows = rows.map((r, idx) => {
        if (idx === 0) return headers;
        const padded = [...r];
        while (padded.length < headers.length) padded.push('');
        return padded;
      });

      if (dateRowIndex !== -1) {
        // Existing date row: add to existing quantity
        const existingVal = Number(updatedRows[dateRowIndex][itemColIndex]) || 0;
        updatedRows[dateRowIndex][itemColIndex] = String(existingVal + loggedQty);
      } else {
        // New date row
        const newRow = new Array(headers.length).fill('');
        newRow[0] = dateStr;
        newRow[itemColIndex] = String(loggedQty);
        updatedRows.push(newRow);
      }
    }

    const newCsv = toCSV(updatedRows);
    setFoodLogCsv(newCsv);
  };

  // Quick helper to load the Oatmeal & Flax Oatmeal examples mentioned in the technical design
  const handleLoadSampleMealsExample = () => {
    setMealsCsv(SAMPLE_MEALS_EXAMPLE);
    // Also log 150g Apple and 2 servings Flax Oatmeal on September 23, 2026 for demonstration
    const sampleLogCsv = `Date,Apple,Flax Oatmeal
09/23/2026,150,2`;
    setFoodLogCsv(sampleLogCsv);
    setBreakdownType('food-log');
    setBreakdownDate(new Date(2026, 8, 23));
    setLogSelectedDate(new Date(2026, 8, 23));
  };

  const handleResetToDefaults = () => {
    setFoodsCsv(DEFAULT_FOODS_CSV);
    setDailyValuesCsv(DEFAULT_DAILY_VALUES_CSV);
    setMealsCsv(DEFAULT_MEALS_CSV);
    setFoodLogCsv(DEFAULT_FOOD_LOG_CSV);
    setBreakdownType('food-log');
    setBreakdownDate(new Date(2026, 8, 23));
    setLogSelectedDate(new Date(2026, 8, 23));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header Module */}
      <HeaderModule />

      {/* Quick Action Bar for preset test examples */}
      <div className="bg-emerald-900 text-emerald-100 px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Preset Scenarios:</span>
          <span>Test the Food Breakdown Tree & recursive meals:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSampleMealsExample}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Load Example Meals (Oatmeal & Flax Oatmeal)</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-200 rounded-lg font-medium transition-colors cursor-pointer text-xs"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Reset Initial Data</span>
          </button>
        </div>
      </div>

      {/* 2. Upload and Download Module */}
      <UploadDownloadModule
        foodsCsv={foodsCsv}
        mealsCsv={mealsCsv}
        dailyValuesCsv={dailyValuesCsv}
        foodLogCsv={foodLogCsv}
        onCommitChanges={handleCommitUploadedFiles}
      />

      {/* 3. Food Log Entry Module */}
      <FoodLogEntryModule
        selectedDate={logSelectedDate}
        onDateChange={handleFoodLogDateChange}
        foods={foods}
        meals={meals}
        onLogItem={handleLogItem}
      />

      {/* 4. Nutrient Breakdown Module */}
      <NutrientBreakdownModule
        selectedBreakdownType={breakdownType}
        onSelectBreakdownType={setBreakdownType}
        breakdownDate={breakdownDate}
        onBreakdownDateChange={setBreakdownDate}
        breakdownItemName={breakdownItemName || (foods[0]?.name ?? '')}
        onBreakdownItemChange={setBreakdownItemName}
        breakdownQuantity={breakdownQuantity}
        onBreakdownQuantityChange={setBreakdownQuantity}
        breakdownUnit={breakdownUnit}
        onBreakdownUnitChange={setBreakdownUnit}
        foods={foods}
        foodNutrientColumns={foodNutrientColumns}
        meals={meals}
        dailyValues={dailyValues}
        foodLog={foodLog}
      />

      {/* 5. Footer Module */}
      <div className="mt-auto">
        <FooterModule
          tutorialContent={tutorialRaw}
          disclaimerText={disclaimerRaw}
        />
      </div>

      {/* Initial Load Disclaimer Popup (Guaranteed display upon initial page load) */}
      <DialogModal
        isOpen={showInitialDisclaimer}
        onClose={() => setShowInitialDisclaimer(false)}
        title="Medical & Dietary Disclaimer"
        maxWidth="max-w-xl"
        icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
        footer={
          <button
            type="button"
            onClick={() => setShowInitialDisclaimer(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
          >
            I Acknowledge & Understand
          </button>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
            Please review the following notice before using Vitaminarian.
          </div>
          <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed font-sans max-h-72 overflow-y-auto pr-2">
            {disclaimerRaw}
          </div>
        </div>
      </DialogModal>
    </div>
  );
}
