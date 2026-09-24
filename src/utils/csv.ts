/**
 * Robust CSV parser and serializer compliant with RFC 4180
 */

export function parseCSV(csvText: string): string[][] {
  if (!csvText || csvText.trim().length === 0) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentCell += '"';
        i += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r of \r\n
      }
      currentRow.push(currentCell);
      currentCell = '';
      // Only push non-empty rows or rows that had content
      if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0].trim() === '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  // Push last cell & row if remaining
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (!(currentRow.length === 1 && currentRow[0].trim() === '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function formatCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map(row => row.map(formatCSVCell).join(',')).join('\n');
}
