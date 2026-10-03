import {
  CalculatedNutrients,
  DailyValues,
  Food,
  FoodLog,
  Meal,
  TreeNode
} from '../types/nutrition.ts';
import { parseCSV, stringifyCSV } from './csv.ts';

export function formatQuantity(num: number): string {
  if (Number.isInteger(num)) return num.toString();
  // Round to max 2 decimal places, trimming trailing zeros
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
}

/**
 * Format date for display, e.g. "September 23, 2026"
 */
export function formatDateLong(dateStr: string): string {
  // Input could be "MM/DD/YYYY" or "YYYY-MM-DD"
  let year: number, month: number, day: number;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    return dateStr;
  }

  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Convert YYYY-MM-DD to MM/DD/YYYY
 */
export function toMMDDYYYY(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  return `${month}/${day}/${year}`;
}

/**
 * Convert MM/DD/YYYY to YYYY-MM-DD
 */
export function toYYYYMMDD(mmddyyyy: string): string {
  const parts = mmddyyyy.split('/');
  if (parts.length !== 3) return mmddyyyy;
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

export function parseFoods(csvText: string): { foodsMap: Map<string, Food>; orderedNutrientCols: string[] } {
  const foodsMap = new Map<string, Food>();
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { foodsMap, orderedNutrientCols: [] };

  const header = rows[0];
  const orderedNutrientCols = header.slice(3); // Headers after Calories

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[0] || '').trim();
    if (!name) continue;

    const servingSize = Number(row[1]) || 0;
    const calories = Number(row[2]) || 0;
    const nutrients: Record<string, number> = {};

    for (let c = 3; c < header.length; c++) {
      const colName = header[c];
      nutrients[colName] = Number(row[c]) || 0;
    }

    foodsMap.set(name, {
      name,
      servingSize,
      calories,
      nutrients
    });
  }

  return { foodsMap, orderedNutrientCols };
}

export function parseMeals(csvText: string): Map<string, Meal> {
  const mealsMap = new Map<string, Meal>();
  const rows = parseCSV(csvText);
  if (rows.length === 0) return mealsMap;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const mealName = (row[0] || '').trim();
    const component = (row[1] || '').trim();
    const qty = Number(row[2]) || 0;
    const unit = (row[3] || '').trim() as 'g' | 'servings';

    if (!mealName || !component) continue;

    if (!mealsMap.has(mealName)) {
      mealsMap.set(mealName, {
        name: mealName,
        components: []
      });
    }

    mealsMap.get(mealName)!.components.push({
      component,
      quantity: qty,
      unit
    });
  }

  return mealsMap;
}

export function parseDailyValues(csvText: string): DailyValues {
  const dv: DailyValues = {};
  const rows = parseCSV(csvText);
  if (rows.length < 2) return dv;

  const header = rows[0];
  const data = rows[1];

  for (let c = 0; c < header.length; c++) {
    const col = header[c];
    const valStr = data[c] !== undefined ? data[c].trim() : '';
    if (valStr === '') {
      dv[col] = null;
    } else {
      const val = Number(valStr);
      dv[col] = isNaN(val) ? null : val;
    }
  }

  return dv;
}

export function parseFoodLog(csvText: string): FoodLog {
  const log: FoodLog = {};
  const rows = parseCSV(csvText);
  if (rows.length === 0) return log;

  const header = rows[0];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const date = (row[0] || '').trim();
    if (!date) continue;

    if (!log[date]) {
      log[date] = { date, items: {} };
    }

    for (let c = 1; c < header.length; c++) {
      const item = header[c];
      const valStr = row[c] !== undefined ? row[c].trim() : '';
      if (valStr !== '') {
        const val = Number(valStr);
        if (!isNaN(val) && val > 0) {
          log[date].items[item] = val;
        }
      }
    }
  }

  return log;
}

