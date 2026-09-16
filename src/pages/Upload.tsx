// صفحة رفع الكتاب المدرسي (PDF) + الاستخراج
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, FlaskConical, Loader2, ShieldCheck } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, Btn, Progress, useToast } from '../components/ui';
import type { ExtractionReport } from '../types';

export function Upload() {
  const { state, uploadPdf, loadDemo } = useApp();
  const { toast } = useToast();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, stage: '' });
  const [report, setReport] = useState<ExtractionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!/\.pdf$/i.test(file.name)) {
      setError('الملف يجب أن يكون بصيغة PDF.');
      return;
    }
    setError(null);
    setReport(null);
    setBusy(true);
    setProgress({ done: 0, total: 0, stage: 'بدء الاستخراج…' });
    try {
      const rep = await uploadPdf(file, (done, total, stage) => setProgress({ done, total, stage }));
      setReport(rep);
      toast('تم استخراج الكتاب وبناء الفهرس بنجاح', 'ok');
    } catch (e) {
      console.error(e);
      setError('تعذر معالجة ملف PDF. تأكد من سلامة الملف وحجمه ثم أعد المحاولة. ' + (e instanceof Error ? e.message : ''));
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    await loadDemo();
    setBusy(false);
    toast('تم تحميل البيانات التجريبية — استكشف المنصة بحرية', 'ok');
    nav('/book');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">📚 الكتاب المدرسي</h1>
        <p className="text-sm text-slate-500 mt-1">
          ارفع نسخة PDF من «{state.settings.bookTitle}». ستقرأ المنصة الكتاب صفحة بصفحة وتبني الفهرس التعليمي تلقائياً.
        </p>
      </div>

      {/* حالة الكتاب الحالي */}
      {state.book && (
        <Card>
          <CardHead
            icon={<FileText className="w-5 h-5" />}
            title={state.book.title}
            sub={`${state.book.pageCount} صفحة · ${state.lessons.length} درس · مرفوع ${new Date(state.book.uploadedAt).toLocaleDateString('ar')} ${state.book.isDemo ? '· نسخة تجريبية' : ''}`}
          />
          <div className="px-5 pb-4 flex flex-wrap gap-2 text-xs">
            {state.pages.filter((p) => !p.readable).length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-manar-700 bg-manar-50 border border-manar-200 rounded-full px-3 py-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" /> جميع الصفحات قابلة للقراءة النصية
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 font-bold">
                <AlertTriangle className="w-4 h-4" /> {state.pages.filter((p) => !p.readable).length} صفحة مصورة — «تعذر استخراج هذا الجزء»
              </span>
            )}
            <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 text-manar-700 bg-white border border-manar-200 hover:bg-manar-50 rounded-full px-3 py-1.5 font-bold transition">
              <UploadCloud className="w-4 h-4" /> استبدال الكتاب
            </button>
          </div>
        </Card>
      )}

      {/* منطقة الرفع */}
      <Card>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`m-4 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            drag ? 'border-manar-400 bg-manar-50' : 'border-slate-200 hover:border-manar-300 hover:bg-manar-50/40'
          }`}
        >
          {busy ? (
            <div className="py-4">
              <Loader2 className="w-10 h-10 mx-auto text-manar-500 animate-spin" />
              <div className="mt-4 font-bold text-manar-950">{progress.stage || 'جارٍ المعالجة…'}</div>
              {progress.total > 0 && (
                <div className="mt-4 max-w-sm mx-auto">
                  <Progress value={progress.done} max={progress.total} label={`الصفحات ${progress.done} / ${progress.total}`} />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-manar-50 text-manar-600 grid place-items-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="mt-4 font-extrabold text-manar-950">اسحب ملف الكتاب هنا أو اضغط للاختيار</div>
              <div className="mt-2 text-xs text-slate-400">PDF · الكتاب المدرسي هو المصدر المرجعي الأول للمنصة</div>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        {error && (
          <div className="mx-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </Card>

      {/* تقرير الاستخراج بعد الرفع */}
      {report && !busy && (
        <Card>
          <CardHead icon={<CheckCircle2 className="w-5 h-5" />} title="تقرير الاستخراج" sub="ما تم قراءته من الكتاب وما يستدعي الانتباه" />
          <div className="p-4 grid sm:grid-cols-3 gap-3 text-center">
            {[
              ['الصفحات', report.pagesTotal],
              ['دروس', report.lessonsFound],
              ['مباحث', report.sectionsFound],
              ['مفاهيم', report.conceptsFound],
              ['وثائق', report.docsFound],
              ['أسئلة', report.questionsFound],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-manar-50/50 border border-manar-100 py-3">
                <div className="text-xl font-extrabold text-manar-900 nums">{v}</div>
                <div className="text-xs font-bold text-slate-500">{l}</div>
              </div>
            ))}
          </div>
          {report.warnings.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              {report.warnings.map((w, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}
          <div className="px-4 pb-4 flex gap-2">
            <Btn onClick={() => nav('/book')}>عرض فهرس الكتاب ←</Btn>
          </div>
        </Card>
      )}

      {/* قواعد المنصة */}
      <Card>
        <CardHead icon={<ShieldCheck className="w-5 h-5" />} title="قواعد المعالجة" sub="كيف تعامل المنصة مع الكتاب كمصدر أول" />
        <ul className="p-4 pt-2 grid sm:grid-cols-2 gap-2 text-[13px] text-slate-600 leading-relaxed list-disc pr-5">
          <li>قراءة المحتوى صفحة بصفحة والحفاظ على الترتيب الأصلي للعناوين والدروس.</li>
          <li>الحفاظ على المصطلحات الأصلية دون تغيير المضمون.</li>
          <li>عدم اختراع عناوين أو دروس غير موجودة في الكتاب.</li>
          <li>عدم إضافة معلومات من الإنترنت أو مصادر خارجية تلقائياً.</li>
          <li>المعلومة غير الموصوفة تظهر مع: «هذه المعلومة غير واردة صراحة في الكتاب المدرسي.»</li>
          <li>الجزء غير القابل للقراءة يظهر مع: «تعذر استخراج هذا الجزء من النسخة المرفوعة» دون تخمين.</li>
        </ul>
      </Card>

      {/* بيانات تجريبية */}
      <Card>
        <CardHead icon={<FlaskConical className="w-5 h-5" />} title="لا يتوفر الكتاب الآن؟" sub="تصفّح المنصة ببيانات تجريبية توضيحية (موسومة بوضوح)" />
        <div className="px-5 pb-4">
          <Btn variant="secondary" onClick={() => void demo()} disabled={busy}>
            <FlaskConical className="w-4 h-4" />
            تحميل البيانات التجريبية
          </Btn>
        </div>
      </Card>
    </div>
  );
}
