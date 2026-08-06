/** CSV helpers — no file I/O */

function stringifyCsvValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') return value.description ?? '';
  return JSON.stringify(value);
}

export function escapeCsvCell(value: unknown): string {
  const str = stringifyCsvValue(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const first = rows[0];
  if (!first) return '';
  const cols = columns ?? Object.keys(first);
  const header = cols.map(escapeCsvCell).join(',');
  const body = rows
    .map((row) => cols.map((c) => escapeCsvCell(row[c])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}
