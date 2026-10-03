import React from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-neutral-200 animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50/80 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-neutral-900">
              Vitaminarian Tutorial & Application Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-200/60 transition-colors cursor-pointer"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-sm text-neutral-700 leading-relaxed">
          {/* Important Callout regarding Sample Data */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong className="font-semibold block text-emerald-950 mb-1">
                Notice Regarding Sample Data:
              </strong>
              The sample <strong>Foods</strong>, <strong>Meals</strong>, and <strong>Daily Values</strong> files
              included with this application contain limited, illustrative, and likely irrelevant data for your unique lifestyle
              or nutritional targets. You are <strong>highly encouraged to customize these files</strong> using the{' '}
              <strong>Upload and Download Module</strong> to adapt the application to your unique dietary requirements, favorite
              recipes, and specific micronutrient goals.
            </div>
          </div>

          {/* Section 1: Overview */}
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              1. Application Overview & Architecture
            </h3>
            <p>
              Vitaminarian gives you complete, transparent ownership of your nutrition data. The application operates
              directly from four structured CSV files that you can freely download, edit in any spreadsheet software, and re-upload:
            </p>
            <ul className="mt-2.5 list-disc list-inside space-y-1.5 pl-2 text-neutral-600">
              <li>
                <strong className="text-neutral-800">Foods.csv:</strong> Base single-ingredient items (e.g. Oats, Apple, Blueberries), specifying serving size in grams, calories per serving, and nutrient quantities per serving.
              </li>
              <li>
                <strong className="text-neutral-800">Meals.csv:</strong> Compound meals (e.g. Oatmeal with Fruits) comprised of combinations of foods or previously defined meals.
              </li>
              <li>
                <strong className="text-neutral-800">Daily Values.csv:</strong> A single-row reference file establishing your personal daily target or limit for calories and each nutrient present in your Foods file.
              </li>
              <li>
                <strong className="text-neutral-800">Food Log.csv:</strong> Your chronological record of items consumed per day, with Foods measured in grams and Meals measured in servings.
              </li>
            </ul>
          </div>

          {/* Section 2: Upload & Download */}
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              2. Upload & Download Data Module
            </h3>
            <p>
              Located directly below the header, the Upload and Download Module allows you to synchronize your data:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 pl-2 text-neutral-600">
              <li>
                <strong>Download Data:</strong> Export current application data to your computer in CSV format.
              </li>
              <li>
                <strong>Upload Data:</strong> Select updated CSV files. The app immediately runs <em>Initial Validations</em> on syntax, columns, and data types. Once verified, choose between <strong>Merge with existing</strong> (default) or <strong>Replace existing</strong>. Clicking <strong>Accept Changes</strong> runs <em>Final Validations</em> to guarantee complete relational consistency across all files.
              </li>
            </ul>
          </div>

          {/* Section 3: Daily Logging */}
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              3. Food Log Entry Module
            </h3>
            <p>
              Log items eaten on any date from January 1, 2000 into the future:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 pl-2 text-neutral-600">
              <li>
                <strong>Date Selection:</strong> Defaults to today. Choosing a new date automatically synchronizes the Nutrient Breakdown viewer.
              </li>
              <li>
                <strong>Item Selection:</strong> Search through your Foods and compound Meals.
              </li>
              <li>
                <strong>Quantity & Unit:</strong> For Foods, enter in grams (g) or servings; for Meals, the unit is automatically set to servings.
              </li>
              <li>
                <strong>Add (+):</strong> Logs the item immediately, recalculating breakdowns and progress bars in real time.
              </li>
            </ul>
          </div>

          {/* Section 4: Nutrient Breakdown & Tree */}
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              4. Nutrient Breakdown & Food Breakdown Tree
            </h3>
            <p>
              Inspect the exact nutrient profile for an entire day&apos;s log or analyze any specific Food or Meal in custom portions:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 pl-2 text-neutral-600">
              <li>
                <strong>Food Breakdown Tree:</strong> Initially collapsed by default. Expanding the right carrot arrow recursively unfolds compound recipes into their underlying whole food ingredients measured in grams.
              </li>
              <li>
                <strong>Calorie Progress Bar:</strong> Monitors your intake against your daily caloric goal.
              </li>
              <li>
                <strong>Macronutrient Dashboard:</strong> Features a caloric ratio pie chart (Carbohydrates at 4 kcal/g, Protein at 4 kcal/g, Fat at 9 kcal/g) and structured progress bars. Saturated Fat, Trans Fat, and Added Sugars are highlighted as limits.
              </li>
              <li>
                <strong>Micronutrient Dashboard:</strong> Displays comprehensive progress bars for all vitamins, minerals, and trace elements, with Sodium highlighted as a nutrient to limit.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 flex justify-end shrink-0 bg-neutral-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
