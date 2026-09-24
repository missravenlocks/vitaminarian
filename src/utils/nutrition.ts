import {
  AppDataState,
  DailyValuesData,
  FoodItem,
  FoodLogDay,
  MealItem,
  NutrientColumn,
  TreeNode,
} from '../types/nutrition';
import { parseCSV } from './csv';
import { parseNutrientHeader } from './validations';

export const MACRO_NAMES = [
  'Fat',
  'Saturated Fat',
  'Trans Fat',
  'Carbohydrates',
  'Dietary Fiber',
  'Sugars',
  'Added Sugars',
  'Protein',
];

export function formatQty(val: number): string {
  // Up to 2 decimal places without trailing zeros
  return parseFloat(val.toFixed(2)).toString();
}

/**
 * Parses Foods.csv into FoodItem[]
 */
export function parseFoodsData(csvText: string): { foods: FoodItem[]; columns: NutrientColumn[] } {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { foods: [], columns: [] };

  const header = rows[0].map(h => h.trim());
  const columns: NutrientColumn[] = [];

  for (let c = 3; c < header.length; c++) {
    const parsed = parseNutrientHeader(header[c]);
    if (parsed) {
      columns.push({
        fullName: header[c],
        name: parsed.name,
        unit: parsed.unit,
      });
    }
  }

  const foods: FoodItem[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[0] || '').trim();
    if (!name) continue;

    const servingSizeG = Number(row[1]) || 100;
    const caloriesKcal = Number(row[2]) || 0;
    const nutrients: Record<string, number> = {};

    columns.forEach((col, idx) => {
      const colIdx = idx + 3;
      const val = row[colIdx] !== undefined && row[colIdx] !== '' ? Number(row[colIdx]) : 0;
      nutrients[col.name] = isNaN(val) ? 0 : val;
    });

    foods.push({
      name,
      servingSizeG,
      caloriesKcal,
      nutrients,
    });
  }

  return { foods, columns };
}

/**
 * Parses Meals.csv into MealItem[]
 */
export function parseMealsData(csvText: string): MealItem[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const mealsMap = new Map<string, MealItem>();
  const mealOrder: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[0] || '').trim();
    const componentName = (row[1] || '').trim();
    const quantity = Number(row[2]) || 0;
    const unit = (row[3] || 'servings').trim() as 'g' | 'servings';

    if (!name || !componentName) continue;

    if (!mealsMap.has(name)) {
      mealsMap.set(name, { name, components: [] });
      mealOrder.push(name);
    }

    mealsMap.get(name)!.components.push({
      componentName,
      quantity,
      unit,
    });
  }

  return mealOrder.map(name => mealsMap.get(name)!);
}

/**
 * Parses Daily Values.csv into DailyValuesData
 */
export function parseDailyValuesData(csvText: string): { dailyValues: DailyValuesData; columns: string[] } {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      dailyValues: { caloriesKcal: null, nutrients: {} },
      columns: [],
    };
  }

  const header = rows[0].map(h => h.trim());
  const dataRow = rows.length > 1 ? rows[1] : [];

  let caloriesKcal: number | null = null;
  const nutrients: Record<string, number | null> = {};

  header.forEach((colHeader, idx) => {
    const rawVal = dataRow[idx] !== undefined ? dataRow[idx].trim() : '';
    const numVal = rawVal === '' ? null : Number(rawVal);
    const validNum = numVal !== null && !isNaN(numVal) ? numVal : null;

    if (colHeader === 'Calories (kcal)' || colHeader.startsWith('Calories')) {
      caloriesKcal = validNum;
    } else {
      const parsed = parseNutrientHeader(colHeader);
      const key = parsed ? parsed.name : colHeader;
      nutrients[key] = validNum;
    }
  });

  return {
    dailyValues: { caloriesKcal, nutrients },
    columns: header,
  };
}

