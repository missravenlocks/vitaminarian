import type {
  BreakdownNode,
  BreakdownSelection,
  Food,
  FoodCombo,
  FoodInfoData,
  FoodLogData,
  MealsData,
  NutrientTotals,
} from "./types";
import { formatDisplayDate, formatLogDate } from "./dates";

export function getFoodMap(foodInfo: FoodInfoData): Map<string, Food> {
  return new Map(foodInfo.foods.map((f) => [f.name, f]));
}

export function getMealMap(meals: MealsData): Map<string, FoodCombo> {
  return new Map(meals.meals.map((m) => [m.name, m]));
}

export function isMealName(
  name: string,
  foodMap: Map<string, Food>,
  mealMap: Map<string, FoodCombo>
): boolean {
  return mealMap.has(name) && !foodMap.has(name);
}

function scaleFoodNutrients(
  food: Food,
  quantity: number,
  unit: "g" | "servings",
  headers: string[]
): NutrientTotals {
  const factor =
    unit === "servings" ? quantity : quantity / food.servingSizeG;
  const totals: NutrientTotals = {};
  for (const h of headers) {
    if (h === "Food Name") continue;
    totals[h] = (food.nutrients[h] ?? 0) * factor;
  }
  return totals;
}

function addTotals(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  const result = { ...a };
  for (const [key, val] of Object.entries(b)) {
    result[key] = (result[key] ?? 0) + val;
  }
  return result;
}

export function computeMealNutrients(
  mealName: string,
  quantity: number,
  foodInfo: FoodInfoData,
  meals: MealsData,
  visited: Set<string> = new Set()
): NutrientTotals {
  if (visited.has(mealName)) return {};
  visited.add(mealName);

  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);
  const meal = mealMap.get(mealName);
  if (!meal) return {};

  let totals: NutrientTotals = {};

  for (const comp of meal.components) {
    const compQty = comp.quantity * quantity;

    if (foodMap.has(comp.componentName)) {
      const food = foodMap.get(comp.componentName)!;
      const compNutrients = scaleFoodNutrients(
        food,
        compQty,
        comp.unit,
        foodInfo.headers
      );
      totals = addTotals(totals, compNutrients);
    } else if (mealMap.has(comp.componentName)) {
      const nested = computeMealNutrients(
        comp.componentName,
        compQty,
        foodInfo,
        meals,
        new Set(visited)
      );
      totals = addTotals(totals, nested);
    }
  }

  return totals;
}

export function computeItemNutrients(
  name: string,
  quantity: number,
  unit: "g" | "servings",
  foodInfo: FoodInfoData,
  meals: MealsData
): NutrientTotals {
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);

  if (mealMap.has(name) && !foodMap.has(name)) {
    return computeMealNutrients(name, quantity, foodInfo, meals);
  }

  const food = foodMap.get(name);
  if (!food) return {};
  return scaleFoodNutrients(food, quantity, unit, foodInfo.headers);
}

export function computeFoodLogNutrients(
  date: Date,
  foodInfo: FoodInfoData,
  meals: MealsData,
  foodLog: FoodLogData
): NutrientTotals {
  const dateStr = formatLogDate(date);
  const entry = foodLog.entries.find((e) => e.date === dateStr);
  if (!entry) return {};

  let totals: NutrientTotals = {};
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);

  for (const [name, qty] of Object.entries(entry.items)) {
    if (qty <= 0) continue;

    if (mealMap.has(name) && !foodMap.has(name)) {
      const itemTotals = computeMealNutrients(name, qty, foodInfo, meals);
      totals = addTotals(totals, itemTotals);
    } else if (foodMap.has(name)) {
      const food = foodMap.get(name)!;
      const itemTotals = scaleFoodNutrients(food, qty, "g", foodInfo.headers);
      totals = addTotals(totals, itemTotals);
    }
  }

  return totals;
}

