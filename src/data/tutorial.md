# Vitaminarian Tutorial & System Guide

Welcome to **Vitaminarian**, a powerful, transparent, and completely customizable nutrition tracking application.

> **Notice Regarding Sample Data:**
> The sample **Foods**, **Meals**, and **Daily Values** files provided out-of-the-box contain limited, illustrative, and likely irrelevant data for your unique personal lifestyle or clinical dietary needs. You are **highly encouraged to modify these files** using the **Upload and Download Module** to adapt the application to your unique requirements, favorite recipes, target micronutrients, and personal goals.

---

## 1. Application Architecture & Overview

Vitaminarian is built upon four structured CSV datasets that you can download, edit, and re-upload at any time:

1. **Foods.csv**: Contains individual foods, their serving size in grams, calories per serving, and every nutrient quantity per serving (e.g. Fat, Carbohydrates, Protein, vitamins, minerals).
2. **Meals.csv**: Contains compound meals composed of one or more components. A component can be an existing Food (measured in grams or servings) or a previously defined Meal (measured in servings).
3. **Daily Values.csv**: A single-row reference defining your personal daily intake goals or limits for calories and each nutrient present in your Foods file.
4. **Food Log.csv**: A tabular historical log where each row represents a single day's intake of foods (in grams) and meals (in servings).

---

## 2. Walkthrough of Main Modules

### Header Module
Displays the **Vitaminarian** brand mark with our custom spinach leaf logo and subheader *"Customizable nutrition tracking"*.

### Upload and Download Module
Provides quick access to two full-featured data managers:
- **Download Data Menu**: Allows you to export the exact current state of your `Foods.csv`, `Meals.csv`, `Daily Values.csv`, and `Food Log.csv` files to your computer with a single click.
- **Upload Data Menu**: Enables you to upload one or more updated CSV files.
  - **Initial Validations**: When you select a file, the application immediately validates syntax, headers, numerical types, and constraints. If valid, the row turns green and offers **Merge with existing** (default) or **Replace existing** mode.
  - **Accept Changes**: Executes **Final Cross-File Validations** across all your datasets (e.g. ensuring component references exist and header columns match). If valid, changes are saved instantly!

### Food Log Entry Module
Enables effortless daily logging:
- **Food Log Entry Selector Row**: Choose any date from January 1, 2000 into the future. By default, it begins with today's date.
- **Food Log Entry Row**:
  - **Item Dropdown**: Search across all your defined Foods and Meals.
  - **Quantity Field**: Enter any positive numerical quantity.
  - **Unit Field**: Automatically sets to `servings` (read-only) for Meals, or allows choosing between `g` and `servings` for individual Foods.
  - **Add Button (+)**: Adds the item to your log for that date, updating all nutrient breakdowns in real time.

### Nutrient Breakdown Module
Analyzes your nutritional intake for either a full day's **Food Log** or an isolated **Specific Item**:
- **Nutrient Breakdown Selector Row**: Switch between viewing your full daily log or inspecting a specific food or recipe in arbitrary quantities.
- **Food Breakdown Tree**: A multi-tiered expandable tree revealing the complete decomposition of compound meals and foods down to individual base ingredients measured in grams.
- **Calorie Progress Bar**: Displays total calorie consumption against your configured daily calorie target.
- **Macronutrient Dashboard**:
  - **Macronutrient Pie Chart**: Visualizes the proportional caloric distribution between Carbohydrates (4 kcal/g), Protein (4 kcal/g), and Fat (9 kcal/g).
  - **Macronutrient Progress Bars**: Shows your intake against your daily target or limit. Sub-nutrients are logically nested:
    - *Saturated Fat* and *Trans Fat* are indented under *Fat*.
    - *Dietary Fiber* and *Sugars* are indented under *Carbohydrates*.
    - *Added Sugars* is indented under *Sugars*.
    - Nutrients to limit (Saturated Fat, Trans Fat, Added Sugars) alert you when approaching or exceeding limits.
- **Micronutrient Dashboard**:
  - Comprehensive progress bars for all vitamins, minerals, and trace elements configured in your Foods file.
  - *Sodium* is designated as a micronutrient to limit.

---

## 3. Customizing Your Data (Power-User Tips)

- **Add Any Nutrient**: Simply append a new column to `Foods.csv` matching `<Nutrient Name> (<Unit>)`, and add the corresponding column to `Daily Values.csv`.
- **Compound Recipes**: Build complex recipes in `Meals.csv` that reference other meals (e.g., a "Burrito Bowl" meal referencing a "Cooked Brown Rice" meal and "Pinto Beans").
- **Offline & Portability**: All your data is stored locally in your browser and can be exported at any time. No tracking, no locked-in cloud databases.
