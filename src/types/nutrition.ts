export interface Food {
  name: string;
  servingSize: number; // in grams
  calories: number; // kcal
  nutrients: Record<string, number>; // Column header -> value (e.g. "Fat (g)": 1)
}

export interface MealComponent {
  component: string;
  quantity: number;
  unit: 'g' | 'servings';
}

export interface Meal {
  name: string;
  components: MealComponent[];
}

export type DailyValues = Record<string, number | null>; // Column header (e.g. "Calories (kcal)", "Fat (g)") -> value

export interface FoodLogDay {
  date: string; // MM/DD/YYYY
  items: Record<string, number>; // Item name (Food or Meal) -> quantity (g for foods, servings for meals)
}

export type FoodLog = Record<string, FoodLogDay>; // Date string -> FoodLogDay

export interface ValidationIssue {
  row?: number;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TreeNode {
  id: string;
  title: string;
  isExpandable: boolean;
  children?: TreeNode[];
  resolvedGrams?: number;
}

export interface CalculatedNutrients {
  calories: number;
  nutrients: Record<string, number>;
  macroCalories: {
    fat: number;
    carbs: number;
    protein: number;
    total: number;
  };
}