export function computeBreakdownNutrients(
  selection: BreakdownSelection,
  foodInfo: FoodInfoData,
  meals: MealsData,
  foodLog: FoodLogData
): NutrientTotals {
  if (selection.type === "foodLog") {
    return computeFoodLogNutrients(
      selection.date,
      foodInfo,
      meals,
      foodLog
    );
  }
  return computeItemNutrients(
    selection.name,
    selection.quantity,
    selection.unit,
    foodInfo,
    meals
  );
}

function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  const rounded = Math.round(qty * 10) / 10;
  return String(rounded);
}

function buildComponentChildren(
  mealName: string,
  quantity: number,
  foodInfo: FoodInfoData,
  meals: MealsData,
  idPrefix: string,
  visited: Set<string> = new Set()
): BreakdownNode[] {
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);
  const meal = mealMap.get(mealName);
  if (!meal) return [];

  if (visited.has(mealName)) return [];
  visited.add(mealName);

  const children: BreakdownNode[] = [];
  for (let i = 0; i < meal.components.length; i++) {
    const comp = meal.components[i];
    const compQty = comp.quantity * quantity;

    if (foodMap.has(comp.componentName) && !mealMap.has(comp.componentName)) {
      const compUnit = comp.unit;
      const label =
        compUnit === "g"
          ? `${formatQuantity(compQty)}g ${comp.componentName}`
          : `${formatQuantity(compQty)} servings ${comp.componentName}`;
      children.push({
        id: `${idPrefix}-comp-${i}`,
        label,
        expandable: false,
      });
    } else if (mealMap.has(comp.componentName)) {
      children.push(
        buildMealBreakdownNode(
          comp.componentName,
          compQty,
          "servings",
          foodInfo,
          meals,
          `${idPrefix}-comp-${i}`,
          new Set(visited)
        )
      );
    }
  }
  return children;
}

function buildMealBreakdownNode(
  mealName: string,
  quantity: number,
  unit: "g" | "servings",
  foodInfo: FoodInfoData,
  meals: MealsData,
  idPrefix: string,
  visited: Set<string> = new Set()
): BreakdownNode {
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);
  const unitLabel = unit === "servings" ? "servings" : "g";
  const qtyStr = formatQuantity(quantity);

  if (foodMap.has(mealName) && !mealMap.has(mealName)) {
    return {
      id: `${idPrefix}-food-${mealName}`,
      label: `${qtyStr}${unit === "g" ? "g" : " servings"} ${mealName}`,
      expandable: false,
    };
  }

  const meal = mealMap.get(mealName);
  if (!meal) {
    return {
      id: `${idPrefix}-unknown`,
      label: `${qtyStr} ${mealName}`,
      expandable: false,
    };
  }

  if (visited.has(mealName)) {
    return {
      id: `${idPrefix}-cycle`,
      label: `${qtyStr} servings ${mealName}`,
      expandable: false,
    };
  }
  visited.add(mealName);

  const children = buildComponentChildren(
    mealName,
    quantity,
    foodInfo,
    meals,
    idPrefix,
    visited
  );

  return {
    id: `${idPrefix}-meal-${mealName}`,
    label: `${qtyStr} servings ${mealName}`,
    expandable: true,
    children,
  };
}

