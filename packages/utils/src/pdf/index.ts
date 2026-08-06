/**
 * PDF preparation — interface only.
 * Wire pdfkit/puppeteer when certificate generation ships.
 */

export interface PdfDocumentInput {
  title: string;
  content: string;
  metadata?: Record<string, string>;
}

export interface PdfRenderer {
  render(input: PdfDocumentInput): Promise<Buffer>;
}

export class PdfNotWiredError extends Error {
  constructor() {
    super('PDF renderer is not wired yet — infrastructure preparation only');
    this.name = 'PdfNotWiredError';
  }
}

export const pdfPrep = {
  render(_input: PdfDocumentInput): Promise<Buffer> {
    return Promise.reject(new PdfNotWiredError());
  },
};
