export function parseCourseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

const HEADER_SKIP = /^(s\.?\s*no|course\s*code|code|subject|paper|title|name|credits?)/i;
const CODE_LINE =
  /^([A-Z0-9][A-Z0-9\-/.]{1,20})\s+(.+?)(?:\s+(\d+(?:\.\d+)?)\s*(?:cr|credits?|credit)?)?\.?\s*$/i;

export function parseCourseTextLines(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (const line of lines) {
    if (HEADER_SKIP.test(line)) continue;

    if (line.includes(',')) {
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2 && parts[0] && parts[1]) {
        rows.push({
          courseCode: parts[0],
          title: parts[1],
          credits: parts[2] || '3',
          status: parts[3] || 'published',
          visibility: 'institution',
          category: 'general',
          difficulty: 'intermediate',
          language: 'en',
        });
      }
      continue;
    }

    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        rows.push({
          courseCode: parts[0],
          title: parts[1],
          credits: parts[2] || '3',
          status: 'published',
          visibility: 'institution',
          category: 'general',
          difficulty: 'intermediate',
          language: 'en',
        });
      }
      continue;
    }

    const match = line.match(CODE_LINE);
    if (match?.[1] && match[2]) {
      rows.push({
        courseCode: match[1],
        title: match[2].trim(),
        credits: match[3] || '3',
        status: 'published',
        visibility: 'institution',
        category: 'general',
        difficulty: 'intermediate',
        language: 'en',
      });
    }
  }

  return rows;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const chunks: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    chunks.push(line);
  }
  return chunks.join('\n');
}

export const COURSE_IMPORT_CSV_TEMPLATE = `courseCode,title,credits,category,difficulty,language,status,visibility
CS101,Programming Fundamentals,4,programming,beginner,en,published,institution
ECE101,Basic Electronics,3,electronics,beginner,en,published,institution`;

export function downloadCsvTemplate() {
  const blob = new Blob([COURSE_IMPORT_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'course-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
