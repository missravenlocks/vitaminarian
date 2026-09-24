# Vitaminarian User Manual & Tutorial

Welcome to **Vitaminarian**, your customizable, precision nutrition tracking application. Vitaminarian gives you complete, transparent control over your food database, composite meals, daily reference values, and daily dietary logs through structured CSV data files and visual analytics.

---

## 1. Getting Started & Interface Overview

Vitaminarian is organized into five core modules displayed from top to bottom:
1. **Header Module**: Displays the Vitaminarian brand and elegant spinach emblem.
2. **Upload and Download Module**: Side-by-side buttons to import your custom data or export your existing records.
3. **Food Log Entry Module**: Quick-entry controls to log foods and meals eaten on any date.
4. **Nutrient Breakdown Module**: In-depth analytical reports, featuring the recursive Food Breakdown Tree, Calorie Progress Bar, Macronutrient Pie Chart & Bars, and Micronutrient Progress Bars.
5. **Footer Module**: Quick access to this Tutorial and the Medical Disclaimer.

---

## 2. Managing Your Data Files (Upload & Download)

Vitaminarian operates on four interconnected CSV files:
- `Foods.csv`: Individual foods with serving sizes in grams, calories per serving, and detailed nutrient profiles.
- `Meals.csv`: Composite meals made of individual foods or previously defined sub-meals.
- `Daily Values.csv`: Your personal daily intake goals or limits for calories and every nutrient.
- `Food Log.csv`: Historical daily records of quantities consumed for each food and meal.

### Upload Data Menu
1. Click **Upload Data**.
2. Select **Upload** next to any file type you wish to update (`Foods`, `Meals`, `Daily Values`, or `Food Log`).
3. Select a `.csv` file from your device.
4. **Initial Validations** run immediately:
   - If invalid, a "File not uploaded" dialog displays all errors.
   - If valid, the row turns green, displays the filename with `.csv`, and shows two options:
     - **Merge with existing** (default): Safely merges changes according to specific merge rules.
     - **Replace existing**: Replaces your current dataset for that file entirely with the uploaded file.
5. Click **Accept Changes**:
   - **Final Validations** cross-check consistency across all files (e.g. food vs meal name conflicts, meal component existence, column order matching).
   - If validations pass, a success dialog confirms your changes have been saved.

### Download Data Menu
1. Click **Download Data**.
2. Click the download icon next to any of the 4 files to instantly save the latest version to your device.

---

## 3. Logging Foods & Meals

1. **Select a Date**:
   - In the **Food Log Entry Selector Row**, use the date picker to choose the date (defaults to today).
   - *Tip*: Changing this date automatically updates the Nutrient Breakdown module to view that day's totals.
2. **Choose an Item**:
   - In the **Item** dropdown, search or select any Food or Meal from your library.
3. **Enter Quantity & Unit**:
   - Enter a positive number in the **Quantity** field.
   - For **Foods**, choose between `g` (grams) or `servings`.
   - For **Meals**, the unit is automatically fixed to `servings` (read-only).
4. **Add to Log**:
   - Click the **+ Add** button. Your entry is recorded in the Food Log!

---

## 4. Nutrient Breakdown & Analysis

You can view complete nutritional analysis for your entire day's log OR for any individual food or meal:

### Selector Row
- Choose **Food Log** to inspect daily intake on a given date.
- Hover over or click **Specific Item** to choose any Food or Meal, followed by its quantity and unit.

### Food Breakdown Tree
When viewing a Food Log or a Meal, the **Food Breakdown Tree** decomposes composite foods into their purest food ingredients:
- Click the right caret (`›`) to expand any branch.
- Intermediate meals expand into their sub-meals and ingredient quantities.
- Leaf nodes display exact gram quantities for each raw food component (e.g. `130g Sprouted Rolled Oats`).

### Calorie & Macronutrient Dashboard
- **Calorie Progress Bar**: Tracks calories consumed against your Daily Value target.
- **Macronutrient Pie Chart**: Visualizes the exact proportion of calories derived from Carbohydrates (4 kcal/g), Protein (4 kcal/g), and Fat (9 kcal/g).
- **Macronutrient Progress Bars**: Shows gram totals and percent-of-daily-value progress. Includes structured hierarchical indents:
  - Fat
    - Saturated Fat
    - Trans Fat
  - Carbohydrates
    - Dietary Fiber
    - Sugars
      - Added Sugars
  - Protein

### Micronutrient Dashboard
- Displays progress bars for all remaining nutrients (vitamins, minerals, cholesterol, sodium).
- **Sodium Limit**: Clearly highlighted as a nutrient to keep within healthy limits.
- If a daily value goal is unspecified or set to 0, the raw value is shown without an arbitrary percentage.

---

## 5. File Specifications & Validation Rules

### Foods.csv
- Required first 3 columns: `Food Name`, `Serving Size (g)`, `Calories (kcal)`.
- Additional nutrient columns must follow `<Nutrient Name> (<Unit>)` format (letters/numbers/spaces for name; letters or `μ` for unit).
- Must include `Fat (g)`, `Carbohydrates (g)`, and `Protein (g)`.
- Food names may contain letters, digits, spaces, and punctuation: `'-,()`.
- Serving sizes must be positive numbers; nutrient amounts must be non-negative numbers.

### Meals.csv
- Exact column headers: `Meal Name,Component,Quantity,Unit`.
- Component names must match an existing food or a meal defined in an earlier row.
- Units must be `g` or `servings` for food components, and `servings` for meal components.
- No meal may contain itself or contain duplicate components.

### Daily Values.csv
- Column headers must match `Calories (kcal)` and all nutrient headers from `Foods.csv` in the exact same sequence.
- Values must be non-negative numbers or empty (empty indicates no specific goal/limit).

### Food Log.csv
- First column must be `Date` formatted as `MM/DD/YYYY`.
- Subsequent columns correspond to individual Food and Meal names.
- Values represent grams (for Foods) or servings (for Meals).
