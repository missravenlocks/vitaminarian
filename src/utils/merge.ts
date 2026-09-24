import { parseCSV, toCSV } from './csv';

export interface MergeFoodsResult {
  mergedCsv: string;
  warnings: string[];
}

/**
 * Merge logic for Foods.csv
 */
export function mergeFoods(existingCsv: string, uploadedCsv: string): MergeFoodsResult {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);
  const warnings: string[] = [];

  if (existingRows.length === 0) {
    return { mergedCsv: uploadedCsv, warnings };
  }
  if (uploadedRows.length === 0) {
    return { mergedCsv: existingCsv, warnings };
  }

  const existingHeaders = [...existingRows[0]];
  const uploadedHeaders = uploadedRows[0];

  // Map of column name -> index in existing
  const colIndexMap = new Map<string, number>();
  existingHeaders.forEach((h, i) => colIndexMap.set(h, i));

  // Identify new columns from uploaded
  const newColumns: string[] = [];
  uploadedHeaders.forEach(uh => {
    if (!colIndexMap.has(uh)) {
      colIndexMap.set(uh, existingHeaders.length + newColumns.length);
      newColumns.push(uh);
    }
  });

  const allHeaders = [...existingHeaders, ...newColumns];

  // Map of foodName -> row data (array of cells)
  const existingFoodMap = new Map<string, string[]>();
  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const foodName = (row[0] || '').trim();
    if (!foodName) continue;
    // Pad row if new columns exist
    const paddedRow = [...row];
    while (paddedRow.length < allHeaders.length) {
      paddedRow.push('0'); // default for new nutrient
    }
    existingFoodMap.set(foodName, paddedRow);
  }

  // Track if any new food lacks existing metadata columns
  let newFoodLacksMetadata = false;
  // Track if any new nutrient lacks existing foods
  const hasNewNutrient = newColumns.length > 0;

  // Process uploaded foods
  const uploadedFoodNames = new Set<string>();

  for (let r = 1; r < uploadedRows.length; r++) {
    const uRow = uploadedRows[r];
    const foodName = (uRow[0] || '').trim();
    if (!foodName) continue;
    uploadedFoodNames.add(foodName);

    const isExistingFood = existingFoodMap.has(foodName);

    if (isExistingFood) {
      // Existing food: replace existing cells with uploaded cells
      const rowData = existingFoodMap.get(foodName)!;
      for (let c = 1; c < uploadedHeaders.length; c++) {
        const colName = uploadedHeaders[c];
        const targetColIdx = colIndexMap.get(colName);
        if (targetColIdx !== undefined) {
          rowData[targetColIdx] = uRow[c] !== undefined ? uRow[c] : '';
        }
      }
    } else {
      // New food: check if uploaded headers include all metadata columns of existing file
      const missingExistingCols = existingHeaders.slice(1).some(eh => !uploadedHeaders.includes(eh));
      if (missingExistingCols) {
        newFoodLacksMetadata = true;
      }

      // Construct new row
      const newRow: string[] = new Array(allHeaders.length).fill('0');
      newRow[0] = foodName;
      for (let c = 1; c < uploadedHeaders.length; c++) {
        const colName = uploadedHeaders[c];
        const targetColIdx = colIndexMap.get(colName);
        if (targetColIdx !== undefined) {
          newRow[targetColIdx] = uRow[c] !== undefined ? uRow[c] : '0';
        }
      }
      existingFoodMap.set(foodName, newRow);
    }
  }

  if (newFoodLacksMetadata) {
    warnings.push('Warning: Newly added foods do not include all metadata columns present in the current file. These foods will be assumed to have a value of zero for missing metadata columns.');
  }

  if (hasNewNutrient) {
    const unincludedExistingFoods = Array.from(existingFoodMap.keys()).filter(fn => !uploadedFoodNames.has(fn));
    if (unincludedExistingFoods.length > 0) {
      warnings.push('Warning: Newly added nutrients do not include all existing foods in the current file. Non-included foods will be assumed to have a value of zero for these nutrients.');
    }
  }

  // Construct output rows
  const resultRows: string[][] = [allHeaders];
  for (const rowData of existingFoodMap.values()) {
    resultRows.push(rowData);
  }

  return {
    mergedCsv: toCSV(resultRows),
    warnings,
  };
}

/**
 * Merge logic for Meals.csv
 * Existing meals: Replace entire composition with uploaded, maintaining uploaded order.
 * Missing meals: Do nothing.
 * New meals: Append rows in uploaded order.
 */