/**
 * Parses Food Log.csv into FoodLogDay[]
 */
export function parseFoodLogData(csvText: string): { foodLog: FoodLogDay[]; columns: string[] } {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return { foodLog: [], columns: ['Date'] };
  }

  const header = rows[0].map(h => h.trim());
  const foodLog: FoodLogDay[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const date = (row[0] || '').trim();
    if (!date) continue;

    const items: Record<string, number> = {};
    for (let c = 1; c < header.length; c++) {
      const itemName = header[c];
      const valStr = row[c] !== undefined ? row[c].trim() : '';
      const val = valStr === '' ? 0 : Number(valStr);
      if (!isNaN(val) && val > 0) {
        items[itemName] = val;
      }
    }

    foodLog.push({ date, items });
  }

  return { foodLog, columns: header };
}

/**
 * Calculate nutrient totals for a FoodItem given quantity and unit
 */
export function calculateFoodNutrients(
  food: FoodItem,
  quantity: number,
  unit: 'g' | 'servings'
): { calories: number; nutrients: Record<string, number> } {
  const ratio = unit === 'servings' ? quantity : quantity / (food.servingSizeG || 1);
  const calories = food.caloriesKcal * ratio;
  const nutrients: Record<string, number> = {};

  for (const [nutr, val] of Object.entries(food.nutrients)) {
    nutrients[nutr] = (val || 0) * ratio;
  }

  return { calories, nutrients };
}

/**
 * Recursively calculate nutrient totals for a MealItem given servings
 */
export function calculateMealNutrients(
  meal: MealItem,
  servings: number,
  allFoods: Map<string, FoodItem>,
  allMeals: Map<string, MealItem>,
  visited = new Set<string>()
): { calories: number; nutrients: Record<string, number> } {
  let totalCalories = 0;
  const totalNutrients: Record<string, number> = {};

  if (visited.has(meal.name)) {
    return { calories: 0, nutrients: {} };
  }
  visited.add(meal.name);

  for (const comp of meal.components) {
    if (allFoods.has(comp.componentName)) {
      const food = allFoods.get(comp.componentName)!;
      // comp.quantity is in g or servings per single serving of the meal
      const compQuantity = comp.quantity * servings;
      const res = calculateFoodNutrients(food, compQuantity, comp.unit);
      totalCalories += res.calories;
      for (const [nutr, val] of Object.entries(res.nutrients)) {
        totalNutrients[nutr] = (totalNutrients[nutr] || 0) + val;
      }
    } else if (allMeals.has(comp.componentName)) {
      const subMeal = allMeals.get(comp.componentName)!;
      const subServings = comp.quantity * servings;
      const res = calculateMealNutrients(subMeal, subServings, allFoods, allMeals, new Set(visited));
      totalCalories += res.calories;
      for (const [nutr, val] of Object.entries(res.nutrients)) {
        totalNutrients[nutr] = (totalNutrients[nutr] || 0) + val;
      }
    }
  }

  return { calories: totalCalories, nutrients: totalNutrients };
}

/**
 * Calculate totals for a food log day
 */
export function calculateFoodLogNutrients(
  day: FoodLogDay,
  allFoods: Map<string, FoodItem>,
  allMeals: Map<string, MealItem>
): { calories: number; nutrients: Record<string, number> } {
  let totalCalories = 0;
  const totalNutrients: Record<string, number> = {};

  for (const [itemName, qty] of Object.entries(day.items)) {
    if (qty <= 0) continue;
    if (allFoods.has(itemName)) {
      const food = allFoods.get(itemName)!;
      // In Food Log, Food quantity is assumed to be in grams
      const res = calculateFoodNutrients(food, qty, 'g');
      totalCalories += res.calories;
      for (const [nutr, val] of Object.entries(res.nutrients)) {
        totalNutrients[nutr] = (totalNutrients[nutr] || 0) + val;
      }
    } else if (allMeals.has(itemName)) {
      const meal = allMeals.get(itemName)!;
      // In Food Log, Meal quantity is assumed to be in servings
      const res = calculateMealNutrients(meal, qty, allFoods, allMeals);
      totalCalories += res.calories;
      for (const [nutr, val] of Object.entries(res.nutrients)) {
        totalNutrients[nutr] = (totalNutrients[nutr] || 0) + val;
      }
    }
  }

  return { calories: totalCalories, nutrients: totalNutrients };
}

