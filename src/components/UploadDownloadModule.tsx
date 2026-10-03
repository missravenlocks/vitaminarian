import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import {
  validateFoodsInitial,
  validateMealsInitial,
  validateDailyValuesInitial,
  validateFoodLogInitial,
  validateFinal
} from '../utils/validations.ts';
import { mergeGridCSV, mergeMealsCSV } from '../utils/merge.ts';

export type FileTypeKey = 'foods' | 'meals' | 'dailyValues' | 'foodLog';

interface PendingUpload {
  fileName: string;
  csvContent: string;
  mode: 'merge' | 'replace';
}

interface UploadDownloadModuleProps {
  foodsCSV: string;
  mealsCSV: string;
  dailyValuesCSV: string;
  foodLogCSV: string;
  onSaveData: (updated: {
    foods?: string;
    meals?: string;
    dailyValues?: string;
    foodLog?: string;
  }) => void;
}

export const UploadDownloadModule: React.FC<UploadDownloadModuleProps> = ({
  foodsCSV,
  mealsCSV,
  dailyValuesCSV,
  foodLogCSV,
  onSaveData
}) => {
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Pending uploads state in the Upload Menu
  const [pendingUploads, setPendingUploads] = useState<Record<FileTypeKey, PendingUpload | null>>({
    foods: null,
    meals: null,
    dailyValues: null,
    foodLog: null
  });

  // Modal dialog states
  const [initialErrorModal, setInitialErrorModal] = useState<{
    fileLabel: string;
    errors: string[];
  } | null>(null);

  const [finalErrorModal, setFinalErrorModal] = useState<string[] | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [warningsModal, setWarningsModal] = useState<string[] | null>(null);

  // File input refs for each file type
  const foodsInputRef = useRef<HTMLInputElement>(null);
  const mealsInputRef = useRef<HTMLInputElement>(null);
  const dvInputRef = useRef<HTMLInputElement>(null);
  const logInputRef = useRef<HTMLInputElement>(null);

  const fileConfigs: { key: FileTypeKey; label: string; defaultFileName: string; inputRef: React.RefObject<HTMLInputElement | null> }[] = [
    { key: 'foods', label: 'Foods', defaultFileName: 'Foods.csv', inputRef: foodsInputRef },
    { key: 'meals', label: 'Meals', defaultFileName: 'Meals.csv', inputRef: mealsInputRef },
    { key: 'dailyValues', label: 'Daily Values', defaultFileName: 'Daily Values.csv', inputRef: dvInputRef },
    { key: 'foodLog', label: 'Food Log', defaultFileName: 'Food Log.csv', inputRef: logInputRef }
  ];

  // Helper to trigger download
  const handleDownload = (type: FileTypeKey) => {
    let content = '';
    let filename = '';
    if (type === 'foods') {
      content = foodsCSV;
      filename = 'Foods.csv';
    } else if (type === 'meals') {
      content = mealsCSV;
      filename = 'Meals.csv';
    } else if (type === 'dailyValues') {
      content = dailyValuesCSV;
      filename = 'Daily Values.csv';
    } else if (type === 'foodLog') {
      content = foodLogCSV;
      filename = 'Food Log.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file selection and Initial Validation
  const handleFileSelected = (type: FileTypeKey, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';

      let validationResult = { valid: true, errors: [] as string[] };
      const label = fileConfigs.find(c => c.key === type)?.label || type;

      if (type === 'foods') {
        validationResult = validateFoodsInitial(text);
      } else if (type === 'meals') {
        validationResult = validateMealsInitial(text);
      } else if (type === 'dailyValues') {
        validationResult = validateDailyValuesInitial(text);
      } else if (type === 'foodLog') {
        validationResult = validateFoodLogInitial(text);
      }

      if (!validationResult.valid) {
        // Show "File not uploaded" dialog box
        setInitialErrorModal({
          fileLabel: label,
          errors: validationResult.errors
        });
      } else {
        // Validation succeeded: highlight row, store pending upload
        setPendingUploads(prev => ({
          ...prev,
          [type]: {
            fileName: file.name,
            csvContent: text,
            mode: 'merge' // default to "Merge with existing"
          }
        }));
      }
    };
    reader.readAsText(file);
  };

  // Update mode for a pending file
  const handleSetMode = (type: FileTypeKey, mode: 'merge' | 'replace') => {
    setPendingUploads(prev => {
      const current = prev[type];
      if (!current) return prev;
      return {
        ...prev,
        [type]: {
          ...current,
          mode
        }
      };
    });
  };

  // Accept Changes and run Final Validations
  const handleAcceptChanges = () => {
    // Determine the candidate state of each file after applying pending uploads
    const candidateFoodsCSV = (() => {
      const p = pendingUploads.foods;
      if (!p) return foodsCSV;
      if (p.mode === 'replace') return p.csvContent;
      return mergeGridCSV(foodsCSV, p.csvContent, 0, true).mergedCSV;
    })();

    const candidateMealsCSV = (() => {
      const p = pendingUploads.meals;
      if (!p) return mealsCSV;
      if (p.mode === 'replace') return p.csvContent;
      return mergeMealsCSV(mealsCSV, p.csvContent).mergedCSV;
    })();

    const candidateDVCSV = (() => {
      const p = pendingUploads.dailyValues;
      if (!p) return dailyValuesCSV;
      if (p.mode === 'replace') return p.csvContent;
      return mergeGridCSV(dailyValuesCSV, p.csvContent, -1, false).mergedCSV;
    })();

    const candidateLogCSV = (() => {
      const p = pendingUploads.foodLog;
      if (!p) return foodLogCSV;
      if (p.mode === 'replace') return p.csvContent;
      return mergeGridCSV(foodLogCSV, p.csvContent, 0, false).mergedCSV;
    })();

    // Collect any merge warnings
    const collectedWarnings: string[] = [];
    if (pendingUploads.foods && pendingUploads.foods.mode === 'merge') {
      const r = mergeGridCSV(foodsCSV, pendingUploads.foods.csvContent, 0, true);
      if (r.warnings.length > 0) collectedWarnings.push(...r.warnings);
    }

    // Run Final Validations
    const finalResult = validateFinal(
      candidateFoodsCSV,
      candidateMealsCSV,
      candidateDVCSV,
      candidateLogCSV,
      pendingUploads.foods ? pendingUploads.foods.mode : undefined,
      foodsCSV
    );

    if (!finalResult.valid) {
      setFinalErrorModal(finalResult.errors);
      return;
    }

    // Apply changes
    const updates: {
      foods?: string;
      meals?: string;
      dailyValues?: string;
      foodLog?: string;
    } = {};

    if (pendingUploads.foods) updates.foods = candidateFoodsCSV;
    if (pendingUploads.meals) updates.meals = candidateMealsCSV;
    if (pendingUploads.dailyValues) updates.dailyValues = candidateDVCSV;
    if (pendingUploads.foodLog) updates.foodLog = candidateLogCSV;

    onSaveData(updates);

    if (collectedWarnings.length > 0) {
      setWarningsModal(collectedWarnings);
    }

    // Show success dialog box
    setSuccessModal(true);
    // Reset pending uploads & close upload menu
    setPendingUploads({
      foods: null,
      meals: null,
      dailyValues: null,
      foodLog: null
    });
    setShowUploadMenu(false);
  };

  const handleCancelUpload = () => {
    setPendingUploads({
      foods: null,
      meals: null,
      dailyValues: null,
      foodLog: null
    });
    setShowUploadMenu(false);
  };

  return (
    <section className="w-full bg-white border-b border-neutral-200 py-3 sm:py-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Upload and Download Module Button Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setShowUploadMenu(true);
              setShowDownloadMenu(false);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              showUploadMenu
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Data</span>
          </button>

          <button
            onClick={() => {
              setShowDownloadMenu(true);
              setShowUploadMenu(false);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              showDownloadMenu
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Data</span>
          </button>
        </div>

        {/* Upload Data Menu */}
        {showUploadMenu && (
          <div className="mt-4 p-5 bg-neutral-50 border border-neutral-300 rounded-lg shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">
                Upload one or more files and click Accept Changes.
              </h2>
              <button
                onClick={() => setShowUploadMenu(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Close upload menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {fileConfigs.map(({ key, label, inputRef }) => {
                const pending = pendingUploads[key];
                const isUploaded = !!pending;

                return (
                  <div
                    key={key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                      isUploaded
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={inputRef}
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelected(key, file);
                            // reset input so same file can be re-selected if needed
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Upload</span>
                      </button>

                      <span className="text-sm font-semibold text-neutral-800">
                        {label}
                      </span>

                      {isUploaded && (
                        <span className="text-xs font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                          {pending.fileName}
                        </span>
                      )}
                    </div>

                    {isUploaded && (
                      <div className="flex items-center gap-4 text-xs font-medium text-neutral-700 pl-2 sm:pl-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`mode_${key}`}
                            value="merge"
                            checked={pending.mode === 'merge'}
                            onChange={() => handleSetMode(key, 'merge')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Merge with existing</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`mode_${key}`}
                            value="replace"
                            checked={pending.mode === 'replace'}
                            onChange={() => handleSetMode(key, 'replace')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Replace existing</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom action buttons */}
            <div className="mt-5 pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelUpload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-neutral-500" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleAcceptChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Accept Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Download Data Menu */}
        {showDownloadMenu && (
          <div className="mt-4 p-5 bg-neutral-50 border border-neutral-300 rounded-lg shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">
                Click the Download button next to a file to download it.
              </h2>
              <button
                onClick={() => setShowDownloadMenu(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Close download menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {fileConfigs.map(({ key, label, defaultFileName }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-800">
                      {label}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      ({defaultFileName})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDownload(key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Initial Validation Error Dialog: "File not uploaded" */}
      {initialErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-neutral-100">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-neutral-900">
                File not uploaded
              </h3>
            </div>
            <div className="mt-3 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-800">
                The uploaded {initialErrorModal.fileLabel} file failed initial validation:
              </p>
              <ul className="mt-2.5 space-y-1.5 max-h-60 overflow-y-auto pr-2 list-disc list-inside text-xs text-red-700 bg-red-50 p-3 rounded border border-red-200">
                {initialErrorModal.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInitialErrorModal(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Validation Error Dialog: "Changes not accepted" */}
      {finalErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-neutral-100">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-neutral-900">
                Changes not accepted
              </h3>
            </div>
            <div className="mt-3 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-800">
                The pending changes violate one or more final consistency rules:
              </p>
              <ul className="mt-2.5 space-y-1.5 max-h-60 overflow-y-auto pr-2 list-disc list-inside text-xs text-red-700 bg-red-50 p-3 rounded border border-red-200">
                {finalErrorModal.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setFinalErrorModal(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog: "Your changes have been saved" */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 border border-neutral-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Success
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Your changes have been saved.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setSuccessModal(false)}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Dialog (e.g. merge default assumptions) */}
      {warningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 pb-3 border-b border-neutral-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-neutral-900">
                Notice & Warnings
              </h3>
            </div>
            <div className="mt-3 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-800">
                Please review the following notices regarding your merged data:
              </p>
              <ul className="mt-2.5 space-y-1.5 max-h-60 overflow-y-auto pr-2 list-disc list-inside text-xs text-amber-800 bg-amber-50 p-3 rounded border border-amber-200">
                {warningsModal.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setWarningsModal(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
