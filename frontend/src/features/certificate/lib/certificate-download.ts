import { certificateApi } from '../services/certificate-api';

/** Opens print-ready certificate HTML (browser Save as PDF). */
export async function openCertificateForPrint(certificateId: string): Promise<void> {
  const html = await certificateApi.downloadHtml(certificateId);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
