import React, { useRef, useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';
import { FileType, MergeOption, StagedFile } from '../types/nutrition';
import {
  validateFoodsCSV,
  validateMealsCSV,
  validateDailyValuesCSV,
  validateFoodLogCSV,
  runFinalValidations,
} from '../utils/validations';
import {
  mergeFoods,
  mergeMeals,
  mergeDailyValues,
  mergeFoodLog,
} from '../utils/merge';
import { DialogModal } from './DialogModal';

interface UploadDownloadModuleProps {
  foodsCsv: string;
  mealsCsv: string;
  dailyValuesCsv: string;
  foodLogCsv: string;
  onCommitChanges: (newFiles: {
    foodsCsv?: string;
    mealsCsv?: string;
    dailyValuesCsv?: string;
    foodLogCsv?: string;
  }) => void;
}

export const UploadDownloadModule: React.FC<UploadDownloadModuleProps> = ({
  foodsCsv,
  mealsCsv,
  dailyValuesCsv,
  foodLogCsv,
  onCommitChanges,
}) => {
  // Menu visibility
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Staged files for Upload Menu: map of FileType -> StagedFile
  const [stagedFiles, setStagedFiles] = useState<Map<FileType, StagedFile>>(new Map());

  // Dialog states
  const [fileNotUploadedDialog, setFileNotUploadedDialog] = useState<{
    open: boolean;
    fileName: string;
    errors: string[];
  }>({ open: false, fileName: '', errors: [] });

  const [changesNotAcceptedDialog, setChangesNotAcceptedDialog] = useState<{
    open: boolean;
    errors: string[];
  }>({ open: false, errors: [] });

  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    warnings: string[];
  }>({ open: false, warnings: [] });

  // Hidden file inputs
  const fileInputRefs: Record<FileType, React.RefObject<HTMLInputElement | null>> = {
    Foods: useRef<HTMLInputElement | null>(null),
    Meals: useRef<HTMLInputElement | null>(null),
    'Daily Values': useRef<HTMLInputElement | null>(null),
    'Food Log': useRef<HTMLInputElement | null>(null),
  };

  const fileTypes: FileType[] = ['Foods', 'Meals', 'Daily Values', 'Food Log'];

  // Handle file select & Initial Validations
  const handleFileChange = (fileType: FileType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset file input so re-uploading same file triggers change
    e.target.value = '';

    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = (event.target?.result as string) || '';
      let valResult = { valid: true, errors: [] as string[] };

      if (fileType === 'Foods') {
        valResult = validateFoodsCSV(content);
      } else if (fileType === 'Meals') {
        valResult = validateMealsCSV(content);
      } else if (fileType === 'Daily Values') {
        valResult = validateDailyValuesCSV(content);
      } else if (fileType === 'Food Log') {
        valResult = validateFoodLogCSV(content);
      }

      if (!valResult.valid) {
        // Show "File not uploaded" dialog
        setFileNotUploadedDialog({
          open: true,
          fileName: file.name,
          errors: valResult.errors,
        });
      } else {
        // Stage the file
        setStagedFiles(prev => {
          const next = new Map(prev);
          next.set(fileType, {
            fileType,
            fileName: file.name,
            content,
            mode: 'merge', // "Merge with existing" selected by default
            isValid: true,
          });
          return next;
        });
      }
    };
    reader.readAsText(file);
  };

  const setMergeMode = (fileType: FileType, mode: MergeOption) => {
    setStagedFiles(prev => {
      const next = new Map(prev);
      const existing = next.get(fileType);
      if (existing) {
        next.set(fileType, { ...existing, mode });
      }
      return next;
    });
  };

  const handleCancelUpload = () => {
    setStagedFiles(new Map());
    setShowUploadMenu(false);
  };

  const handleAcceptChanges = () => {
    if (stagedFiles.size === 0) {
      setShowUploadMenu(false);
      return;
    }

    // Compute prospective files after merge/replace
    let prospectFoods = foodsCsv;
    let prospectMeals = mealsCsv;
    let prospectDv = dailyValuesCsv;
    let prospectLog = foodLogCsv;
    const mergeWarnings: string[] = [];

    // Foods
    const stagedFoods = stagedFiles.get('Foods');
    let isFoodsMerged = false;
    let uploadedFoodsContent: string | undefined;

    if (stagedFoods) {
      uploadedFoodsContent = stagedFoods.content;
      if (stagedFoods.mode === 'replace') {
        prospectFoods = stagedFoods.content;
      } else {
        isFoodsMerged = true;
        const res = mergeFoods(foodsCsv, stagedFoods.content);
        prospectFoods = res.mergedCsv;
        mergeWarnings.push(...res.warnings);
      }
    }

    // Meals
    const stagedMeals = stagedFiles.get('Meals');
    if (stagedMeals) {
      if (stagedMeals.mode === 'replace') {
        prospectMeals = stagedMeals.content;
      } else {
        prospectMeals = mergeMeals(mealsCsv, stagedMeals.content);
      }
    }

    // Daily Values
    const stagedDv = stagedFiles.get('Daily Values');
    if (stagedDv) {
      if (stagedDv.mode === 'replace') {
        prospectDv = stagedDv.content;
      } else {
        prospectDv = mergeDailyValues(dailyValuesCsv, stagedDv.content);
      }
    }

    // Food Log
    const stagedLog = stagedFiles.get('Food Log');
    if (stagedLog) {
      if (stagedLog.mode === 'replace') {
        prospectLog = stagedLog.content;
      } else {
        prospectLog = mergeFoodLog(foodLogCsv, stagedLog.content);
      }
    }

    // Run Final Validations
    const finalVal = runFinalValidations(
      prospectFoods,
      prospectMeals,
      prospectDv,
      prospectLog,
      uploadedFoodsContent,
      isFoodsMerged
    );

    if (!finalVal.valid) {
      setChangesNotAcceptedDialog({
        open: true,
        errors: finalVal.errors,
      });
      return;
    }

    // Success! Commit changes
    onCommitChanges({
      foodsCsv: stagedFoods ? prospectFoods : undefined,
      mealsCsv: stagedMeals ? prospectMeals : undefined,
      dailyValuesCsv: stagedDv ? prospectDv : undefined,
      foodLogCsv: stagedLog ? prospectLog : undefined,
    });

    setStagedFiles(new Map());
    setShowUploadMenu(false);
    setSuccessDialog({
      open: true,
      warnings: mergeWarnings,
    });
  };

  // Trigger file download
  const downloadFile = (fileType: FileType) => {
    let content = '';
    let defaultFileName = '';

    if (fileType === 'Foods') {
      content = foodsCsv;
      defaultFileName = 'Foods.csv';
    } else if (fileType === 'Meals') {
      content = mealsCsv;
      defaultFileName = 'Meals.csv';
    } else if (fileType === 'Daily Values') {
      content = dailyValuesCsv;
      defaultFileName = 'Daily Values.csv';
    } else if (fileType === 'Food Log') {
      content = foodLogCsv;
      defaultFileName = 'Food Log.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', defaultFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="w-full bg-slate-50 border-b border-slate-200 py-4 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Row of two buttons side-by-side */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowUploadMenu(true);
              setShowDownloadMenu(false);
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-xs ${
              showUploadMenu
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </button>

          <button
            onClick={() => {
              setShowDownloadMenu(true);
              setShowUploadMenu(false);
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border shadow-xs ${
              showDownloadMenu
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download Data
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Active files: Foods, Meals, Daily Values, Food Log</span>
        </div>
      </div>

      {/* Upload Data Menu Dialog */}
      <DialogModal
        isOpen={showUploadMenu}
        onClose={handleCancelUpload}
        title="Upload Data Menu"
        maxWidth="max-w-2xl"
        icon={<Upload className="w-5 h-5 text-emerald-600" />}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Upload one or more files and click Accept Changes.
          </p>

          <div className="space-y-3">
            {fileTypes.map(fileType => {
              const staged = stagedFiles.get(fileType);
              const isStaged = !!staged;

              return (
                <div
                  key={fileType}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isStaged
                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-xs ring-1 ring-emerald-300/60'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Button with Upload Icon followed by Label */}
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRefs[fileType]}
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={e => handleFileChange(fileType, e)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs[fileType].current?.click()}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border shadow-2xs ${
                        isStaged
                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload {fileType}</span>
                    </button>
                    <span className="font-semibold text-sm">{fileType}</span>
                  </div>

                  {/* Right: Filename and Radio Buttons if staged */}
                  {isStaged && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                      <span className="font-mono px-2 py-1 bg-white/80 rounded border border-emerald-200 text-emerald-800 font-semibold truncate max-w-[180px]">
                        {staged.fileName}
                      </span>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge-mode-${fileType}`}
                            value="merge"
                            checked={staged.mode === 'merge'}
                            onChange={() => setMergeMode(fileType, 'merge')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Merge with existing</span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge-mode-${fileType}`}
                            value="replace"
                            checked={staged.mode === 'replace'}
                            onChange={() => setMergeMode(fileType, 'replace')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Replace existing</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAcceptChanges}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept Changes
            </button>
          </div>
        </div>
      </DialogModal>

      {/* Download Data Menu Dialog */}
      <DialogModal
        isOpen={showDownloadMenu}
        onClose={() => setShowDownloadMenu(false)}
        title="Download Data Menu"
        maxWidth="max-w-lg"
        icon={<Download className="w-5 h-5 text-slate-700" />}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Click the Download button next to a file to download it.
          </p>

          <div className="space-y-2.5">
            {fileTypes.map(fileType => (
              <div
                key={fileType}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadFile(fileType)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download</span>
                  </button>
                  <span className="font-semibold text-sm text-slate-800">{fileType}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {fileType}.csv
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDownloadMenu(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogModal>

      {/* "File not uploaded" Dialog */}
      <DialogModal
        isOpen={fileNotUploadedDialog.open}
        onClose={() => setFileNotUploadedDialog(prev => ({ ...prev, open: false }))}
        title="File not uploaded"
        maxWidth="max-w-lg"
        icon={<XCircle className="w-5 h-5 text-red-500" />}
        footer={
          <button
            onClick={() => setFileNotUploadedDialog(prev => ({ ...prev, open: false }))}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            Dismiss
          </button>
        }
      >
        <div className="space-y-3">
          <p className="font-semibold text-slate-800 text-sm">
            Validation failed for file: <span className="font-mono text-red-600">{fileNotUploadedDialog.fileName}</span>
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
            {fileNotUploadedDialog.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </DialogModal>

      {/* "Changes not accepted" Dialog */}
      <DialogModal
        isOpen={changesNotAcceptedDialog.open}
        onClose={() => setChangesNotAcceptedDialog(prev => ({ ...prev, open: false }))}
        title="Changes not accepted"
        maxWidth="max-w-lg"
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        footer={
          <button
            onClick={() => setChangesNotAcceptedDialog(prev => ({ ...prev, open: false }))}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            Review Issues
          </button>
        }
      >
        <div className="space-y-3">
          <p className="font-semibold text-slate-800 text-sm">
            Cross-file final validations failed. Please resolve the following errors before accepting changes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            {changesNotAcceptedDialog.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </DialogModal>

      {/* Success Dialog */}
      <DialogModal
        isOpen={successDialog.open}
        onClose={() => setSuccessDialog({ open: false, warnings: [] })}
        title="Success"
        maxWidth="max-w-md"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        footer={
          <button
            onClick={() => setSuccessDialog({ open: false, warnings: [] })}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            OK
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">
            Your changes have been saved.
          </p>
          {successDialog.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <span className="font-semibold block">Notice:</span>
              {successDialog.warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          )}
        </div>
      </DialogModal>
    </section>
  );
};