/**
 * Builds the Food Breakdown Tree for a meal
 */
export function buildMealBreakdownTree(
  meal: MealItem,
  servings: number,
  allFoods: Map<string, FoodItem>,
  allMeals: Map<string, MealItem>,
  visited = new Set<string>()
): TreeNode[] {
  if (visited.has(meal.name)) return [];
  visited.add(meal.name);

  const nodes: TreeNode[] = [];

  for (const comp of meal.components) {
    if (allFoods.has(comp.componentName)) {
      const food = allFoods.get(comp.componentName)!;
      let grams = 0;
      if (comp.unit === 'g') {
        grams = comp.quantity * servings;
      } else {
        grams = comp.quantity * servings * food.servingSizeG;
      }
      const label = `${formatQty(grams)}g ${food.name}`;
      nodes.push({
        id: `${meal.name}-${food.name}-${grams}-${Math.random()}`,
        title: label,
        isExpandable: false,
        type: 'food',
        quantityText: `${formatQty(grams)}g`,
        name: food.name,
      });
    } else if (allMeals.has(comp.componentName)) {
      const subMeal = allMeals.get(comp.componentName)!;
      const subServings = comp.quantity * servings;
      const label = `${formatQty(subServings)} ${subServings === 1 ? 'serving' : 'servings'} ${subMeal.name}`;
      const subChildren = buildMealBreakdownTree(subMeal, subServings, allFoods, allMeals, new Set(visited));

      nodes.push({
        id: `${meal.name}-${subMeal.name}-${subServings}-${Math.random()}`,
        title: label,
        isExpandable: true,
        type: 'meal',
        quantityText: `${formatQty(subServings)} servings`,
        name: subMeal.name,
        children: subChildren,
      });
    }
  }

  return nodes;
}

/**
 * Builds the Food Breakdown Tree for a Food Log day
 */
export function buildFoodLogBreakdownTree(
  day: FoodLogDay,
  formattedDateStr: string,
  allFoods: Map<string, FoodItem>,
  allMeals: Map<string, MealItem>
): TreeNode {
  const children: TreeNode[] = [];

  for (const [itemName, qty] of Object.entries(day.items)) {
    if (qty <= 0) continue;

    if (allFoods.has(itemName)) {
      const food = allFoods.get(itemName)!;
      // qty is in grams
      const label = `${formatQty(qty)}g ${food.name}`;
      children.push({
        id: `root-food-${food.name}-${qty}-${Math.random()}`,
        title: label,
        isExpandable: false,
        type: 'food',
        quantityText: `${formatQty(qty)}g`,
        name: food.name,
      });
    } else if (allMeals.has(itemName)) {
      const meal = allMeals.get(itemName)!;
      // qty is in servings
      const label = `${formatQty(qty)} ${qty === 1 ? 'serving' : 'servings'} ${meal.name}`;
      const mealChildren = buildMealBreakdownTree(meal, qty, allFoods, allMeals);

      children.push({
        id: `root-meal-${meal.name}-${qty}-${Math.random()}`,
        title: label,
        isExpandable: true,
        type: 'meal',
        quantityText: `${formatQty(qty)} servings`,
        name: meal.name,
        children: mealChildren,
      });
    }
  }

  return {
    id: `root-foodlog-${day.date}`,
    title: `Food Breakdown for ${formattedDateStr}`,
    isExpandable: true,
    type: 'root',
    children,
  };
}
