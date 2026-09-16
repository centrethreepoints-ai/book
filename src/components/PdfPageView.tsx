// عرض صفحة الكتاب الأصلية من ملف PDF المخزن (عبر canvas)
import { useEffect, useRef, useState } from 'react';
import { pdfjsLib } from '../lib/pdfjs-setup';
import { Modal, Btn } from './ui';
import { UNREADABLE } from '../lib/arabic';

export function OpenPageModal({
  bookId,
  page,
  onClose,
  loadBuffer,
  hasPdf,
}: {
  bookId: string;
  page: number;
  onClose: () => void;
  loadBuffer: (id: string) => Promise<ArrayBuffer | undefined>;
  hasPdf: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  if (!hasPdf) {
    return (
      <Modal open onClose={onClose} title={`الصفحة ${page} — النسخة الأصلية`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📕</div>
          <p className="font-bold text-manar-950">لا يتوفر ملف PDF لعرض الصفحة الأصلية</p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            تعذر جلب ملف الـ PDF في هذه الجلسة (نسخة تجريبية أو حجم كبير/اتصال). المحتوى النصي للدرس مستخرج من نفس الصفحات ومتاح بالكامل — أعد المحاولة لاحقاً أو تحقق من اتصالك لتفعيل عرض الصفحات المصورة.
          </p>
          <div className="mt-5">
            <Btn onClick={onClose}>حسناً</Btn>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`الصفحة ${page} — الكتاب الأصلي`} wide>
      <PdfPage bookId={bookId} page={page} loadBuffer={loadBuffer} onError={(e) => setError(e)} loading={loading} setLoading={setLoading} />
      {error && (
        <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-semibold">
          {error === 'unreadable' ? UNREADABLE : error}
        </div>
      )}
    </Modal>
  );
}

function PdfPage({
  bookId,
  page,
  loadBuffer,
  onError,
  loading,
  setLoading,
}: {
  bookId: string;
  page: number;
  loadBuffer: (id: string) => Promise<ArrayBuffer | undefined>;
  onError: (e: string) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1.4);
  const [h, setH] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const buf = await loadBuffer(bookId);
        if (!buf) {
          if (!cancelled) {
            onError('تعذر تحميل ملف PDF من قاعدة البيانات المحلية.');
            setLoading(false);
          }
          return;
        }
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
        if (cancelled) return;
        if (page < 1 || page > doc.numPages) {
          onError(`رقم الصفحة ${page} غير موجود في الملف (المجموع ${doc.numPages}).`);
          setLoading(false);
          return;
        }
        const p = await doc.getPage(page);
        if (cancelled) return;
        const viewport = p.getViewport({ scale: zoom });
        const canvas = ref.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          await p.render({ canvasContext: ctx, viewport }).promise;
          if (!cancelled) setH(viewport.height);
        }
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error && /No "Text" objects/.test(e.message) ? 'unreadable' : 'تعذر عرض هذه الصفحة — ' + (e instanceof Error ? e.message : 'خطأ غير معروف');
          onError(msg);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, page, zoom]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-slate-500">تكبير:</span>
        <Btn variant="secondary" className="!px-3 !py-1" onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.3).toFixed(2)))}>−</Btn>
        <span className="text-xs font-bold nums w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Btn variant="secondary" className="!px-3 !py-1" onClick={() => setZoom((z) => Math.min(3, +(z + 0.3).toFixed(2)))}>+</Btn>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 grid place-items-center">
        {loading && <div className="py-16 text-sm font-semibold text-slate-400">جارٍ تحميل الصفحة الأصلية…</div>}
        {!loading && h === null && <div className="py-16 text-sm font-semibold text-slate-400">لا يمكن عرض الصفحة</div>}
        <canvas ref={ref} style={{ maxWidth: '100%', height: h ? 'auto' : undefined }} />
      </div>
    </div>
  );
}
