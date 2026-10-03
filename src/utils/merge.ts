import { parseCSV, stringifyCSV } from './csv.ts';

export interface MergeResult {
  mergedCSV: string;
  warnings: string[];
}

/**
 * Merge logic for Meals file
 */
export function mergeMealsCSV(existingCSV: string, uploadedCSV: string): MergeResult {
  const existingRows = parseCSV(existingCSV);
  const uploadedRows = parseCSV(uploadedCSV);

  if (existingRows.length === 0) return { mergedCSV: uploadedCSV, warnings: [] };
  if (uploadedRows.length === 0) return { mergedCSV: existingCSV, warnings: [] };

  const header = existingRows[0];

  // Group existing meals
  const existingMealsMap = new Map<string, string[][]>();
  const mealOrder: string[] = [];

  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const meal = (row[0] || '').trim();
    if (!meal) continue;
    if (!existingMealsMap.has(meal)) {
      mealOrder.push(meal);
      existingMealsMap.set(meal, []);
    }
    existingMealsMap.get(meal)!.push(row);
  }

  // Group uploaded meals
  const uploadedMealsMap = new Map<string, string[][]>();
  const uploadedMealOrder: string[] = [];

  for (let r = 1; r < uploadedRows.length; r++) {
    const row = uploadedRows[r];
    const meal = (row[0] || '').trim();
    if (!meal) continue;
    if (!uploadedMealsMap.has(meal)) {
      uploadedMealOrder.push(meal);
      uploadedMealsMap.set(meal, []);
    }
    uploadedMealsMap.get(meal)!.push(row);
  }

  const resultRows: string[][] = [];

  // 1. Existing meals: replace composition with uploaded file, maintaining uploaded row order
  // Missing meals: keep as is
  for (const meal of mealOrder) {
    if (uploadedMealsMap.has(meal)) {
      resultRows.push(...uploadedMealsMap.get(meal)!);
    } else {
      resultRows.push(...existingMealsMap.get(meal)!);
    }
  }

  // 2. New meals: append rows in same order as they appear in uploaded file
  for (const meal of uploadedMealOrder) {
    if (!existingMealsMap.has(meal)) {
      resultRows.push(...uploadedMealsMap.get(meal)!);
    }
  }

  return {
    mergedCSV: stringifyCSV(header, resultRows),
    warnings: []
  };
}

/**
 * Merge logic for Foods, Daily Values, and Food Log
 * Grouped by row-column cells:
 * - Existing cells: replace current value with uploaded value, even if empty
 * - Missing cells: do nothing (retain existing)
 * - New cells: append necessary rows and/or columns, store uploaded values
 */
