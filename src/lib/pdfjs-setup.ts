import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let configured = false;

/** إعداد عامل PDF.js لمعالجة الملف داخل المتصفح */
export function setupPdfJs(): void {
  if (configured) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  configured = true;
}

export { pdfjsLib };
export type { PDFDocumentProxy } from 'pdfjs-dist';
