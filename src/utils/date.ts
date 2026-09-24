const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date as "September 23, 2026"
 */
export function formatDateLong(dateInput: Date | string): string {
  let d: Date;
  if (typeof dateInput === 'string') {
    // If MM/DD/YYYY
    const parts = dateInput.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else if (dateInput.includes('-')) {
      // YYYY-MM-DD
      const yparts = dateInput.split('-');
      d = new Date(parseInt(yparts[0], 10), parseInt(yparts[1], 10) - 1, parseInt(yparts[2], 10));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return dateInput.toString();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format to MM/DD/YYYY (e.g. 09/23/2026)
 */
export function toMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Format to YYYY-MM-DD for <input type="date" />
 */
export function toInputDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse from YYYY-MM-DD to Date
 */
export function fromInputDate(str: string): Date {
  const [yyyy, mm, dd] = str.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

/**
 * Parse MM/DD/YYYY to YYYY-MM-DD
 */
export function mmddyyyyToInputDate(str: string): string {
  const parts = str.split('/');
  if (parts.length !== 3) return '';
  const mm = parts[0].padStart(2, '0');
  const dd = parts[1].padStart(2, '0');
  const yyyy = parts[2];
  return `${yyyy}-${mm}-${dd}`;
}
