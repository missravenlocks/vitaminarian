export interface NutrientColumn {
  fullName: string;      // e.g. "Fat (g)" or "Calories (kcal)"
  name: string;          // e.g. "Fat" or "Calories"
  unit: string;          // e.g. "g", "kcal", "mg", "μg"
}

export interface FoodItem {
  name: string;
  servingSizeG: number;
  caloriesKcal: number;
  nutrients: Record<string, number>; // keyed by fullName or name
}

export interface MealComponent {
  componentName: string;
  quantity: number;
  unit: 'g' | 'servings';
}

export interface MealItem {
  name: string;
  components: MealComponent[];
}

export interface DailyValuesData {
  caloriesKcal: number | null;
  nutrients: Record<string, number | null>; // keyed by fullName
}

export interface FoodLogDay {
  date: string; // MM/DD/YYYY
  items: Record<string, number>; // FoodName -> grams, MealName -> servings
}

export interface AppDataState {
  foodsRawCsv: string;
  mealsRawCsv: string;
  dailyValuesRawCsv: string;
  foodLogRawCsv: string;
  
  foods: FoodItem[];
  foodNutrientColumns: NutrientColumn[]; // Columns after Calories
  meals: MealItem[];
  dailyValues: DailyValuesData;
  dailyValuesColumns: string[]; // Exact headers of Daily Values file
  foodLog: FoodLogDay[];
  foodLogColumns: string[]; // ["Date", ...food/meal names]
}

export type FileType = 'Foods' | 'Meals' | 'Daily Values' | 'Food Log';

export type MergeOption = 'merge' | 'replace';

export interface StagedFile {
  fileType: FileType;
  fileName: string;
  content: string;
  mode: MergeOption;
  isValid: boolean;
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
  type: 'root' | 'meal' | 'food';
  quantityText?: string;
  name?: string;
  children?: TreeNode[];
}
