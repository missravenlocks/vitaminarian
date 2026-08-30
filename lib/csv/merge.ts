import { parseCsv, parseNumeric } from "./parse";

export function mergeFoodInfo(
  existingContent: string,
  uploadedContent: string
): { content: string; warnings: string[] } {
  const warnings: string[] = [];
  const existing = parseCsv(existingContent);
  const uploaded = parseCsv(uploadedContent);

  const existingHeaders = [...existing[0]];
  const uploadedHeaders = uploaded[0];

  const existingFoodMap = new Map<string, number>();
  for (let r = 1; r < existing.length; r++) {
    const name = existing[r][0]?.trim();
    if (name && name !== "Daily Value") {
      existingFoodMap.set(name, r);
    }
  }

  const newHeaders = [...existingHeaders];
  for (let i = 1; i < uploadedHeaders.length; i++) {
    if (!newHeaders.includes(uploadedHeaders[i])) {
      newHeaders.push(uploadedHeaders[i]);
    }
  }

  const result: string[][] = [newHeaders];

  const dailyValueRow = new Array(newHeaders.length).fill("");
  dailyValueRow[0] = "Daily Value";

  const existingDVIdx = existing.findIndex(
    (r) => r[0]?.trim() === "Daily Value"
  );
  if (existingDVIdx >= 0) {
    for (let c = 0; c < existingHeaders.length; c++) {
      const nhIdx = newHeaders.indexOf(existingHeaders[c]);
      if (nhIdx >= 0) {
        dailyValueRow[nhIdx] = existing[existingDVIdx][c] ?? "";
      }
    }
  }

  const uploadedDVIdx = uploaded.findIndex(
    (r) => r[0]?.trim() === "Daily Value"
  );
  if (uploadedDVIdx >= 0) {
    for (let c = 0; c < uploadedHeaders.length; c++) {
      const nhIdx = newHeaders.indexOf(uploadedHeaders[c]);
      if (nhIdx >= 0) {
        dailyValueRow[nhIdx] = uploaded[uploadedDVIdx][c] ?? "";
      }
    }
  }
  result.push(dailyValueRow);

  const mergedFoods = new Map<string, string[]>();

  for (let r = 1; r < existing.length; r++) {
    const name = existing[r][0]?.trim();
    if (name && name !== "Daily Value") {
      const row = new Array(newHeaders.length).fill("");
      row[0] = name;
      for (let c = 0; c < existingHeaders.length; c++) {
        const nhIdx = newHeaders.indexOf(existingHeaders[c]);
        if (nhIdx >= 0) row[nhIdx] = existing[r][c] ?? "";
      }
      mergedFoods.set(name, row);
    }
  }

  const uploadedFoodNames: string[] = [];
  for (let r = 1; r < uploaded.length; r++) {
    const name = uploaded[r][0]?.trim();
    if (name && name !== "Daily Value") {
      uploadedFoodNames.push(name);

      if (mergedFoods.has(name)) {
        const row = mergedFoods.get(name)!;
        for (let c = 0; c < uploadedHeaders.length; c++) {
          const nhIdx = newHeaders.indexOf(uploadedHeaders[c]);
          if (nhIdx >= 0) row[nhIdx] = uploaded[r][c] ?? "";
        }
      } else {
        const row = new Array(newHeaders.length).fill("");
        row[0] = name;
        for (let c = 0; c < uploadedHeaders.length; c++) {
          const nhIdx = newHeaders.indexOf(uploadedHeaders[c]);
          if (nhIdx >= 0) row[nhIdx] = uploaded[r][c] ?? "";
        }

        const missingCols = existingHeaders.slice(1).filter(
          (h) => !uploadedHeaders.includes(h)
        );
        if (missingCols.length > 0) {
          warnings.push(
            `New Food "${name}" does not include all metadata columns present in the existing file. These will be assumed to have a value of zero.`
          );
        }

        mergedFoods.set(name, row);
      }
    }
  }

  for (let i = 1; i < uploadedHeaders.length; i++) {
    const h = uploadedHeaders[i];
    if (!existingHeaders.includes(h)) {
      warnings.push(
        `New nutrient "${h}" does not include all Food rows present in the existing file. Non-included Foods will be assumed to have a value of zero.`
      );
    }
  }

  for (const [, row] of mergedFoods) {
    result.push(row);
  }

  return { content: result.map((r) => r.join(",")).join("\n"), warnings };
}

