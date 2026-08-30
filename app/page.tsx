"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadDownloadModule from "@/components/UploadDownloadModule";
import FoodLogEntryModule from "@/components/FoodLogEntryModule";
import NutrientBreakdownModule from "@/components/NutrientBreakdownModule";
import {
  parseFoodInfo,
  parseMeals,
  parseFoodLog,
  serializeFoodInfo,
  serializeMeals,
  serializeFoodLog,
} from "@/lib/csv/parse";
import {
  validateFoodInfoInitial,
  validateMealsInitial,
  validateFoodLogInitial,
  validateFinal,
} from "@/lib/csv/validate";
import {
  mergeFoodInfo,
  mergeMeals,
  mergeFoodLog,
  replaceContent,
} from "@/lib/csv/merge";
import { addLogEntry, resolveMealComponents } from "@/lib/nutrients";
import type {
  BreakdownSelection,
  FoodInfoData,
  FoodLogData,
  MealsData,
  MergeMode,
  UploadedFileState,
} from "@/lib/types";

type FileType = "foodInfo" | "meals" | "foodLog";

const EMPTY_UPLOADS: Record<FileType, UploadedFileState | null> = {
  foodInfo: null,
  meals: null,
  foodLog: null,
};

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [foodInfoContent, setFoodInfoContent] = useState("");
  const [mealsContent, setMealsContent] = useState("");
  const [foodLogContent, setFoodLogContent] = useState("");
  const [foodInfo, setFoodInfo] = useState<FoodInfoData>({
    headers: [],
    nutrients: [],
    dailyValues: {},
    foods: [],
  });
  const [meals, setMeals] = useState<MealsData>({ meals: [] });
  const [foodLog, setFoodLog] = useState<FoodLogData>({
    headers: ["Date"],
    entries: [],
  });
  const [loaded, setLoaded] = useState(false);

  const [logDate, setLogDate] = useState(() => new Date());
  const [breakdownSelection, setBreakdownSelection] =
    useState<BreakdownSelection>(() => ({
      type: "foodLog",
      date: new Date(),
    }));

  const [logItem, setLogItem] = useState("");
  const [logQuantity, setLogQuantity] = useState("");
  const [logUnit, setLogUnit] = useState<"g" | "servings">("g");

  const [showUpload, setShowUpload] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [uploads, setUploads] =
    useState<Record<FileType, UploadedFileState | null>>(EMPTY_UPLOADS);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    errors: string[];
  } | null>(null);
  const [successModal, setSuccessModal] = useState(false);

  const refreshParsed = useCallback(
    (fiContent: string, mContent: string, flContent: string) => {
      const fi = parseFoodInfo(fiContent);
      const m = resolveMealComponents(parseMeals(mContent), fi);
      const fl = parseFoodLog(flContent);
      setFoodInfo(fi);
      setMeals(m);
      setFoodLog(fl);
    },
    []
  );

  useEffect(() => {
    async function loadData() {
      const [fi, m, fl] = await Promise.all([
        fetch("/Food%20Info.csv").then((r) => r.text()),
        fetch("/Meals.csv").then((r) => r.text()),
        fetch("/Food%20Log.csv").then((r) => r.text()),
      ]);
      setFoodInfoContent(fi);
      setMealsContent(m);
      setFoodLogContent(fl);
      refreshParsed(fi, m, fl);
      setLoaded(true);
    }
    loadData();
  }, [refreshParsed]);

  const handleLogDateChange = (date: Date) => {
    setLogDate(date);
    setBreakdownSelection({ type: "foodLog", date });
  };

  const handleAddLog = () => {
    const qty = parseFloat(logQuantity);
    if (!logItem || isNaN(qty) || qty <= 0) return;

    const foodMap = new Map(foodInfo.foods.map((f) => [f.name, f]));
    const mealMap = new Map(meals.meals.map((m) => [m.name, m]));
    const isMeal = mealMap.has(logItem) && !foodMap.has(logItem);

    const updated = addLogEntry(
      foodLog,
      logDate,
      logItem,
      qty,
      isMeal ? "servings" : logUnit,
      isMeal,
      foodInfo
    );

    const content = serializeFoodLog(updated);
    setFoodLog(updated);
    setFoodLogContent(content);
    setLogItem("");
    setLogQuantity("");
    setLogUnit("g");
  };

  const handleFileSelect = async (type: FileType, file: File) => {
    const content = await file.text();
    let errors: string[] = [];

    if (type === "foodInfo") {
      errors = validateFoodInfoInitial(content);
    } else if (type === "meals") {
      errors = validateMealsInitial(content);
    } else {
      errors = validateFoodLogInitial(content);
    }

    if (errors.length > 0) {
      setErrorModal({ title: "File not uploaded", errors });
      return;
    }

    setUploads((prev) => ({
      ...prev,
      [type]: {
        fileName: file.name,
        content,
        mode: "merge" as MergeMode,
        valid: true,
      },
    }));
  };

  const handleAcceptChanges = () => {
    let newFoodInfo = foodInfoContent;
    let newMeals = mealsContent;
    let newFoodLog = foodLogContent;
    const warnings: string[] = [];

    if (uploads.foodInfo?.valid) {
      if (uploads.foodInfo.mode === "merge") {
        const result = mergeFoodInfo(foodInfoContent, uploads.foodInfo.content);
        newFoodInfo = result.content;
        warnings.push(...result.warnings);
      } else {
        newFoodInfo = replaceContent(foodInfoContent, uploads.foodInfo.content);
      }
    }

    if (uploads.meals?.valid) {
      if (uploads.meals.mode === "merge") {
        newMeals = mergeMeals(mealsContent, uploads.meals.content);
      } else {
        newMeals = replaceContent(mealsContent, uploads.meals.content);
      }
    }

    if (uploads.foodLog?.valid) {
      if (uploads.foodLog.mode === "merge") {
        newFoodLog = mergeFoodLog(foodLogContent, uploads.foodLog.content);
      } else {
        newFoodLog = replaceContent(foodLogContent, uploads.foodLog.content);
      }
    }

    const finalErrors = validateFinal(
      newFoodInfo,
      newMeals,
      newFoodLog,
      uploads.foodInfo?.valid ? uploads.foodInfo.content : undefined,
      uploads.meals?.valid ? uploads.meals.content : undefined
    );

    if (finalErrors.length > 0) {
      setErrorModal({ title: "Changes not accepted", errors: finalErrors });
      return;
    }

    setFoodInfoContent(newFoodInfo);
    setMealsContent(newMeals);
    setFoodLogContent(newFoodLog);
    refreshParsed(newFoodInfo, newMeals, newFoodLog);
    setUploads(EMPTY_UPLOADS);
    setShowUpload(false);
    setSuccessModal(true);

    if (warnings.length > 0) {
      setTimeout(() => {
        setErrorModal({
          title: "Warnings",
          errors: warnings,
        });
      }, 500);
    }
  };

  const handleDownload = (type: FileType) => {
    if (type === "foodInfo") {
      downloadCsv(foodInfoContent, "Food Info.csv");
    } else if (type === "meals") {
      downloadCsv(mealsContent, "Meals.csv");
    } else {
      downloadCsv(foodLogContent, "Food Log.csv");
    }
  };

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Header />

        <UploadDownloadModule
          showUpload={showUpload}
          showDownload={showDownload}
          onToggleUpload={() => {
            setShowUpload(!showUpload);
            setShowDownload(false);
          }}
          onToggleDownload={() => {
            setShowDownload(!showDownload);
            setShowUpload(false);
          }}
          onCloseUpload={() => setShowUpload(false)}
          onCloseDownload={() => setShowDownload(false)}
          uploads={uploads}
          onFileSelect={handleFileSelect}
          onModeChange={(type, mode) =>
            setUploads((prev) => ({
              ...prev,
              [type]: prev[type] ? { ...prev[type]!, mode } : null,
            }))
          }
          onAcceptChanges={handleAcceptChanges}
          onCancelUpload={() => {
            setUploads(EMPTY_UPLOADS);
            setShowUpload(false);
          }}
          onDownload={handleDownload}
          errorModal={errorModal}
          onCloseError={() => setErrorModal(null)}
          successModal={successModal}
          onCloseSuccess={() => setSuccessModal(false)}
        />

        <FoodLogEntryModule
          logDate={logDate}
          onLogDateChange={handleLogDateChange}
          itemName={logItem}
          onItemChange={setLogItem}
          quantity={logQuantity}
          onQuantityChange={setLogQuantity}
          unit={logUnit}
          onUnitChange={setLogUnit}
          onAdd={handleAddLog}
          foodInfo={foodInfo}
          meals={meals}
        />

        <NutrientBreakdownModule
          selection={breakdownSelection}
          onSelectionChange={setBreakdownSelection}
          foodInfo={foodInfo}
          meals={meals}
          foodLog={foodLog}
          logDate={logDate}
        />

        <Footer />
      </div>
    </div>
  );
}
