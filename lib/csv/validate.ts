import {
  FOOD_NAME_PATTERN,
  METADATA_HEADER_PATTERN,
  parseCsv,
  parseNumeric,
} from "./parse";

const REQUIRED_METADATA = [
  "Serving Size (g)",
  "Calories (kcal)",
  "Fat (g)",
  "Carbohydrates (g)",
  "Protein (g)",
];

export function validateFoodInfoInitial(content: string): string[] {
  const errors: string[] = [];
  const rows = parseCsv(content);

  if (rows.length === 0) {
    errors.push('File must contain a header row with "Food Name" as the first column.');
    return errors;
  }

  const headers = rows[0];

  if (headers[0] !== "Food Name") {
    errors.push('The first column header must be "Food Name".');
  }

  let dailyValueCount = 0;
  const foodNames = new Set<string>();

  for (let i = 1; i < headers.length; i++) {
    const h = headers[i];
    if (!METADATA_HEADER_PATTERN.test(h)) {
      errors.push(
        `Column header "${h}" does not follow the format "<Metadata Name> (<Unit>)".`
      );
    }
  }

  for (const req of REQUIRED_METADATA) {
    if (!headers.includes(req)) {
      errors.push(`Required metadata column "${req}" is missing.`);
    }
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = row[0]?.trim() ?? "";

    if (name === "Daily Value") {
      dailyValueCount++;
      const servingIdx = headers.findIndex((h) => h.startsWith("Serving Size"));
      if (servingIdx >= 0 && row[servingIdx]?.trim()) {
        errors.push('Serving Size (g) for the Daily Value row must be blank.');
      }
    } else if (name) {
      if (!FOOD_NAME_PATTERN.test(name)) {
        errors.push(
          `Food Name "${name}" contains invalid characters.`
        );
      }
      if (foodNames.has(name)) {
        errors.push(`Duplicate Food Name "${name}".`);
      }
      foodNames.add(name);

      const servingIdx = headers.findIndex((h) => h.startsWith("Serving Size"));
      if (servingIdx >= 0) {
        const ss = row[servingIdx]?.trim();
        if (!ss) {
          errors.push(`Serving Size for "${name}" must be positive.`);
        } else {
          const n = parseFloat(ss);
          if (isNaN(n) || n <= 0) {
            errors.push(`Serving Size for "${name}" must be positive.`);
          }
        }
      }
    }

    for (let c = 1; c < headers.length; c++) {
      const val = row[c]?.trim() ?? "";
      if (val !== "") {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) {
          errors.push(
            `Invalid quantity "${val}" in row "${name || r}", column "${headers[c]}".`
          );
        }
      }
    }
  }

  if (dailyValueCount === 0) {
    errors.push('There must be exactly one row with "Daily Value" in the "Food Name" column.');
  } else if (dailyValueCount > 1) {
    errors.push('There must be exactly one row with "Daily Value" in the "Food Name" column.');
  }

  return errors;
}