export function serializeFoodLog(log: FoodLog, allFoods: Map<string, Food>, allMeals: Map<string, Meal>): string {
  // Collect all unique items present in log
  const itemsSet = new Set<string>();
  for (const day of Object.values(log)) {
    for (const item of Object.keys(day.items)) {
      itemsSet.add(item);
    }
  }

  const sortedItems = Array.from(itemsSet).sort();
  const header = ['Date', ...sortedItems];
  const dates = Object.keys(log).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const rows: string[][] = [];
  for (const d of dates) {
    const day = log[d];
    const row: string[] = [d];
    for (const item of sortedItems) {
      const val = day.items[item];
      row.push(val !== undefined && val > 0 ? val.toString() : '');
    }
    rows.push(row);
  }

  return stringifyCSV(header, rows);
}

/**
 * Breakdown an individual component into the Tree structure.
 */
function buildComponentTreeNode(
  itemName: string,
  quantity: number,
  unit: 'g' | 'servings',
  foodsMap: Map<string, Food>,
  mealsMap: Map<string, Meal>,
  path: string,
  visitedMeals: Set<string>
): TreeNode {
  const id = `${path}_${itemName}_${quantity}_${unit}`;

  // If component is a Food
  if (foodsMap.has(itemName)) {
    const food = foodsMap.get(itemName)!;
    if (unit === 'servings') {
      const totalGrams = quantity * food.servingSize;
      const servingLabel = quantity === 1 ? '1 serving' : `${formatQuantity(quantity)} servings`;
      // Expandable node: > [quantity] servings [Food]
      // Which expands into: [totalGrams]g [Food]
      return {
        id,
        title: `${servingLabel} ${itemName}`,
        isExpandable: true,
        resolvedGrams: totalGrams,
        children: [
          {
            id: `${id}_leaf`,
            title: `${formatQuantity(totalGrams)}g ${itemName}`,
            isExpandable: false,
            resolvedGrams: totalGrams
          }
        ]
      };
    } else {
      // Leaf node already in grams: e.g. "148g Blueberries"
      return {
        id,
        title: `${formatQuantity(quantity)}g ${itemName}`,
        isExpandable: false,
        resolvedGrams: quantity
      };
    }
  }

  // If component is a Meal
  if (mealsMap.has(itemName)) {
    const meal = mealsMap.get(itemName)!;
    const servingLabel = quantity === 1 ? '1 serving' : `${formatQuantity(quantity)} servings`;

    if (visitedMeals.has(itemName)) {
      // Cycle safeguard
      return {
        id,
        title: `${servingLabel} ${itemName} (cycle detected)`,
        isExpandable: false
      };
    }

    const nextVisited = new Set(visitedMeals);
    nextVisited.add(itemName);

    const children: TreeNode[] = meal.components.map((comp, idx) => {
      const scaledQty = quantity * comp.quantity;
      return buildComponentTreeNode(
        comp.component,
        scaledQty,
        comp.unit,
        foodsMap,
        mealsMap,
        `${id}_c${idx}`,
        nextVisited
      );
    });

    return {
      id,
      title: `${servingLabel} ${itemName}`,
      isExpandable: true,
      children
    };
  }

  // Unknown item fallback
  return {
    id,
    title: `${formatQuantity(quantity)}${unit === 'g' ? 'g' : ' servings'} ${itemName}`,
    isExpandable: false
  };
}

/**
 * Builds the top-level Food Breakdown Tree based on current selection.
 */
