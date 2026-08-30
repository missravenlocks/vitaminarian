import Papa from "papaparse";
import type {
  Food,
  FoodCombo,
  FoodComboComponent,
  FoodInfoData,
  FoodLogData,
  LogEntry,
  MealsData,
  Nutrient,
} from "../types";

const FOOD_NAME_PATTERN = /^[a-zA-Z0-9\s'\-,()]+$/;
const METADATA_HEADER_PATTERN = /^([a-zA-Z0-9\s]+?)\s*\(([a-zA-Zμ]+)\)$/;

function parseNumeric(value: string | undefined): number {
  if (!value || value.trim() === "") return 0;
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

export function parseCsv(content: string): string[][] {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: false,
  });
  return result.data;
}

export function parseFoodInfo(content: string): FoodInfoData {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { headers: [], nutrients: [], dailyValues: {}, foods: [] };
  }

  const headers = rows[0];
  const nutrients: Nutrient[] = [];
  for (let i = 1; i < headers.length; i++) {
    const match = headers[i].match(METADATA_HEADER_PATTERN);
    if (match) {
      nutrients.push({
        metadataName: match[1].trim(),
        unit: match[2],
        header: headers[i],
      });
    }
  }

  const dailyValues: Record<string, number> = {};
  const foods: Food[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = row[0]?.trim() ?? "";
    if (name === "Daily Value") {
      for (let c = 1; c < headers.length; c++) {
        dailyValues[headers[c]] = parseNumeric(row[c]);
      }
    } else if (name) {
      const nutrientsMap: Record<string, number> = {};
      for (let c = 1; c < headers.length; c++) {
        nutrientsMap[headers[c]] = parseNumeric(row[c]);
      }
      const servingHeader = headers.find((h) => h.startsWith("Serving Size"));
      foods.push({
        name,
        servingSizeG: servingHeader ? nutrientsMap[servingHeader] : 0,
        nutrients: nutrientsMap,
      });
    }
  }

  return { headers, nutrients, dailyValues, foods };
}

export function parseMeals(content: string): MealsData {
  const trimmed = content.trim();
  if (!trimmed) {
    return { meals: [] };
  }

  const rows = parseCsv(content);
  if (rows.length <= 1) {
    return { meals: [] };
  }

  const mealMap = new Map<string, FoodComboComponent[]>();
  const mealOrder: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const mealName = row[0]?.trim() ?? "";
    const component = row[1]?.trim() ?? "";
    const quantity = parseFloat(row[2] ?? "");
    const unit = row[3]?.trim() as "g" | "servings";

    if (!mealName) continue;

    if (!mealMap.has(mealName)) {
      mealMap.set(mealName, []);
      mealOrder.push(mealName);
    }

    mealMap.get(mealName)!.push({
      componentName: component,
      quantity,
      unit,
      isMeal: false,
    });
  }

  const meals: FoodCombo[] = mealOrder.map((name) => ({
    name,
    components: mealMap.get(name)!,
  }));

  return { meals };
}

export function parseFoodLog(content: string): FoodLogData {
  const trimmed = content.trim();
  if (!trimmed) {
    return { headers: ["Date"], entries: [] };
  }

  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { headers: ["Date"], entries: [] };
  }

  const headers = rows[0];
  const entries: LogEntry[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const date = row[0]?.trim() ?? "";
    if (!date) continue;

    const items: Record<string, number> = {};
    for (let c = 1; c < headers.length; c++) {
      const val = parseNumeric(row[c]);
      if (val > 0) {
        items[headers[c]] = val;
      }
    }
    entries.push({ date, items });
  }

  return { headers, entries };
}

export function serializeFoodInfo(data: FoodInfoData): string {
  const lines: string[] = [data.headers.join(",")];

  const dailyRow: string[] = ["Daily Value"];
  for (let i = 1; i < data.headers.length; i++) {
    const h = data.headers[i];
    const val = data.dailyValues[h];
    if (h.startsWith("Serving Size")) {
      dailyRow.push("");
    } else {
      dailyRow.push(val !== undefined && val !== 0 ? String(val) : "");
    }
  }
  lines.push(dailyRow.join(","));

  for (const food of data.foods) {
    const row: string[] = [food.name];
    for (let i = 1; i < data.headers.length; i++) {
      const h = data.headers[i];
      const val = food.nutrients[h];
      row.push(val !== undefined && val !== 0 ? String(val) : "");
    }
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

export function serializeMeals(data: MealsData): string {
  if (data.meals.length === 0) {
    return "Meal Name,Component,Quantity,Unit";
  }

  const lines: string[] = ["Meal Name,Component,Quantity,Unit"];
  for (const meal of data.meals) {
    for (const comp of meal.components) {
      lines.push(
        `${meal.name},${comp.componentName},${comp.quantity},${comp.unit}`
      );
    }
  }
  return lines.join("\n");
}

export function serializeFoodLog(data: FoodLogData): string {
  if (data.entries.length === 0 && data.headers.length <= 1) {
    return "Date";
  }

  const lines: string[] = [data.headers.join(",")];
  for (const entry of data.entries) {
    const row: string[] = [entry.date];
    for (let i = 1; i < data.headers.length; i++) {
      const h = data.headers[i];
      const val = entry.items[h];
      row.push(val !== undefined && val > 0 ? String(val) : "");
    }
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export { FOOD_NAME_PATTERN, METADATA_HEADER_PATTERN, parseNumeric };
