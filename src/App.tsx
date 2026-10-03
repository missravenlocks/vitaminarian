/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_FOODS_CSV,
  INITIAL_MEALS_CSV,
  INITIAL_DAILY_VALUES_CSV,
  INITIAL_FOOD_LOG_CSV
} from './data/initialData.ts';
import {
  parseFoods,
  parseMeals,
  parseDailyValues,
  parseFoodLog,
  serializeFoodLog,
  toMMDDYYYY,
  toYYYYMMDD
} from './utils/nutritionCalculations.ts';
import { HeaderModule } from './components/HeaderModule.tsx';
import { UploadDownloadModule } from './components/UploadDownloadModule.tsx';
import { FoodLogEntryModule } from './components/FoodLogEntryModule.tsx';
import { NutrientBreakdownModule } from './components/NutrientBreakdownModule.tsx';
import { FooterModule } from './components/FooterModule.tsx';
import { TutorialModal } from './components/TutorialModal.tsx';
import { DisclaimerModal } from './components/DisclaimerModal.tsx';
import { generateProjectZip, downloadBlob } from './utils/exportZip.ts';

// Storage keys
const STORAGE_KEYS = {
  FOODS: 'vitaminarian_foods_csv',
  MEALS: 'vitaminarian_meals_csv',
  DAILY_VALUES: 'vitaminarian_dv_csv',
  FOOD_LOG: 'vitaminarian_food_log_csv',
  DISCLAIMER_ACCEPTED: 'vitaminarian_disclaimer_accepted'
};

function getLocalTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  // CSV States initialized from localStorage or initial constants
  const [foodsCSV, setFoodsCSV] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FOODS) || INITIAL_FOODS_CSV;
  });

  const [mealsCSV, setMealsCSV] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.MEALS) || INITIAL_MEALS_CSV;
  });

  const [dailyValuesCSV, setDailyValuesCSV] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.DAILY_VALUES) || INITIAL_DAILY_VALUES_CSV;
  });

  const [foodLogCSV, setFoodLogCSV] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.FOOD_LOG) || INITIAL_FOOD_LOG_CSV;
  });

  // Food Log Date selection (default today)
  const [selectedLogDate, setSelectedLogDate] = useState<string>(getLocalTodayISO());

  // Modal states
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(() => {
    // Show on initial load as required:
    // "when the user initially loads the page, show a popup with this disclaimer so that the user is guaranteed to see it."
    const accepted = sessionStorage.getItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED);
    return !accepted;
  });
  const [isDisclaimerReadOnly, setIsDisclaimerReadOnly] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOODS, foodsCSV);
  }, [foodsCSV]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEALS, mealsCSV);
  }, [mealsCSV]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_VALUES, dailyValuesCSV);
  }, [dailyValuesCSV]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOG, foodLogCSV);
  }, [foodLogCSV]);

  // Parsed data
  const { foodsMap, orderedNutrientCols } = useMemo(() => {
    return parseFoods(foodsCSV);
  }, [foodsCSV]);

  const mealsMap = useMemo(() => {
    return parseMeals(mealsCSV);
  }, [mealsCSV]);

  const dailyValues = useMemo(() => {
    return parseDailyValues(dailyValuesCSV);
  }, [dailyValuesCSV]);

  const foodLog = useMemo(() => {
    return parseFoodLog(foodLogCSV);
  }, [foodLogCSV]);

  // Handle saving data from Upload module
  const handleSaveData = (updated: {
    foods?: string;
    meals?: string;
    dailyValues?: string;
    foodLog?: string;
  }) => {
    if (updated.foods !== undefined) setFoodsCSV(updated.foods);
    if (updated.meals !== undefined) setMealsCSV(updated.meals);
    if (updated.dailyValues !== undefined) setDailyValuesCSV(updated.dailyValues);
    if (updated.foodLog !== undefined) setFoodLogCSV(updated.foodLog);
  };

  // Handle logging a food or meal
  const handleLogItem = (
    dateISO: string,
    itemName: string,
    qty: number,
    unit: 'g' | 'servings'
  ) => {
    const mmddyyyy = toMMDDYYYY(dateISO);
    let qtyToLog = qty;

    // "The unit for the quantity values in each row is assumed to be grams for Foods and servings for Meals."
    if (foodsMap.has(itemName)) {
      const food = foodsMap.get(itemName)!;
      if (unit === 'servings') {
        qtyToLog = qty * food.servingSize;
      }
    }

    const currentLogCopy = { ...foodLog };
    if (!currentLogCopy[mmddyyyy]) {
      currentLogCopy[mmddyyyy] = { date: mmddyyyy, items: {} };
    }

    const currentDayItems = { ...currentLogCopy[mmddyyyy].items };
    currentDayItems[itemName] = (currentDayItems[itemName] || 0) + qtyToLog;
    currentLogCopy[mmddyyyy] = { date: mmddyyyy, items: currentDayItems };

    const newCSV = serializeFoodLog(currentLogCopy, foodsMap, mealsMap);
    setFoodLogCSV(newCSV);
  };

  // Handle deleting an item from a day's log
  const handleDeleteItem = (dateISO: string, itemName: string) => {
    const mmddyyyy = toMMDDYYYY(dateISO);
    if (!foodLog[mmddyyyy]) return;

    const currentLogCopy = { ...foodLog };
    const currentDayItems = { ...currentLogCopy[mmddyyyy].items };
    delete currentDayItems[itemName];
    currentLogCopy[mmddyyyy] = { date: mmddyyyy, items: currentDayItems };

    const newCSV = serializeFoodLog(currentLogCopy, foodsMap, mealsMap);
    setFoodLogCSV(newCSV);
  };

  // Handle project source zip export
  const handleExportZip = async () => {
    try {
      const zipBlob = await generateProjectZip(
        foodsCSV,
        mealsCSV,
        dailyValuesCSV,
        foodLogCSV
      );
      downloadBlob(zipBlob, 'vitaminarian-project.zip');
    } catch (err) {
      console.error('Failed to generate project zip:', err);
    }
  };

  const handleAcceptDisclaimer = () => {
    sessionStorage.setItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED, 'true');
    setIsDisclaimerOpen(false);
  };

  const handleOpenDisclaimerFromFooter = () => {
    setIsDisclaimerReadOnly(true);
    setIsDisclaimerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header Module */}
      <HeaderModule onExportZip={handleExportZip} />

      {/* Main Content Modules in strict top-to-bottom order */}
      <main className="flex-1 flex flex-col">
        {/* 2. Upload and Download Module */}
        <UploadDownloadModule
          foodsCSV={foodsCSV}
          mealsCSV={mealsCSV}
          dailyValuesCSV={dailyValuesCSV}
          foodLogCSV={foodLogCSV}
          onSaveData={handleSaveData}
        />

        {/* 3. Food Log Entry Module */}
        <FoodLogEntryModule
          selectedDate={selectedLogDate}
          onDateChange={setSelectedLogDate}
          foodsMap={foodsMap}
          mealsMap={mealsMap}
          foodLog={foodLog}
          onLogItem={handleLogItem}
          onDeleteItem={handleDeleteItem}
        />

        {/* 4. Nutrient Breakdown Module */}
        <NutrientBreakdownModule
          selectedLogDate={selectedLogDate}
          foodsMap={foodsMap}
          mealsMap={mealsMap}
          foodLog={foodLog}
          dailyValues={dailyValues}
          orderedNutrientCols={orderedNutrientCols}
        />
      </main>

      {/* 5. Footer Module */}
      <FooterModule
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenDisclaimer={handleOpenDisclaimerFromFooter}
      />

      {/* Modals & Dialogs */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onAccept={handleAcceptDisclaimer}
        showAcceptButton={!isDisclaimerReadOnly}
      />
    </div>
  );
}