export function mergeGridCSV(
  existingCSV: string,
  uploadedCSV: string,
  keyColumnIndex: number = 0,
  isFileFoods: boolean = false
): MergeResult {
  const existingRows = parseCSV(existingCSV);
  const uploadedRows = parseCSV(uploadedCSV);
  const warnings: string[] = [];

  if (existingRows.length === 0) return { mergedCSV: uploadedCSV, warnings: [] };
  if (uploadedRows.length === 0) return { mergedCSV: existingCSV, warnings: [] };

  const existingHeaders = [...existingRows[0]];
  const uploadedHeaders = [...uploadedRows[0]];

  // Build unified headers: start with existing, then append new uploaded headers in order
  const unifiedHeaders = [...existingHeaders];
  const newHeaderColumns: string[] = [];
  for (const h of uploadedHeaders) {
    if (!unifiedHeaders.includes(h)) {
      unifiedHeaders.push(h);
      newHeaderColumns.push(h);
    }
  }

  // Map existing rows by row key (e.g. Food Name or Date)
  // For Daily Values (single data row), key can be a constant like "__DV__"
  const isSingleRowDV = keyColumnIndex === -1;

  const existingDataMap = new Map<string, Map<string, string>>();
  const rowOrder: string[] = [];

  if (isSingleRowDV) {
    rowOrder.push('__DV__');
    const cellMap = new Map<string, string>();
    if (existingRows.length > 1) {
      for (let c = 0; c < existingHeaders.length; c++) {
        cellMap.set(existingHeaders[c], existingRows[1][c] || '');
      }
    }
    existingDataMap.set('__DV__', cellMap);
  } else {
    for (let r = 1; r < existingRows.length; r++) {
      const row = existingRows[r];
      const key = (row[keyColumnIndex] || '').trim();
      if (!key) continue;
      if (!existingDataMap.has(key)) {
        rowOrder.push(key);
        existingDataMap.set(key, new Map<string, string>());
      }
      for (let c = 0; c < existingHeaders.length; c++) {
        existingDataMap.get(key)!.set(existingHeaders[c], row[c] !== undefined ? row[c] : '');
      }
    }
  }

  // Process uploaded rows
  const newRowKeys: string[] = [];
  const missingColsForNewFoods: Record<string, string[]> = {};

  if (isSingleRowDV) {
    if (uploadedRows.length > 1) {
      const cellMap = existingDataMap.get('__DV__')!;
      for (let c = 0; c < uploadedHeaders.length; c++) {
        cellMap.set(uploadedHeaders[c], uploadedRows[1][c] !== undefined ? uploadedRows[1][c] : '');
      }
    }
  } else {
    for (let r = 1; r < uploadedRows.length; r++) {
      const row = uploadedRows[r];
      const key = (row[keyColumnIndex] || '').trim();
      if (!key) continue;

      if (!existingDataMap.has(key)) {
        // New row!
        newRowKeys.push(key);
        rowOrder.push(key);
        const cellMap = new Map<string, string>();
        // Populate uploaded columns
        for (let c = 0; c < uploadedHeaders.length; c++) {
          cellMap.set(uploadedHeaders[c], row[c] !== undefined ? row[c] : '');
        }

        if (isFileFoods) {
          // Check if new food includes all existing metadata columns
          const missingForThisFood: string[] = [];
          for (let c = 1; c < existingHeaders.length; c++) {
            if (!uploadedHeaders.includes(existingHeaders[c])) {
              missingForThisFood.push(existingHeaders[c]);
              cellMap.set(existingHeaders[c], '0'); // default assumed zero
            }
          }
          if (missingForThisFood.length > 0) {
            missingColsForNewFoods[key] = missingForThisFood;
          }
        }
        existingDataMap.set(key, cellMap);
      } else {
        // Existing row: replace cells for columns present in uploaded
        const cellMap = existingDataMap.get(key)!;
        for (let c = 0; c < uploadedHeaders.length; c++) {
          cellMap.set(uploadedHeaders[c], row[c] !== undefined ? row[c] : '');
        }
      }
    }
  }

  // Foods file warning checks:
  if (isFileFoods) {
    const newFoodsWithMissingCols = Object.keys(missingColsForNewFoods);
    if (newFoodsWithMissingCols.length > 0) {
      warnings.push(
        `The following new foods do not include all metadata columns present in the current file and will be assumed to have a value of zero for these columns: ${newFoodsWithMissingCols.join(', ')}.`
      );
    }

    if (newHeaderColumns.length > 0) {
      // Check if new nutrient columns include all existing food rows
      const existingFoodKeys = rowOrder.filter(k => !newRowKeys.includes(k));
      if (existingFoodKeys.length > 0) {
        warnings.push(
          `The new nutrient(s) ${newHeaderColumns.join(', ')} were not included for all existing foods; non-included foods will be assumed to have a value of zero for these nutrients.`
        );
      }
    }
  }

  // Reconstruct matrix
  const outputRows: string[][] = [];
  for (const key of rowOrder) {
    const cellMap = existingDataMap.get(key)!;
    const row: string[] = [];
    for (const h of unifiedHeaders) {
      if (h === unifiedHeaders[keyColumnIndex] && !isSingleRowDV) {
        row.push(key);
      } else {
        const val = cellMap.get(h);
        row.push(val !== undefined ? val : (isFileFoods ? '0' : ''));
      }
    }
    outputRows.push(row);
  }

  return {
    mergedCSV: stringifyCSV(unifiedHeaders, outputRows),
    warnings
  };
}
