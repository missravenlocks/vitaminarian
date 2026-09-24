import { parseCSV } from './csv';
import { ValidationResult } from '../types/nutrition';

// Punctuation allowed in food/meal names: '-,()
const ALLOWED_NAME_REGEX = /^[A-Za-z0-9 '\-,()]+$/;
const NUTRIENT_HEADER_REGEX = /^([A-Za-z0-9 ]+) \(([A-Za-zμ]+)\)$/;
const DATE_FORMAT_REGEX = /^([1-9]|0[1-9]|1[0-2])\/([1-9]|0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

/**
 * Extract nutrient name and unit from header like "Fat (g)" or "Vitamin A (μg)"
 */
export function parseNutrientHeader(header: string): { name: string; unit: string } | null {
  const match = header.trim().match(NUTRIENT_HEADER_REGEX);
  if (!match) return null;
  return {
    name: match[1].trim(),
    unit: match[2].trim(),
  };
}

/**
 * Initial validations for Foods.csv
 */
export function validateFoodsCSV(csvText: string): ValidationResult {
  const errors: string[] = [];
  const rows = parseCSV(csvText);

  // Empty files are considered valid
  if (rows.length === 0) {
    return { valid: true, errors: [] };
  }

  const header = rows[0].map(h => h.trim());

  // 1. The first 3 column headers must be "Food Name", "Serving Size (g)", and "Calories (kcal)", in that order.
  if (header.length < 3 || header[0] !== 'Food Name' || header[1] !== 'Serving Size (g)' || header[2] !== 'Calories (kcal)') {
    errors.push('The first 3 column headers must be "Food Name", "Serving Size (g)", and "Calories (kcal)", in that order.');
  }

  // 2. All column headers to the right of Calories must strictly follow format "<Nutrient Name> (<Unit>)"
  const nutrientHeaders = header.slice(3);
  const parsedNutrients: { name: string; unit: string; header: string }[] = [];

  nutrientHeaders.forEach((h, index) => {
    const colNum = index + 4;
    const match = parseNutrientHeader(h);
    if (!match) {
      errors.push(`Column ${colNum} header "${h}" is invalid. All column headers to the right of Calories must strictly follow the format "<Nutrient Name> (<Unit>)" with letters, digits, spaces for name and letters or μ for unit.`);
    } else {
      parsedNutrients.push({ ...match, header: h });
    }
  });

  // 3. Nutrient columns "Fat", "Carbohydrates", and "Protein" must exist (in any order) and their units must be g.
  const fatCol = parsedNutrients.find(n => n.name === 'Fat');
  const carbCol = parsedNutrients.find(n => n.name === 'Carbohydrates');
  const proteinCol = parsedNutrients.find(n => n.name === 'Protein');

  if (!fatCol || fatCol.unit !== 'g') {
    errors.push('Nutrient column "Fat" must exist and its unit must be "g" (e.g. "Fat (g)").');
  }
  if (!carbCol || carbCol.unit !== 'g') {
    errors.push('Nutrient column "Carbohydrates" must exist and its unit must be "g" (e.g. "Carbohydrates (g)").');
  }
  if (!proteinCol || proteinCol.unit !== 'g') {
    errors.push('Nutrient column "Protein" must exist and its unit must be "g" (e.g. "Protein (g)").');
  }

  // Data rows validations
  const foodNames = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const foodName = (row[0] || '').trim();
    const servingSizeStr = (row[1] || '').trim();

    // 4. All food names must be nonempty and may only consist of English letters, digits, spaces, and punctuation: '-,()
    if (!foodName) {
      errors.push(`Row ${r + 1}: Food name must not be empty.`);
    } else if (!ALLOWED_NAME_REGEX.test(foodName)) {
      errors.push(`Row ${r + 1}: Food name "${foodName}" contains invalid characters. Allowed characters: English letters, digits, spaces, and punctuation: '-,()`);
    }

    // 7. There may not be duplicate food names.
    if (foodName) {
      if (foodNames.has(foodName)) {
        errors.push(`Row ${r + 1}: Duplicate food name "${foodName}". Each food must have a unique name.`);
      }
      foodNames.add(foodName);
    }

    // 5. All serving sizes must be nonempty, numeric, and positive.
    if (!servingSizeStr) {
      errors.push(`Row ${r + 1} ("${foodName || 'Unknown'}"): Serving size must not be empty.`);
    } else {
      const servingSize = Number(servingSizeStr);
      if (isNaN(servingSize) || servingSize <= 0) {
        errors.push(`Row ${r + 1} ("${foodName}"): Serving size must be numeric and positive (> 0). Found: "${servingSizeStr}".`);
      }
    }

    // 6. All quantity values other than serving size must either be empty or be numeric and nonnegative.
    for (let c = 2; c < header.length; c++) {
      const val = (row[c] || '').trim();
      const colName = header[c];
      if (val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          errors.push(`Row ${r + 1} ("${foodName}"), Column "${colName}": Value must be numeric and non-negative (>= 0) or empty. Found: "${val}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Initial validations for Meals.csv
 */
export function validateMealsCSV(
  csvText: string,
  knownFoodNames?: Set<string>,
  knownMealNames?: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const rows = parseCSV(csvText);

  // Empty files are considered valid
  if (rows.length === 0) {
    return { valid: true, errors: [] };
  }

  const header = rows[0].map(h => h.trim());

  // 1. Column headers must be Meal Name, Component, Quantity, and Unit, in that order, with no additional columns.
  const expectedHeader = ['Meal Name', 'Component', 'Quantity', 'Unit'];
  if (header.length !== 4 || !expectedHeader.every((h, i) => header[i] === h)) {
    errors.push('The column headers must be Meal Name, Component, Quantity, and Unit, in that order, with no additional columns.');
  }

  const seenMealGroups = new Set<string>();
  let currentMealGroup = '';
  const mealComponentsMap = new Map<string, Set<string>>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const mealName = (row[0] || '').trim();
    const component = (row[1] || '').trim();
    const quantityStr = (row[2] || '').trim();
    const unit = (row[3] || '').trim();

    // 2. All meal names must be nonempty and may only consist of English letters, digits, spaces, and punctuation: '-,()
    if (!mealName) {
      errors.push(`Row ${r + 1}: Meal Name must not be empty.`);
    } else if (!ALLOWED_NAME_REGEX.test(mealName)) {
      errors.push(`Row ${r + 1}: Meal Name "${mealName}" contains invalid characters. Allowed: English letters, digits, spaces, and '-,()`);
    }

    // 3. Duplicate meal check: Verify contiguous grouping
    if (mealName) {
      if (mealName !== currentMealGroup) {
        if (seenMealGroups.has(mealName)) {
          errors.push(`Row ${r + 1}: Duplicate meal definition for "${mealName}". Rows for a meal must be grouped together.`);
        }
        seenMealGroups.add(mealName);
        currentMealGroup = mealName;
      }
    }

    // 4. A meal may not list the same component more than once.
    if (mealName && component) {
      if (!mealComponentsMap.has(mealName)) {
        mealComponentsMap.set(mealName, new Set());
      }
      const compSet = mealComponentsMap.get(mealName)!;
      if (compSet.has(component)) {
        errors.push(`Row ${r + 1}: Meal "${mealName}" lists duplicate component "${component}". A meal may not list the same component more than once.`);
      }
      compSet.add(component);
    }

    // 5. All quantity values must be nonempty, numeric, and positive.
    if (!quantityStr) {
      errors.push(`Row ${r + 1} (Meal "${mealName}"): Quantity must not be empty.`);
    } else {
      const qty = Number(quantityStr);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${r + 1} (Meal "${mealName}"): Quantity must be numeric and positive (> 0). Found: "${quantityStr}".`);
      }
    }

    // 6 & 7: Check units if known foods/meals provided
    if (component && knownFoodNames && knownMealNames) {
      const isFood = knownFoodNames.has(component);
      const isMeal = knownMealNames.has(component);
      if (isFood && !['g', 'servings'].includes(unit)) {
        errors.push(`Row ${r + 1}: Component "${component}" is a food, so Unit must be "g" or "servings". Found: "${unit}".`);
      } else if (isMeal && unit !== 'servings') {
        errors.push(`Row ${r + 1}: Component "${component}" is a meal, so Unit must be "servings". Found: "${unit}".`);
      }
    } else {
      // General format check for Unit
      if (!['g', 'servings'].includes(unit)) {
        errors.push(`Row ${r + 1}: Unit must be "g" or "servings". Found: "${unit}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Initial validations for Daily Values.csv
 */
export function validateDailyValuesCSV(csvText: string): ValidationResult {
  const errors: string[] = [];
  const rows = parseCSV(csvText);

  // Empty files are considered valid
  if (rows.length === 0) {
    return { valid: true, errors: [] };
  }

  const header = rows[0];

  // Daily values has 1 row of headers and at most 1 row of values
  if (rows.length > 2) {
    errors.push('Daily Values file must be a single-row data file (1 header row followed by 1 data row).');
  }

  if (rows.length >= 2) {
    const dataRow = rows[1];
    // 1. All daily values must either be empty or be numeric and nonnegative
    for (let c = 0; c < header.length; c++) {
      const val = (dataRow[c] || '').trim();
      const colName = header[c] || `Column ${c + 1}`;
      if (val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          errors.push(`Column "${colName}": Daily value must be numeric and non-negative (>= 0) or empty. Found: "${val}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Initial validations for Food Log.csv
 */
export function validateFoodLogCSV(csvText: string): ValidationResult {
  const errors: string[] = [];
  const rows = parseCSV(csvText);

  // Empty files are considered valid
  if (rows.length === 0) {
    return { valid: true, errors: [] };
  }

  const header = rows[0].map(h => h.trim());

  // 1. The first column header must be "Date".
  if (header.length === 0 || header[0] !== 'Date') {
    errors.push('The first column header in Food Log must be "Date".');
  }

  // Data rows
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const dateStr = (row[0] || '').trim();

    // 2. All values in Date column must follow format MM/DD/YYYY (leading zeroes optional)
    if (!dateStr || !DATE_FORMAT_REGEX.test(dateStr)) {
      errors.push(`Row ${r + 1}: Date "${dateStr}" must follow format MM/DD/YYYY with leading zeroes optional (e.g. 9/23/2026 or 09/23/2026).`);
    }

    // 3. All quantity values must either be empty or be numeric and nonnegative
    for (let c = 1; c < header.length; c++) {
      const val = (row[c] || '').trim();
      const colName = header[c] || `Column ${c + 1}`;
      if (val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          errors.push(`Row ${r + 1} (${dateStr}), Column "${colName}": Quantity must be numeric and non-negative (>= 0) or empty. Found: "${val}".`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Final Validations across all 4 files
 */
export function runFinalValidations(
  foodsCsv: string,
  mealsCsv: string,
  dailyValuesCsv: string,
  foodLogCsv: string,
  uploadedFoodsCsv?: string,
  isFoodsMerged?: boolean
): ValidationResult {
  const errors: string[] = [];

  const foodRows = parseCSV(foodsCsv);
  const mealRows = parseCSV(mealsCsv);
  const dvRows = parseCSV(dailyValuesCsv);
  const logRows = parseCSV(foodLogCsv);

  const foodNames = new Set<string>();
  const mealNames = new Set<string>();

  // Extract food names
  if (foodRows.length > 1) {
    for (let r = 1; r < foodRows.length; r++) {
      const name = (foodRows[r][0] || '').trim();
      if (name) foodNames.add(name);
    }
  }

  // Extract meal names and group rows by meal
  const mealOrder: string[] = [];
  const mealsMap = new Map<string, { component: string; quantity: number; unit: string }[]>();

  if (mealRows.length > 1) {
    for (let r = 1; r < mealRows.length; r++) {
      const mName = (mealRows[r][0] || '').trim();
      const comp = (mealRows[r][1] || '').trim();
      const qty = Number((mealRows[r][2] || '0').trim());
      const unit = (mealRows[r][3] || '').trim();
      if (!mName) continue;

      if (!mealsMap.has(mName)) {
        mealsMap.set(mName, []);
        mealOrder.push(mName);
      }
      mealNames.add(mName);
      mealsMap.get(mName)!.push({ component: comp, quantity: qty, unit });
    }
  }

  // 1. No name may be shared between a Food in the Foods file and a Meal in the Meals file.
  for (const fName of foodNames) {
    if (mealNames.has(fName)) {
      errors.push(`Name collision: "${fName}" cannot be used as both a Food name and a Meal name.`);
    }
  }

  // 2. If user uploads a Foods file and chooses to merge it with existing file,
  // then for each metadata column in the user's file in which the metadata name matches
  // the metadata name of a column in the existing file, the units must also match.
  if (uploadedFoodsCsv && isFoodsMerged && foodRows.length > 0) {
    const uploadedFoodRows = parseCSV(uploadedFoodsCsv);
    if (uploadedFoodRows.length > 0) {
      const existingHeaders = foodRows[0].map(h => h.trim());
      const uploadedHeaders = uploadedFoodRows[0].map(h => h.trim());

      const existingColUnits = new Map<string, string>();
      existingHeaders.forEach(h => {
        const parsed = parseNutrientHeader(h);
        if (parsed) {
          existingColUnits.set(parsed.name, parsed.unit);
        }
      });

      uploadedHeaders.forEach(h => {
        const parsed = parseNutrientHeader(h);
        if (parsed && existingColUnits.has(parsed.name)) {
          const existingUnit = existingColUnits.get(parsed.name);
          if (existingUnit !== parsed.unit) {
            errors.push(`Unit mismatch for nutrient "${parsed.name}": existing file uses "${existingUnit}", but uploaded file uses "${parsed.unit}".`);
          }
        }
      });
    }
  }

  // 3. For all rows in the Meals file, each component must match a food listed in the Foods file
  // or a meal listed in a previous row of the Meals file (after grouping all rows by meal without otherwise changing order).
  // Also: A meal may not contain itself as a component.
  const definedMealsSoFar = new Set<string>();

  for (const mName of mealOrder) {
    const components = mealsMap.get(mName) || [];
    for (const comp of components) {
      if (comp.component === mName) {
        errors.push(`Meal "${mName}" cannot contain itself as a component.`);
      } else if (!foodNames.has(comp.component) && !definedMealsSoFar.has(comp.component)) {
        if (mealNames.has(comp.component)) {
          errors.push(`Meal "${mName}" references component meal "${comp.component}" before "${comp.component}" is defined. Meal components must refer to foods or previously defined meals.`);
        } else {
          errors.push(`Meal "${mName}" references unknown component "${comp.component}". Every component must match an existing food or previous meal.`);
        }
      }
    }
    definedMealsSoFar.add(mName);
  }

  // 4. In the Food Log file, each column header after "Date" must either be the name of a food
  // in the Foods file or a meal in the Meals file.
  if (logRows.length > 0) {
    const logHeader = logRows[0].map(h => h.trim());
    for (let c = 1; c < logHeader.length; c++) {
      const itemHeader = logHeader[c];
      if (itemHeader && !foodNames.has(itemHeader) && !mealNames.has(itemHeader)) {
        errors.push(`Food Log column "${itemHeader}" does not match any Food in Foods.csv or Meal in Meals.csv.`);
      }
    }
  }

  // 5. The list of column headers in the Daily Values file must exactly match the list of
  // column headers in Foods file after the "Serving Size" column and must appear in the same order.
  if (foodRows.length > 0 && dvRows.length > 0) {
    const foodHeaders = foodRows[0].map(h => h.trim());
    const servingSizeIdx = foodHeaders.indexOf('Serving Size (g)');
    
    if (servingSizeIdx !== -1) {
      const expectedDvHeaders = foodHeaders.slice(servingSizeIdx + 1);
      const actualDvHeaders = dvRows[0].map(h => h.trim());

      if (expectedDvHeaders.length !== actualDvHeaders.length) {
        errors.push(`Daily Values column count (${actualDvHeaders.length}) does not match the expected count (${expectedDvHeaders.length}) from Foods.csv after Serving Size.`);
      } else {
        for (let i = 0; i < expectedDvHeaders.length; i++) {
          if (expectedDvHeaders[i] !== actualDvHeaders[i]) {
            errors.push(`Daily Values column ${i + 1} is "${actualDvHeaders[i]}", but expected "${expectedDvHeaders[i]}" to match Foods.csv in exact sequence.`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
