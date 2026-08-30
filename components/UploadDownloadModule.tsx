"use client";

import {
  Check,
  Download,
  Upload,
  X,
} from "lucide-react";
import { useRef } from "react";
import Modal from "./Modal";
import type { MergeMode, UploadedFileState } from "@/lib/types";

type FileType = "foodInfo" | "meals" | "foodLog";

interface UploadDownloadModuleProps {
  showUpload: boolean;
  showDownload: boolean;
  onToggleUpload: () => void;
  onToggleDownload: () => void;
  onCloseUpload: () => void;
  onCloseDownload: () => void;
  uploads: Record<FileType, UploadedFileState | null>;
  onFileSelect: (type: FileType, file: File) => void;
  onModeChange: (type: FileType, mode: MergeMode) => void;
  onAcceptChanges: () => void;
  onCancelUpload: () => void;
  onDownload: (type: FileType) => void;
  errorModal: { title: string; errors: string[] } | null;
  onCloseError: () => void;
  successModal: boolean;
  onCloseSuccess: () => void;
}

const FILE_LABELS: Record<FileType, string> = {
  foodInfo: "Food Info",
  meals: "Meals",
  foodLog: "Food Log",
};

export default function UploadDownloadModule({
  showUpload,
  showDownload,
  onToggleUpload,
  onToggleDownload,
  onCloseUpload,
  onCloseDownload,
  uploads,
  onFileSelect,
  onModeChange,
  onAcceptChanges,
  onCancelUpload,
  onDownload,
  errorModal,
  onCloseError,
  successModal,
  onCloseSuccess,
}: UploadDownloadModuleProps) {
  const foodInfoRef = useRef<HTMLInputElement>(null);
  const mealsRef = useRef<HTMLInputElement>(null);
  const foodLogRef = useRef<HTMLInputElement>(null);

  const refs: Record<FileType, React.RefObject<HTMLInputElement | null>> = {
    foodInfo: foodInfoRef,
    meals: mealsRef,
    foodLog: foodLogRef,
  };

  const handleFileChange = (type: FileType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(type, file);
    e.target.value = "";
  };

  const hasValidUploads = Object.values(uploads).some((u) => u?.valid);

  return (
    <>
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onToggleUpload}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Upload className="h-4 w-4" />
            Upload Data
          </button>
          <button
            type="button"
            onClick={onToggleDownload}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Download Data
          </button>
        </div>

        {showUpload && (
          <div className="mt-6 rounded-2xl bg-emerald-50/50 p-5 ring-1 ring-emerald-100">
            <p className="mb-4 text-sm text-slate-700">
              Upload one or more files and click Accept Changes.
            </p>

            {(Object.keys(FILE_LABELS) as FileType[]).map((type) => {
              const upload = uploads[type];
              return (
                <div
                  key={type}
                  className={`mb-3 flex flex-wrap items-center gap-3 rounded-2xl p-3 ${
                    upload?.valid ? "bg-emerald-100/60 ring-1 ring-emerald-300" : "bg-white"
                  }`}
                >
                  <input
                    ref={refs[type]}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e)}
                  />
                  <button
                    type="button"
                    onClick={() => refs[type].current?.click()}
                    className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm transition hover:border-emerald-400"
                  >
                    <Upload className="h-4 w-4 text-emerald-600" />
                    Upload
                  </button>
                  <span className="text-sm font-medium text-slate-700">
                    {FILE_LABELS[type]}
                  </span>
                  {upload?.valid && (
                    <>
                      <span className="text-sm text-slate-600">
                        {upload.fileName}
                      </span>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name={`mode-${type}`}
                          checked={upload.mode === "merge"}
                          onChange={() => onModeChange(type, "merge")}
                        />
                        Merge with existing
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name={`mode-${type}`}
                          checked={upload.mode === "replace"}
                          onChange={() => onModeChange(type, "replace")}
                        />
                        Replace existing
                      </label>
                    </>
                  )}
                </div>
              );
            })}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onAcceptChanges}
                disabled={!hasValidUploads}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Accept Changes
              </button>
              <button
                type="button"
                onClick={onCancelUpload}
                className="flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {showDownload && (
          <div className="mt-6 rounded-2xl bg-emerald-50/50 p-5 ring-1 ring-emerald-100">
            <p className="mb-4 text-sm text-slate-700">
              Click the Download button next to a file to download it.
            </p>
            {(Object.keys(FILE_LABELS) as FileType[]).map((type) => (
              <div
                key={type}
                className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3"
              >
                <button
                  type="button"
                  onClick={() => onDownload(type)}
                  className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm transition hover:border-emerald-400"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  Download
                </button>
                <span className="text-sm font-medium text-slate-700">
                  {FILE_LABELS[type]}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={onCloseDownload}
              className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        )}
      </section>

      <Modal
        open={!!errorModal}
        onClose={onCloseError}
        title={errorModal?.title ?? ""}
      >
        <p className="mb-3 text-sm text-slate-600">
          The following errors must be addressed:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {errorModal?.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </Modal>

      <Modal open={successModal} onClose={onCloseSuccess} title="Success">
        <p className="text-sm text-slate-700">Your changes have been saved.</p>
      </Modal>
    </>
  );
}
