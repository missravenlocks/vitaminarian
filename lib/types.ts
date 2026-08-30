export interface Nutrient {
  metadataName: string;
  unit: string;
  header: string;
}

export interface Food {
  name: string;
  servingSizeG: number;
  /** Nutrient values keyed by column header (e.g. "Calories (kcal)") */
  nutrients: Record<string, number>;
}

export interface FoodComboComponent {
  componentName: string;
  quantity: number;
  unit: "g" | "servings";
  isMeal: boolean;
}

export interface FoodCombo {
  name: string;
  components: FoodComboComponent[];
}

export interface LogEntry {
  date: string;
  /** Item name → quantity (grams for foods, servings for meals) */
  items: Record<string, number>;
}

export interface FoodInfoData {
  headers: string[];
  nutrients: Nutrient[];
  dailyValues: Record<string, number>;
  foods: Food[];
}

export interface MealsData {
  meals: FoodCombo[];
}

export interface FoodLogData {
  headers: string[];
  entries: LogEntry[];
}

export type MergeMode = "merge" | "replace";

export interface UploadedFileState {
  fileName: string;
  content: string;
  mode: MergeMode;
  valid: boolean;
}

export type BreakdownSelection =
  | { type: "foodLog"; date: Date }
  | { type: "item"; name: string; quantity: number; unit: "g" | "servings" };

export interface BreakdownNode {
  id: string;
  label: string;
  expandable: boolean;
  children?: BreakdownNode[];
}

export interface NutrientTotals {
  [header: string]: number;
}

export const MACRONUTRIENT_NAMES = [
  "Fat",
  "Saturated Fat",
  "Trans Fat",
  "Carbohydrates",
  "Dietary Fiber",
  "Sugars",
  "Added Sugars",
  "Protein",
] as const;

export const LIMIT_NUTRIENTS = new Set([
  "Added Sugars",
  "Saturated Fat",
  "Trans Fat",
  "Sodium",
]);

export const EXCLUDED_FROM_MICRONUTRIENTS = new Set([
  "Food Name",
  "Serving Size",
  "Calories",
  ...MACRONUTRIENT_NAMES,
]);
