import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts an array of objects to a CSV string.
 * @param rows Array of objects (all keys should be strings)
 * @returns CSV string
 */
export function arrayToCsv<T extends Record<string, any>>(rows: T[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const csv = [headers.join(',')]
    .concat(rows.map(row => headers.map(h => escape(row[h])).join(',')))
    .join('\n');
  return csv;
}

/**
 * Triggers a download of a string as a file.
 * @param content The file content
 * @param filename The file name (should include .csv)
 */
export function downloadStringAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