export function validateMealsInitial(content: string): string[] {
  const errors: string[] = [];
  const trimmed = content.trim();

  if (!trimmed) return errors;

  const rows = parseCsv(content);

  if (rows.length === 0) {
    errors.push("Meals file is empty but not valid.");
    return errors;
  }

  const headers = rows[0];
  const expected = ["Meal Name", "Component", "Quantity", "Unit"];

  if (
    headers.length !== 4 ||
    headers[0] !== expected[0] ||
    headers[1] !== expected[1] ||
    headers[2] !== expected[2] ||
    headers[3] !== expected[3]
  ) {
    errors.push(
      "Column headers must be Meal Name, Component, Quantity, and Unit, in that order, with no additional columns."
    );
  }

  const mealNames = new Set<string>();
  const mealComponents = new Map<string, Set<string>>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const mealName = row[0]?.trim() ?? "";
    const component = row[1]?.trim() ?? "";
    const quantityStr = row[2]?.trim() ?? "";
    const unit = row[3]?.trim() ?? "";

    if (!mealName) continue;

    if (!FOOD_NAME_PATTERN.test(mealName)) {
      errors.push(`Meal Name "${mealName}" contains invalid characters.`);
    }

    if (!mealNames.has(mealName)) {
      mealNames.add(mealName);
    }

    if (!mealComponents.has(mealName)) {
      mealComponents.set(mealName, new Set());
    }
    const comps = mealComponents.get(mealName)!;
    if (component && comps.has(component)) {
      errors.push(
        `Meal "${mealName}" lists Component "${component}" more than once.`
      );
    }
    if (component) comps.add(component);

    if (!quantityStr) {
      errors.push(
        `Quantity for Component "${component}" in Meal "${mealName}" must be nonempty, numeric, and positive.`
      );
    } else {
      const q = parseFloat(quantityStr);
      if (isNaN(q) || q <= 0) {
        errors.push(
          `Quantity for Component "${component}" in Meal "${mealName}" must be positive.`
        );
      }
    }

    if (unit !== "g" && unit !== "servings") {
      errors.push(
        `Unit "${unit}" for Component "${component}" in Meal "${mealName}" must be "g" or "servings".`
      );
    }
  }

  const seenMeals = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const mealName = rows[r][0]?.trim() ?? "";
    if (mealName && seenMeals.has(mealName)) {
      // duplicate meal name check across distinct meals
    }
  }

  const uniqueMeals: string[] = [];
  for (let r = 1; r < rows.length; r++) {
    const mealName = rows[r][0]?.trim() ?? "";
    if (mealName && !uniqueMeals.includes(mealName)) {
      uniqueMeals.push(mealName);
    }
  }

  const mealNameList: string[] = [];
  for (const m of uniqueMeals) {
    if (mealNameList.includes(m)) {
      errors.push(`Duplicate Meal Name "${m}".`);
    }
    mealNameList.push(m);
  }

  return errors;
}

export function validateFoodLogInitial(content: string): string[] {
  const errors: string[] = [];
  const trimmed = content.trim();

  if (!trimmed) return errors;

  const rows = parseCsv(content);

  if (rows.length === 0) {
    return errors;
  }

  const headers = rows[0];

  if (headers[0] !== "Date") {
    errors.push('The first column header must be "Date".');
  }

  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const date = row[0]?.trim() ?? "";
    if (!date) continue;

    if (!datePattern.test(date)) {
      errors.push(
        `Date "${date}" in row ${r + 1} does not follow the format MM/DD/YYYY.`
      );
    }

    for (let c = 1; c < headers.length; c++) {
      const val = row[c]?.trim() ?? "";
      if (val !== "") {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) {
          errors.push(
            `Invalid quantity "${val}" in row ${r + 1}, column "${headers[c]}".`
          );
        }
      }
    }
  }

  return errors;
}

