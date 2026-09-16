// أدوات الطباعة والتصدير (PDF عبر "حفظ كـ PDF" في المتصفح)
export function printArea() {
  // طباعة العنصر الحامل لخاصية print-area
  const area = document.querySelector<HTMLElement>('[data-printable="true"]');
  if (!area) {
    window.print();
    return;
  }
  const prev = document.title;
  const title = area.getAttribute('data-print-title') || prev;
  document.title = title;
  window.print();
  document.title = prev;
}

export function suggestPdfFileName(base: string): string {
  return base.replace(/[\\/:*?"<>|]/g, '-').trim() + '.pdf';
}