export function buildFoodBreakdownTree(
  selection: BreakdownSelection,
  foodInfo: FoodInfoData,
  meals: MealsData,
  foodLog: FoodLogData
): BreakdownNode | null {
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);

  if (selection.type === "item") {
    if (!mealMap.has(selection.name) || foodMap.has(selection.name)) {
      return null;
    }
    const qtyStr = formatQuantity(selection.quantity);
    return {
      id: "root",
      label: `Food Breakdown for ${qtyStr} servings ${selection.name}`,
      expandable: true,
      children: buildComponentChildren(
        selection.name,
        selection.quantity,
        foodInfo,
        meals,
        "root"
      ),
    };
  }

  const dateStr = formatLogDate(selection.date);
  const entry = foodLog.entries.find((e) => e.date === dateStr);
  if (!entry || Object.keys(entry.items).length === 0) {
    return {
      id: "root",
      label: `Food Breakdown for ${dateStr}`,
      expandable: true,
      children: [],
    };
  }

  const children: BreakdownNode[] = [];

  for (const [name, qty] of Object.entries(entry.items)) {
    if (qty <= 0) continue;

    if (mealMap.has(name) && !foodMap.has(name)) {
      children.push(
        buildMealBreakdownNode(name, qty, "servings", foodInfo, meals, `log-${name}`)
      );
    } else if (foodMap.has(name)) {
      children.push({
        id: `log-food-${name}`,
        label: `${formatQuantity(qty)}g ${name}`,
        expandable: false,
      });
    }
  }

  return {
    id: "root",
    label: `Food Breakdown for ${formatDisplayDate(selection.date)}`,
    expandable: true,
    children,
  };
}

export function getCalorieGoal(foodInfo: FoodInfoData): number {
  const calHeader = foodInfo.headers.find((h) =>
    h.startsWith("Calories")
  );
  if (!calHeader) return 0;
  return foodInfo.dailyValues[calHeader] ?? 0;
}

export function getMacroCalories(totals: NutrientTotals, foodInfo: FoodInfoData) {
  const carbHeader = foodInfo.headers.find((h) =>
    h.startsWith("Carbohydrates")
  );
  const proteinHeader = foodInfo.headers.find((h) =>
    h.startsWith("Protein")
  );
  const fatHeader = foodInfo.headers.find((h) => h.startsWith("Fat ("));

  const carbs = carbHeader ? totals[carbHeader] ?? 0 : 0;
  const protein = proteinHeader ? totals[proteinHeader] ?? 0 : 0;
  const fat = fatHeader ? totals[fatHeader] ?? 0 : 0;

  return {
    carbs: carbs * 4,
    protein: protein * 4,
    fat: fat * 9,
    carbGrams: carbs,
    proteinGrams: protein,
    fatGrams: fat,
  };
}

export function getAllItemNames(
  foodInfo: FoodInfoData,
  meals: MealsData
): { foods: string[]; meals: string[] } {
  return {
    foods: foodInfo.foods.map((f) => f.name).sort(),
    meals: meals.meals.map((m) => m.name).sort(),
  };
}

export function addLogEntry(
  foodLog: FoodLogData,
  date: Date,
  itemName: string,
  quantity: number,
  unit: "g" | "servings",
  isMeal: boolean,
  foodInfo: FoodInfoData
): FoodLogData {
  const dateStr = formatLogDate(date);
  let headers = [...foodLog.headers];

  if (headers.length === 0 || headers[0] !== "Date") {
    headers = ["Date"];
  }

  if (!headers.includes(itemName)) {
    headers = [...headers, itemName];
  }

  let storedQty = quantity;
  if (!isMeal && unit === "servings") {
    const food = foodInfo.foods.find((f) => f.name === itemName);
    if (food) {
      storedQty = quantity * food.servingSizeG;
    }
  }

  let entry = foodLog.entries.find((e) => e.date === dateStr);
  const entries = foodLog.entries.filter((e) => e.date !== dateStr);

  if (!entry) {
    entry = { date: dateStr, items: {} };
  }

  entry = {
    ...entry,
    items: {
      ...entry.items,
      [itemName]: (entry.items[itemName] ?? 0) + storedQty,
    },
  };

  entries.push(entry);

  return { headers, entries };
}

export function resolveMealComponents(
  meals: MealsData,
  foodInfo: FoodInfoData
): MealsData {
  const foodMap = getFoodMap(foodInfo);
  const mealMap = getMealMap(meals);

  return {
    meals: meals.meals.map((meal) => ({
      ...meal,
      components: meal.components.map((comp) => ({
        ...comp,
        isMeal:
          mealMap.has(comp.componentName) &&
          !foodMap.has(comp.componentName),
      })),
    })),
  };
}