export function buildFoodBreakdownTree(
  viewMode: 'foodLog' | 'specificItem',
  selectedDate: string, // MM/DD/YYYY or YYYY-MM-DD
  selectedItem: string,
  quantity: number,
  unit: 'g' | 'servings',
  foodsMap: Map<string, Food>,
  mealsMap: Map<string, Meal>,
  foodLog: FoodLog
): TreeNode {
  if (viewMode === 'foodLog') {
    const mmddyyyy = selectedDate.includes('-') ? toMMDDYYYY(selectedDate) : selectedDate;
    const formattedDate = formatDateLong(selectedDate);
    const rootTitle = `Food Breakdown for ${formattedDate}`;
    const dayData = foodLog[mmddyyyy];

    if (!dayData || Object.keys(dayData.items).length === 0) {
      return {
        id: 'root_log',
        title: rootTitle,
        isExpandable: true,
        children: [
          {
            id: 'root_log_empty',
            title: 'No foods logged for this date',
            isExpandable: false
          }
        ]
      };
    }

    const children: TreeNode[] = [];
    const entries = Object.entries(dayData.items);

    entries.forEach(([itemName, qty], idx) => {
      if (qty <= 0) return;
      if (foodsMap.has(itemName)) {
        // Logged foods are stored in grams
        children.push({
          id: `root_log_item_${idx}`,
          title: `${formatQuantity(qty)}g ${itemName}`,
          isExpandable: false,
          resolvedGrams: qty
        });
      } else if (mealsMap.has(itemName)) {
        // Logged meals are stored in servings
        children.push(
          buildComponentTreeNode(
            itemName,
            qty,
            'servings',
            foodsMap,
            mealsMap,
            `root_log_meal_${idx}`,
            new Set()
          )
        );
      }
    });

    return {
      id: 'root_log',
      title: rootTitle,
      isExpandable: true,
      children: children.length > 0 ? children : [
        {
          id: 'root_log_empty',
          title: 'No foods logged for this date',
          isExpandable: false
        }
      ]
    };
  }

  // Specific Item view
  if (!selectedItem) {
    return {
      id: 'root_empty_item',
      title: 'Food Breakdown',
      isExpandable: true,
      children: [
        {
          id: 'root_empty_child',
          title: 'Select an item to view breakdown',
          isExpandable: false
        }
      ]
    };
  }

  // If item is a Food
  if (foodsMap.has(selectedItem)) {
    const food = foodsMap.get(selectedItem)!;
    if (unit === 'servings') {
      const servingLabel = quantity === 1 ? '1 serving' : `${formatQuantity(quantity)} servings`;
      const rootTitle = `Food Breakdown for ${servingLabel} ${selectedItem}`;
      const totalGrams = quantity * food.servingSize;
      return {
        id: 'root_food_servings',
        title: rootTitle,
        isExpandable: true,
        resolvedGrams: totalGrams,
        children: [
          {
            id: 'root_food_leaf',
            title: `${formatQuantity(totalGrams)}g ${selectedItem}`,
            isExpandable: false,
            resolvedGrams: totalGrams
          }
        ]
      };
    } else {
      const rootTitle = `Food Breakdown for ${formatQuantity(quantity)}g ${selectedItem}`;
      return {
        id: 'root_food_g',
        title: rootTitle,
        isExpandable: true,
        resolvedGrams: quantity,
        children: [
          {
            id: 'root_food_g_leaf',
            title: `${formatQuantity(quantity)}g ${selectedItem}`,
            isExpandable: false,
            resolvedGrams: quantity
          }
        ]
      };
    }
  }

  // If item is a Meal
  if (mealsMap.has(selectedItem)) {
    const servingLabel = quantity === 1 ? '1 serving' : `${formatQuantity(quantity)} servings`;
    const rootTitle = `Food Breakdown for ${servingLabel} ${selectedItem}`;
    const mealNode = buildComponentTreeNode(
      selectedItem,
      quantity,
      'servings',
      foodsMap,
      mealsMap,
      'root_meal',
      new Set()
    );

    return {
      id: 'root_meal_wrapper',
      title: rootTitle,
      isExpandable: true,
      children: mealNode.children
    };
  }

  return {
    id: 'root_unknown',
    title: `Food Breakdown for ${selectedItem}`,
    isExpandable: false
  };
}

/**
 * Recursively resolves all base foods and their quantities in grams.
 */
