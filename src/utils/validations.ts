import { ValidationResult } from '../types/nutrition.ts';
import { parseCSV } from './csv.ts';

// Allowed characters in Food & Meal names: English letters, digits, spaces, and '-,\(\)
const NAME_REGEX = /^[A-Za-z0-9 '\-,\(\)]+$/;
// Nutrient column header format: <Nutrient Name> (<Unit>)
// <Nutrient Name>: nonempty, English letters, digits, spaces
// <Unit>: nonempty, English letters and μ/µ symbol
const NUTRIENT_HEADER_REGEX = /^([A-Za-z0-9 ]+) \(([A-Za-z\u00B5\u03BC]+)\)$/;

// Date format: MM/DD/YYYY with optional leading zeroes
const DATE_REGEX = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/;

function isValidCalendarDate(dateStr: string): boolean {
  const match = dateStr.match(DATE_REGEX);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Initial Validations for Foods file
 */
export function validateFoodsInitial(csvText: string): ValidationResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { valid: true, errors: [] }; // Empty files are valid
  }

  const errors: string[] = [];
  const header = rows[0];

  // 1. First 3 headers must be "Food Name", "Serving Size (g)", "Calories (kcal)" in that order
  if (header.length < 3) {
    errors.push('The Foods file must contain at least 3 columns: "Food Name", "Serving Size (g)", and "Calories (kcal)".');
    return { valid: false, errors };
  }
  if (header[0] !== 'Food Name') {
    errors.push(`First column header must be "Food Name", found "${header[0]}".`);
  }
  if (header[1] !== 'Serving Size (g)') {
    errors.push(`Second column header must be "Serving Size (g)", found "${header[1]}".`);
  }
  if (header[2] !== 'Calories (kcal)') {
    errors.push(`Third column header must be "Calories (kcal)", found "${header[2]}".`);
  }

  // 2. All column headers to the right of Calories must strictly follow "<Nutrient Name> (<Unit>)"
  const nutrientNames = new Set<string>();
  const nutrientUnits = new Map<string, string>();

  for (let c = 3; c < header.length; c++) {
    const col = header[c];
    const match = col.match(NUTRIENT_HEADER_REGEX);
    if (!match) {
      errors.push(`Column header "${col}" does not follow the format "<Nutrient Name> (<Unit>)" where Nutrient Name consists only of letters, digits, and spaces, and Unit consists only of letters and μ.`);
    } else {
      const nName = match[1].trim();
      const unit = match[2].trim();
      nutrientNames.add(nName);
      nutrientUnits.set(nName, unit);
    }
  }

  // 3. Nutrient columns "Fat", "Carbohydrates", and "Protein" must exist (in any order) and their units must be g
  const requiredMacros = ['Fat', 'Carbohydrates', 'Protein'];
  for (const macro of requiredMacros) {
    if (!nutrientNames.has(macro)) {
      errors.push(`Required nutrient column "${macro} (g)" is missing.`);
    } else if (nutrientUnits.get(macro) !== 'g') {
      errors.push(`Required nutrient column "${macro}" must have unit "g", found "${nutrientUnits.get(macro)}".`);
    }
  }

  // Row validation
  const seenFoodNames = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;

    // Pad row if shorter than header
    const foodName = (row[0] || '').trim();

    // 4. Food name nonempty and allowed chars
    if (!foodName) {
      errors.push(`Row ${rowNum}: Food name cannot be empty.`);
    } else if (!NAME_REGEX.test(foodName)) {
      errors.push(`Row ${rowNum}: Food name "${foodName}" contains invalid characters. Only English letters, digits, spaces, and '-,\() are allowed.`);
    }

    // 7. Duplicate food names
    if (foodName) {
      if (seenFoodNames.has(foodName)) {
        errors.push(`Duplicate food name "${foodName}" found at row ${rowNum}.`);
      } else {
        seenFoodNames.add(foodName);
      }
    }

    // 5. Serving size nonempty, numeric, positive
    const servingStr = row[1] !== undefined ? row[1].trim() : '';
    if (servingStr === '') {
      errors.push(`Row ${rowNum} ("${foodName}"): Serving size cannot be empty.`);
    } else {
      const servingVal = Number(servingStr);
      if (isNaN(servingVal) || servingVal <= 0) {
        errors.push(`Row ${rowNum} ("${foodName}"): Serving size must be a positive numeric value, found "${servingStr}".`);
      }
    }

    // 6. Calories and nutrients: empty or numeric and nonnegative
    for (let c = 2; c < header.length; c++) {
      const valStr = row[c] !== undefined ? row[c].trim() : '';
      if (valStr !== '') {
        const val = Number(valStr);
        if (isNaN(val) || val < 0) {
          const colName = header[c];
          errors.push(`Row ${rowNum} ("${foodName}"), Column "${colName}": Quantity must be numeric and nonnegative, found "${valStr}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Initial Validations for Meals file
 */
export function validateMealsInitial(csvText: string, knownFoods?: Set<string>, knownMeals?: Set<string>): ValidationResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { valid: true, errors: [] }; // Empty files are valid
  }

  const errors: string[] = [];
  const header = rows[0];

  // 1. Column headers must be Meal Name, Component, Quantity, and Unit in that order, with no additional columns
  const expectedHeaders = ['Meal Name', 'Component', 'Quantity', 'Unit'];
  if (header.length !== 4) {
    errors.push(`Meals file must have exactly 4 columns: [${expectedHeaders.join(', ')}], found ${header.length} columns.`);
  } else {
    for (let i = 0; i < 4; i++) {
      if (header[i] !== expectedHeaders[i]) {
        errors.push(`Column ${i + 1} must be "${expectedHeaders[i]}", found "${header[i]}".`);
      }
    }
  }

  // Track meal structure
  const mealsSeenInOrder: string[] = [];
  const mealComponents = new Map<string, Set<string>>();
  let currentMeal = '';

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const mealName = (row[0] || '').trim();
    const component = (row[1] || '').trim();
    const qtyStr = (row[2] || '').trim();
    const unit = (row[3] || '').trim();

    // 2. Meal name nonempty and allowed chars
    if (!mealName) {
      errors.push(`Row ${rowNum}: Meal Name cannot be empty.`);
    } else if (!NAME_REGEX.test(mealName)) {
      errors.push(`Row ${rowNum}: Meal Name "${mealName}" contains invalid characters.`);
    }

    // 3. No duplicate meal names (non-contiguous meal definitions)
    if (mealName) {
      if (mealName !== currentMeal) {
        if (mealsSeenInOrder.includes(mealName)) {
          errors.push(`Row ${rowNum}: Meal Name "${mealName}" is duplicated or defined non-contiguously.`);
        } else {
          mealsSeenInOrder.push(mealName);
          mealComponents.set(mealName, new Set<string>());
        }
        currentMeal = mealName;
      }
    }

    // Component name
    if (!component) {
      errors.push(`Row ${rowNum}: Component cannot be empty.`);
    } else {
      // 4. A meal may not list the same component more than once
      const comps = mealComponents.get(mealName);
      if (comps) {
        if (comps.has(component)) {
          errors.push(`Row ${rowNum}: Meal "${mealName}" lists duplicate component "${component}".`);
        } else {
          comps.add(component);
        }
      }
    }

    // A Meal may not contain itself as a Component
    if (mealName && component && mealName === component) {
      errors.push(`Row ${rowNum}: Meal "${mealName}" cannot contain itself as a component.`);
    }

    // 5. Quantity must be nonempty, numeric, and positive
    if (qtyStr === '') {
      errors.push(`Row ${rowNum}: Quantity cannot be empty.`);
    } else {
      const qty = Number(qtyStr);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${rowNum}: Quantity must be a positive numeric value, found "${qtyStr}".`);
      }
    }

    // 6 & 7. Unit validation: must be 'g' or 'servings'.
    if (unit !== 'g' && unit !== 'servings') {
      errors.push(`Row ${rowNum}: Unit must be "g" or "servings", found "${unit}".`);
    } else {
      // If we know this component is a meal, unit must be 'servings'
      if (knownMeals && knownMeals.has(component) && unit !== 'servings') {
        errors.push(`Row ${rowNum}: Component "${component}" is a meal and its unit must be "servings", found "${unit}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Initial Validations for Daily Values file
 */
export function validateDailyValuesInitial(csvText: string): ValidationResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { valid: true, errors: [] }; // Empty files are valid
  }

  const errors: string[] = [];
  const header = rows[0];

  // Daily values is a single-row file after header (or up to 1 data row)
  if (rows.length > 2) {
    errors.push(`Daily Values file must contain at most one data row, found ${rows.length - 1} data rows.`);
  }

  if (rows.length >= 2) {
    const row = rows[1];
    for (let c = 0; c < header.length; c++) {
      const valStr = row[c] !== undefined ? row[c].trim() : '';
      if (valStr !== '') {
        const val = Number(valStr);
        if (isNaN(val) || val < 0) {
          errors.push(`Column "${header[c]}": Daily value must be numeric and nonnegative, found "${valStr}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Initial Validations for Food Log file
 */
export function validateFoodLogInitial(csvText: string): ValidationResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { valid: true, errors: [] }; // Empty files are valid
  }

  const errors: string[] = [];
  const header = rows[0];

  // 1. First column header must be "Date"
  if (header[0] !== 'Date') {
    errors.push(`First column header must be "Date", found "${header[0]}".`);
  }

  // 2. All values in Date column must follow MM/DD/YYYY format
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const dateStr = (row[0] || '').trim();

    if (!dateStr) {
      errors.push(`Row ${rowNum}: Date cannot be empty.`);
    } else if (!isValidCalendarDate(dateStr)) {
      errors.push(`Row ${rowNum}: Date "${dateStr}" is invalid. It must strictly follow the format MM/DD/YYYY with optional leading zeroes.`);
    }

    // 3. All quantity values must either be empty or be numeric and nonnegative
    for (let c = 1; c < header.length; c++) {
      const valStr = row[c] !== undefined ? row[c].trim() : '';
      if (valStr !== '') {
        const val = Number(valStr);
        if (isNaN(val) || val < 0) {
          errors.push(`Row ${rowNum}, Column "${header[c]}": Quantity must be numeric and nonnegative, found "${valStr}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Final Validations across all 4 files
 */
export function validateFinal(
  foodsCSV: string,
  mealsCSV: string,
  dailyValuesCSV: string,
  foodLogCSV: string,
  foodsMergeMode?: 'merge' | 'replace',
  existingFoodsCSV?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const foodRows = parseCSV(foodsCSV);
  const mealRows = parseCSV(mealsCSV);
  const dvRows = parseCSV(dailyValuesCSV);
  const logRows = parseCSV(foodLogCSV);

  // Extract food names and nutrient headers
  const foodNames = new Set<string>();
  const foodHeaders: string[] = foodRows.length > 0 ? foodRows[0] : [];
  for (let r = 1; r < foodRows.length; r++) {
    const name = (foodRows[r][0] || '').trim();
    if (name) foodNames.add(name);
  }

  // Extract meals in order of appearance
  const mealNamesInOrder: string[] = [];
  const mealsMap = new Map<string, { component: string; unit: string }[]>();

  for (let r = 1; r < mealRows.length; r++) {
    const mealName = (mealRows[r][0] || '').trim();
    const comp = (mealRows[r][1] || '').trim();
    const unit = (mealRows[r][3] || '').trim();
    if (!mealName) continue;

    if (!mealsMap.has(mealName)) {
      mealNamesInOrder.push(mealName);
      mealsMap.set(mealName, []);
    }
    mealsMap.get(mealName)!.push({ component: comp, unit });
  }

  const mealNamesSet = new Set(mealNamesInOrder);

  // 1. No name may be shared between a Food in the Foods file and a Meal in the Meals file
  for (const f of foodNames) {
    if (mealNamesSet.has(f)) {
      errors.push(`Conflict: "${f}" exists as both a Food and a Meal. Foods and Meals must have unique names.`);
    }
  }

  // 2. If user uploads Foods file and merges with existing file, for each metadata column where metadata name matches, units must match
  if (foodsMergeMode === 'merge' && existingFoodsCSV) {
    const existingRows = parseCSV(existingFoodsCSV);
    if (existingRows.length > 0 && foodRows.length > 0) {
      const existingHeaders = existingRows[0];
      const newHeaders = foodRows[0];

      // Parse metadata: <Name> (<Unit>)
      const parseMeta = (h: string) => {
        const m = h.match(NUTRIENT_HEADER_REGEX);
        return m ? { name: m[1].trim(), unit: m[2].trim(), full: h } : null;
      };

      const existingMetas = new Map<string, string>();
      for (let c = 3; c < existingHeaders.length; c++) {
        const meta = parseMeta(existingHeaders[c]);
        if (meta) existingMetas.set(meta.name, meta.unit);
      }

      for (let c = 3; c < newHeaders.length; c++) {
        const meta = parseMeta(newHeaders[c]);
        if (meta && existingMetas.has(meta.name)) {
          const existingUnit = existingMetas.get(meta.name);
          if (existingUnit !== meta.unit) {
            errors.push(`Unit mismatch for nutrient "${meta.name}": existing file uses "${existingUnit}" but uploaded file uses "${meta.unit}".`);
          }
        }
      }
    }
  }

  // 3. For all rows in Meals file, each component must match a food in Foods or a meal in a previous row (grouped by meal)
  const allowedComponentsSoFar = new Set<string>(foodNames);
  for (const mName of mealNamesInOrder) {
    const comps = mealsMap.get(mName) || [];
    for (const c of comps) {
      if (!allowedComponentsSoFar.has(c.component)) {
        errors.push(`Meal "${mName}": Component "${c.component}" is not defined in the Foods file or in any preceding meal definition.`);
      } else {
        // Also check: if component is a meal, its unit must be servings
        if (mealNamesSet.has(c.component) && c.unit !== 'servings') {
          errors.push(`Meal "${mName}": Component "${c.component}" is a meal and its unit must be "servings".`);
        }
      }
    }
    allowedComponentsSoFar.add(mName);
  }

  // 4. In Food Log file, each column header after "Date" must either be the name of a food or a meal
  if (logRows.length > 0) {
    const logHeaders = logRows[0];
    for (let c = 1; c < logHeaders.length; c++) {
      const colName = logHeaders[c];
      if (!foodNames.has(colName) && !mealNamesSet.has(colName)) {
        errors.push(`Food Log column "${colName}" does not match any Food in the Foods file or Meal in the Meals file.`);
      }
    }
  }

  // 5. The list of column headers in Daily Values file must exactly match the list of column headers in Foods file after "Serving Size" and appear in the same order
  if (foodRows.length > 0 && dvRows.length > 0) {
    const expectedDVHeaders = foodHeaders.slice(2); // Headers after "Serving Size (g)" are "Calories (kcal)", "Fat (g)", ...
    const actualDVHeaders = dvRows[0];

    if (expectedDVHeaders.length !== actualDVHeaders.length) {
      errors.push(`Daily Values column count (${actualDVHeaders.length}) does not match Foods metadata column count (${expectedDVHeaders.length}). Expected headers starting from "Calories (kcal)".`);
    } else {
      for (let i = 0; i < expectedDVHeaders.length; i++) {
        if (expectedDVHeaders[i] !== actualDVHeaders[i]) {
          errors.push(`Daily Values column ${i + 1} must be "${expectedDVHeaders[i]}", found "${actualDVHeaders[i]}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