export function mergeMeals(
  existingContent: string,
  uploadedContent: string
): string {
  const existing = parseCsv(existingContent.trim());
  const uploaded = parseCsv(uploadedContent.trim());

  if (existing.length <= 1 && existing[0]?.length <= 1) {
    return uploadedContent.trim() || "Meal Name,Component,Quantity,Unit";
  }

  if (uploaded.length <= 1) {
    return existing.map((r) => r.join(",")).join("\n");
  }

  const existingMeals = new Map<string, string[][]>();
  const existingOrder: string[] = [];

  if (existing.length > 1) {
    for (let r = 1; r < existing.length; r++) {
      const mealName = existing[r][0]?.trim() ?? "";
      if (!mealName) continue;
      if (!existingMeals.has(mealName)) {
        existingMeals.set(mealName, []);
        existingOrder.push(mealName);
      }
      existingMeals.get(mealName)!.push(existing[r]);
    }
  }

  const uploadedMeals = new Map<string, string[][]>();
  const uploadedOrder: string[] = [];

  for (let r = 1; r < uploaded.length; r++) {
    const mealName = uploaded[r][0]?.trim() ?? "";
    if (!mealName) continue;
    if (!uploadedMeals.has(mealName)) {
      uploadedMeals.set(mealName, []);
      uploadedOrder.push(mealName);
    }
    uploadedMeals.get(mealName)!.push(uploaded[r]);
  }

  const result: string[][] = [["Meal Name", "Component", "Quantity", "Unit"]];
  const finalOrder = [...existingOrder];

  for (const meal of uploadedOrder) {
    if (!finalOrder.includes(meal)) {
      finalOrder.push(meal);
    }
  }

  for (const meal of finalOrder) {
    if (uploadedMeals.has(meal)) {
      for (const row of uploadedMeals.get(meal)!) {
        result.push(row);
      }
    } else if (existingMeals.has(meal)) {
      for (const row of existingMeals.get(meal)!) {
        result.push(row);
      }
    }
  }

  return result.map((r) => r.join(",")).join("\n");
}

export function mergeFoodLog(
  existingContent: string,
  uploadedContent: string
): string {
  const existingTrimmed = existingContent.trim();
  const uploadedTrimmed = uploadedContent.trim();

  if (!existingTrimmed || existingTrimmed === "Date") {
    return uploadedTrimmed || "Date";
  }

  if (!uploadedTrimmed || uploadedTrimmed === "Date") {
    return existingTrimmed;
  }

  const existing = parseCsv(existingTrimmed);
  const uploaded = parseCsv(uploadedTrimmed);

  const existingHeaders = [...existing[0]];
  const uploadedHeaders = uploaded[0];

  const newHeaders = [...existingHeaders];
  for (let i = 1; i < uploadedHeaders.length; i++) {
    if (!newHeaders.includes(uploadedHeaders[i])) {
      newHeaders.push(uploadedHeaders[i]);
    }
  }

  const dateMap = new Map<string, string[]>();

  for (let r = 1; r < existing.length; r++) {
    const date = existing[r][0]?.trim();
    if (!date) continue;
    const row = new Array(newHeaders.length).fill("");
    row[0] = date;
    for (let c = 0; c < existingHeaders.length; c++) {
      const nhIdx = newHeaders.indexOf(existingHeaders[c]);
      if (nhIdx >= 0) row[nhIdx] = existing[r][c] ?? "";
    }
    dateMap.set(date, row);
  }

  for (let r = 1; r < uploaded.length; r++) {
    const date = uploaded[r][0]?.trim();
    if (!date) continue;

    if (dateMap.has(date)) {
      const row = dateMap.get(date)!;
      for (let c = 0; c < uploadedHeaders.length; c++) {
        const nhIdx = newHeaders.indexOf(uploadedHeaders[c]);
        if (nhIdx >= 0) row[nhIdx] = uploaded[r][c] ?? "";
      }
    } else {
      const row = new Array(newHeaders.length).fill("");
      row[0] = date;
      for (let c = 0; c < uploadedHeaders.length; c++) {
        const nhIdx = newHeaders.indexOf(uploadedHeaders[c]);
        if (nhIdx >= 0) row[nhIdx] = uploaded[r][c] ?? "";
      }
      dateMap.set(date, row);
    }
  }

  const result: string[][] = [newHeaders];
  for (const [, row] of dateMap) {
    result.push(row);
  }

  return result.map((r) => r.join(",")).join("\n");
}

export function replaceContent(_existing: string, uploaded: string): string {
  return uploaded;
}