export function resolveBaseFoodsInGrams(
  viewMode: 'foodLog' | 'specificItem',
  selectedDate: string,
  selectedItem: string,
  quantity: number,
  unit: 'g' | 'servings',
  foodsMap: Map<string, Food>,
  mealsMap: Map<string, Meal>,
  foodLog: FoodLog
): Map<string, number> {
  const totals = new Map<string, number>();

  const addFoodGrams = (food: string, grams: number) => {
    totals.set(food, (totals.get(food) || 0) + grams);
  };

  const resolveMeal = (mealName: string, mealServings: number, visited: Set<string>) => {
    if (visited.has(mealName)) return;
    const meal = mealsMap.get(mealName);
    if (!meal) return;
    const nextVisited = new Set(visited);
    nextVisited.add(mealName);

    for (const comp of meal.components) {
      const compQty = mealServings * comp.quantity;
      if (foodsMap.has(comp.component)) {
        const f = foodsMap.get(comp.component)!;
        const grams = comp.unit === 'servings' ? compQty * f.servingSize : compQty;
        addFoodGrams(comp.component, grams);
      } else if (mealsMap.has(comp.component)) {
        resolveMeal(comp.component, compQty, nextVisited);
      }
    }
  };

  if (viewMode === 'foodLog') {
    const mmddyyyy = selectedDate.includes('-') ? toMMDDYYYY(selectedDate) : selectedDate;
    const dayData = foodLog[mmddyyyy];
    if (dayData) {
      for (const [item, qty] of Object.entries(dayData.items)) {
        if (qty <= 0) continue;
        if (foodsMap.has(item)) {
          // Foods in Food Log are assumed to be in grams
          addFoodGrams(item, qty);
        } else if (mealsMap.has(item)) {
          // Meals in Food Log are in servings
          resolveMeal(item, qty, new Set());
        }
      }
    }
  } else {
    // Specific item
    if (foodsMap.has(selectedItem)) {
      const f = foodsMap.get(selectedItem)!;
      const grams = unit === 'servings' ? quantity * f.servingSize : quantity;
      addFoodGrams(selectedItem, grams);
    } else if (mealsMap.has(selectedItem)) {
      resolveMeal(selectedItem, quantity, new Set());
    }
  }

  return totals;
}

/**
 * Computes nutrients for the given selection.
 */
export function calculateNutrients(
  baseFoodsGrams: Map<string, number>,
  foodsMap: Map<string, Food>
): CalculatedNutrients {
  let totalCalories = 0;
  const totalNutrients: Record<string, number> = {};

  for (const [foodName, grams] of baseFoodsGrams.entries()) {
    const food = foodsMap.get(foodName);
    if (!food || food.servingSize <= 0) continue;

    const ratio = grams / food.servingSize;
    totalCalories += ratio * food.calories;

    for (const [colName, val] of Object.entries(food.nutrients)) {
      totalNutrients[colName] = (totalNutrients[colName] || 0) + ratio * val;
    }
  }

  // Calculate Macro Calories:
  // Fat = 9 kcal/g, Carbohydrates = 4 kcal/g, Protein = 4 kcal/g
  const fatGrams = totalNutrients['Fat (g)'] || 0;
  const carbGrams = totalNutrients['Carbohydrates (g)'] || 0;
  const proteinGrams = totalNutrients['Protein (g)'] || 0;

  const fatCals = fatGrams * 9;
  const carbCals = carbGrams * 4;
  const proteinCals = proteinGrams * 4;
  const macroTotal = fatCals + carbCals + proteinCals;

  return {
    calories: Math.round(totalCalories * 10) / 10,
    nutrients: totalNutrients,
    macroCalories: {
      fat: Math.round(fatCals * 10) / 10,
      carbs: Math.round(carbCals * 10) / 10,
      protein: Math.round(proteinCals * 10) / 10,
      total: Math.round(macroTotal * 10) / 10
    }
  };
}
