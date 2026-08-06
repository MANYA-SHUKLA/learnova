/** CSV helpers — no file I/O */

export function escapeCsvCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]!);
  const header = cols.map(escapeCsvCell).join(',');
  const body = rows
    .map((row) => cols.map((c) => escapeCsvCell(row[c])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}
