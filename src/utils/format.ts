// src/utils/format.ts
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  // Check if it looks like YYYY-MM-DD (year is 4 digits, month/day are 1-2 digits)
  if (!/^\d{4}$/.test(parts[0]) || !/^\d{1,2}$/.test(parts[1]) || !/^\d{1,2}$/.test(parts[2])) {
    return dateStr;
  }
  return parts.reverse().join('-');
}