export function validateFinal(
  foodInfoContent: string,
  mealsContent: string,
  foodLogContent: string,
  uploadedFoodInfo?: string,
  uploadedMeals?: string
): string[] {
  const errors: string[] = [];

  const foodInfo = parseCsv(foodInfoContent);
  const meals = parseCsv(mealsContent.trim());
  const foodLog = parseCsv(foodLogContent.trim());

  const foodNames = new Set<string>();
  for (let r = 1; r < foodInfo.length; r++) {
    const name = foodInfo[r][0]?.trim();
    if (name && name !== "Daily Value") {
      foodNames.add(name);
    }
  }

  const mealNames = new Set<string>();
  if (meals.length > 1) {
    for (let r = 1; r < meals.length; r++) {
      const name = meals[r][0]?.trim();
      if (name) mealNames.add(name);
    }
  }

  for (const food of foodNames) {
    if (mealNames.has(food)) {
      errors.push(
        `Name "${food}" is shared between a Food and a Meal, which is not allowed.`
      );
    }
  }

  if (uploadedFoodInfo) {
    const existingHeaders = foodInfo[0] ?? [];
    const uploaded = parseCsv(uploadedFoodInfo);
    const uploadedHeaders = uploaded[0] ?? [];

    for (const uh of uploadedHeaders.slice(1)) {
      const match = uh.match(METADATA_HEADER_PATTERN);
      if (!match) continue;
      const metaName = match[1].trim();
      const unit = match[2];

      for (const eh of existingHeaders.slice(1)) {
        const eMatch = eh.match(METADATA_HEADER_PATTERN);
        if (eMatch && eMatch[1].trim() === metaName && eMatch[2] !== unit) {
          errors.push(
            `Metadata column "${metaName}" has unit "${unit}" in uploaded file but unit "${eMatch[2]}" in existing file. Units must match when merging.`
          );
        }
      }
    }
  }

  if (meals.length > 1) {
    const mealOrder: string[] = [];
    for (let r = 1; r < meals.length; r++) {
      const mealName = meals[r][0]?.trim() ?? "";
      if (mealName && !mealOrder.includes(mealName)) {
        mealOrder.push(mealName);
      }
    }

    const availableMeals = new Set<string>();

    for (let r = 1; r < meals.length; r++) {
      const mealName = meals[r][0]?.trim() ?? "";
      const component = meals[r][1]?.trim() ?? "";
      const unit = meals[r][3]?.trim() ?? "";

      if (!component) continue;

      const isFood = foodNames.has(component);
      const isMeal = mealNames.has(component);

      if (!isFood && !isMeal) {
        const mealsBefore = new Set<string>();
        for (const m of mealOrder) {
          if (m === mealName) break;
          mealsBefore.add(m);
        }
        if (!mealsBefore.has(component)) {
          errors.push(
            `Component "${component}" in Meal "${mealName}" does not match a Food or a Meal defined in a previous row.`
          );
        }
      }

      if (isMeal && unit !== "servings") {
        errors.push(
          `Unit for Meal Component "${component}" in Meal "${mealName}" must be "servings".`
        );
      }

      if (isFood && unit !== "g" && unit !== "servings") {
        errors.push(
          `Unit for Food Component "${component}" in Meal "${mealName}" must be "g" or "servings".`
        );
      }
    }
  }

  if (foodLog.length > 0) {
    const logHeaders = foodLog[0];
    for (let c = 1; c < logHeaders.length; c++) {
      const col = logHeaders[c];
      if (!foodNames.has(col) && !mealNames.has(col)) {
        errors.push(
          `Column header "${col}" in Food Log does not match a Food or Meal.`
        );
      }
    }
  }

  return errors;
}

export function validateMealsComponentsWithFoods(
  mealsContent: string,
  foodInfoContent: string
): string[] {
  const errors: string[] = [];
  const trimmed = mealsContent.trim();
  if (!trimmed) return errors;

  const foodInfo = parseCsv(foodInfoContent);
  const meals = parseCsv(trimmed);

  const foodNames = new Set<string>();
  for (let r = 1; r < foodInfo.length; r++) {
    const name = foodInfo[r][0]?.trim();
    if (name && name !== "Daily Value") foodNames.add(name);
  }

  const mealNames = new Set<string>();
  const mealOrder: string[] = [];
  for (let r = 1; r < meals.length; r++) {
    const name = meals[r][0]?.trim();
    if (name && !mealNames.has(name)) {
      mealNames.add(name);
      mealOrder.push(name);
    }
  }

  for (let r = 1; r < meals.length; r++) {
    const mealName = meals[r][0]?.trim() ?? "";
    const component = meals[r][1]?.trim() ?? "";
    const unit = meals[r][3]?.trim() ?? "";

    if (!component) continue;

    const isFood = foodNames.has(component);
    const isMeal = mealNames.has(component);

    if (isFood && isMeal) continue;

    if (!isFood && !isMeal) {
      errors.push(
        `Component "${component}" in Meal "${mealName}" does not match any Food or Meal.`
      );
    } else if (isMeal) {
      const mealIdx = mealOrder.indexOf(mealName);
      const compIdx = mealOrder.indexOf(component);
      if (compIdx >= mealIdx) {
        errors.push(
          `Component "${component}" in Meal "${mealName}" must reference a Meal from a previous row.`
        );
      }
      if (unit !== "servings") {
        errors.push(
          `Unit for Meal Component "${component}" must be "servings".`
        );
      }
    } else if (isFood && unit !== "g" && unit !== "servings") {
      errors.push(
        `Unit for Food Component "${component}" must be "g" or "servings".`
      );
    }

    if (mealName === component) {
      errors.push(`Meal "${mealName}" may not contain itself as a Component.`);
    }
  }

  return errors;
}