export function mergeMeals(existingCsv: string, uploadedCsv: string): string {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return uploadedCsv;
  if (uploadedRows.length === 0) return existingCsv;

  const header = ['Meal Name', 'Component', 'Quantity', 'Unit'];

  // Parse existing meals preserving order of meal names
  const existingMealOrder: string[] = [];
  const existingMealMap = new Map<string, string[][]>();

  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const mName = (row[0] || '').trim();
    if (!mName) continue;
    if (!existingMealMap.has(mName)) {
      existingMealMap.set(mName, []);
      existingMealOrder.push(mName);
    }
    existingMealMap.get(mName)!.push(row);
  }

  // Parse uploaded meals preserving order
  const uploadedMealOrder: string[] = [];
  const uploadedMealMap = new Map<string, string[][]>();

  for (let r = 1; r < uploadedRows.length; r++) {
    const row = uploadedRows[r];
    const mName = (row[0] || '').trim();
    if (!mName) continue;
    if (!uploadedMealMap.has(mName)) {
      uploadedMealMap.set(mName, []);
      uploadedMealOrder.push(mName);
    }
    uploadedMealMap.get(mName)!.push(row);
  }

  // Construct final rows
  const finalRows: string[][] = [header];

  // For existing meals: if present in uploaded, replace; else keep
  for (const mName of existingMealOrder) {
    if (uploadedMealMap.has(mName)) {
      finalRows.push(...uploadedMealMap.get(mName)!);
    } else {
      finalRows.push(...existingMealMap.get(mName)!);
    }
  }

  // For new meals: append
  for (const mName of uploadedMealOrder) {
    if (!existingMealMap.has(mName)) {
      finalRows.push(...uploadedMealMap.get(mName)!);
    }
  }

  return toCSV(finalRows);
}

/**
 * Merge logic for Daily Values.csv
 * Existing cells: replace current value with uploaded.
 * Missing cells: do nothing.
 * New cells: append necessary nutrient columns.
 */
export function mergeDailyValues(existingCsv: string, uploadedCsv: string): string {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return uploadedCsv;
  if (uploadedRows.length === 0) return existingCsv;

  const existingHeaders = [...existingRows[0]];
  const uploadedHeaders = uploadedRows[0];

  const colIndexMap = new Map<string, number>();
  existingHeaders.forEach((h, i) => colIndexMap.set(h, i));

  const newColumns: string[] = [];
  uploadedHeaders.forEach(uh => {
    if (!colIndexMap.has(uh)) {
      colIndexMap.set(uh, existingHeaders.length + newColumns.length);
      newColumns.push(uh);
    }
  });

  const allHeaders = [...existingHeaders, ...newColumns];
  const existingDataRow = existingRows.length > 1 ? [...existingRows[1]] : [];
  while (existingDataRow.length < allHeaders.length) {
    existingDataRow.push('');
  }

  const uploadedDataRow = uploadedRows.length > 1 ? uploadedRows[1] : [];

  for (let c = 0; c < uploadedHeaders.length; c++) {
    const colName = uploadedHeaders[c];
    const targetIdx = colIndexMap.get(colName);
    if (targetIdx !== undefined && uploadedDataRow[c] !== undefined) {
      existingDataRow[targetIdx] = uploadedDataRow[c];
    }
  }

  return toCSV([allHeaders, existingDataRow]);
}

/**
 * Merge logic for Food Log.csv
 * Existing cells: replace with uploaded value.
 * Missing cells: do nothing.
 * New cells: append necessary food rows and/or item columns.
 */
export function mergeFoodLog(existingCsv: string, uploadedCsv: string): string {
  const existingRows = parseCSV(existingCsv);
  const uploadedRows = parseCSV(uploadedCsv);

  if (existingRows.length === 0) return uploadedCsv;
  if (uploadedRows.length === 0) return existingCsv;

  const existingHeaders = [...existingRows[0]];
  const uploadedHeaders = uploadedRows[0];

  const colIndexMap = new Map<string, number>();
  existingHeaders.forEach((h, i) => colIndexMap.set(h, i));

  const newColumns: string[] = [];
  uploadedHeaders.forEach(uh => {
    if (!colIndexMap.has(uh)) {
      colIndexMap.set(uh, existingHeaders.length + newColumns.length);
      newColumns.push(uh);
    }
  });

  const allHeaders = [...existingHeaders, ...newColumns];

  // Map of Date -> row array
  const dateRowMap = new Map<string, string[]>();

  for (let r = 1; r < existingRows.length; r++) {
    const row = existingRows[r];
    const dateStr = (row[0] || '').trim();
    if (!dateStr) continue;
    const padded = [...row];
    while (padded.length < allHeaders.length) {
      padded.push('');
    }
    dateRowMap.set(dateStr, padded);
  }

  for (let r = 1; r < uploadedRows.length; r++) {
    const uRow = uploadedRows[r];
    const dateStr = (uRow[0] || '').trim();
    if (!dateStr) continue;

    if (dateRowMap.has(dateStr)) {
      const row = dateRowMap.get(dateStr)!;
      for (let c = 1; c < uploadedHeaders.length; c++) {
        const colName = uploadedHeaders[c];
        const targetIdx = colIndexMap.get(colName);
        if (targetIdx !== undefined) {
          row[targetIdx] = uRow[c] !== undefined ? uRow[c] : '';
        }
      }
    } else {
      const newRow = new Array(allHeaders.length).fill('');
      newRow[0] = dateStr;
      for (let c = 1; c < uploadedHeaders.length; c++) {
        const colName = uploadedHeaders[c];
        const targetIdx = colIndexMap.get(colName);
        if (targetIdx !== undefined) {
          newRow[targetIdx] = uRow[c] !== undefined ? uRow[c] : '';
        }
      }
      dateRowMap.set(dateStr, newRow);
    }
  }

  const resultRows: string[][] = [allHeaders];
  for (const row of dateRowMap.values()) {
    resultRows.push(row);
  }

  return toCSV(resultRows);
}
