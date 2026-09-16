// عرض تفاعلي للوثائق: شاشة كاملة تدرّج التلاميذ في الاشتغال على وثائق الدرس
// (التعريف ← التحليل ← أسئلة تدريجية بإظهار إجابة عند الطلب) — للاستعمال على السبورة
import { useEffect, useMemo, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { LessonContext } from '../lib/generators/common';
import { buildDocQuestions, DOC_ANALYSIS_STEPS } from '../lib/generators/docActivity';
import { DOC_KIND_META } from '../types';
import type { DocRef } from '../types';
import { OpenPageModal } from './PdfPageView';
import { useApp } from '../lib/store';
import { ProvenanceBadge } from './ui';

type Slide =
  | { kind: 'intro' }
  | { kind: 'doc-def'; doc: DocRef }
  | { kind: 'doc-analysis'; doc: DocRef }
  | { kind: 'doc-question'; doc: DocRef; qi: number }
  | { kind: 'end' };

export function DocPresentation({ ctx, onClose }: { ctx: LessonContext; onClose: () => void }) {
  const { state, pdfBuffer } = useApp();
  const docs = ctx.docs;

  const slides: Slide[] = useMemo(() => {
    const out: Slide[] = [{ kind: 'intro' }];
    for (const d of docs) {
      out.push({ kind: 'doc-def', doc: d });
      out.push({ kind: 'doc-analysis', doc: d });
      buildDocQuestions(d, ctx).forEach((_, i) => out.push({ kind: 'doc-question', doc: d, qi: i }));
    }
    out.push({ kind: 'end' });
    return out;
  }, [docs, ctx]);

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [viewPage, setViewPage] = useState<number | null>(null);

  const next = useCallback(() => setIdx((i) => Math.min(slides.length - 1, i + 1)), [slides.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // في واجهة RTL: السهم الأيسر = التالي، الأيمن = السابق
      if (e.key === 'ArrowLeft') next();
      if (e.key === 'ArrowRight') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev, onClose]);

  const slide = slides[idx];
  const progress = ((idx + 1) / slides.length) * 100;

  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col fade-up">
      {/* شريط علوي */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-manar-600 grid place-items-center">
          <Play className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[14px] truncate">عرض تفاعلي: {ctx.lesson.title}</div>
          <div className="text-[11px] text-white/50 nums">
            {docs.length} وثائق · الشريحة {idx + 1} / {slides.length}
          </div>
        </div>
        <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
          <div className="h-full bg-manar-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg grid place-items-center text-white/60 hover:bg-white/10 hover:text-white" title="إغلاق (Esc)">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* جسم الشريحة */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {slide.kind === 'intro' && (
            <div className="text-center space-y-5 fade-up">
              <div className="text-6xl">🗂️</div>
              <h1 className="text-3xl font-extrabold leading-relaxed">{ctx.lesson.title}</h1>
              <div className="flex flex-wrap justify-center gap-2 text-[13px]">
                <span className="rounded-full bg-white/10 px-4 py-1.5">{ctx.unit?.title || ctx.lesson.subject}</span>
                <span className="rounded-full bg-white/10 px-4 py-1.5">{ctx.chapter?.title || ctx.lesson.level}</span>
                <span className="rounded-full bg-white/10 px-4 py-1.5 nums">الصفحات {ctx.lesson.pageStart}–{ctx.lesson.pageEnd} من الكتاب</span>
              </div>
              <p className="text-white/70 leading-relaxed max-w-2xl mx-auto">
                سنتدرّج في الاشتغال على {docs.length} وثيقة من هذا الدرس: التعريف بالوثيقة، ثم التحليل (ملاحظة، وصف، تفسير، استنتاج)، ثم أسئلة تدريجية — إظهار الإجابة عند الطلب.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto text-right">
                {docs.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[13px]">
                    <span>{DOC_KIND_META[d.kind].icon}</span>
                    <span className="font-bold truncate">{i + 1}. {d.title}</span>
                    <span className="text-white/40 text-[11px] nums mr-auto shrink-0">ص {d.page}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.kind === 'doc-def' && <DocDefSlide doc={slide.doc} ctx={ctx} onShowPage={() => setViewPage(slide.doc.page)} />}

          {slide.kind === 'doc-analysis' && <DocAnalysisSlide doc={slide.doc} ctx={ctx} />}

          {slide.kind === 'doc-question' && (
            <DocQuestionSlide
              doc={slide.doc}
              ctx={ctx}
              qi={slide.qi}
              revealed={revealed.has(slide.doc.id + ':' + slide.qi)}
              onReveal={() => setRevealed((s) => new Set(s).add(slide.doc.id + ':' + slide.qi))}
            />
          )}

          {slide.kind === 'end' && (
            <div className="text-center space-y-5 fade-up">
              <div className="text-6xl">🏁</div>
              <h2 className="text-2xl font-extrabold">انتهى العرض التفاعلي</h2>
              {ctx.lesson.problem && (
                <div className="text-right max-w-2xl mx-auto rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="font-extrabold text-manar-300 text-[13px] mb-2">إشكالية الدرس (من الكتاب)</div>
                  <p className="text-[14.5px] leading-relaxed text-white/90">{ctx.lesson.problem}</p>
                </div>
              )}
              {ctx.lesson.summary && (
                <div className="text-right max-w-2xl mx-auto rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="font-extrabold text-manar-300 text-[13px] mb-2">خلاصة الدرس (من الكتاب)</div>
                  <p className="text-[14.5px] leading-relaxed text-white/90">{ctx.lesson.summary}</p>
                </div>
              )}
              <p className="text-white/50 text-[13px] nums">
                الدرس كاملاً في الكتاب: {ctx.bookTitle} — الصفحات {ctx.lesson.pageStart}–{ctx.lesson.pageEnd}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* شريط تنقّل سفلي */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/10">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold px-5 py-3 transition"
        >
          <ChevronRight className="w-5 h-5" />
          السابق
        </button>
        <div className="text-[11px] text-white/40 hidden sm:block">التنقل: أسهم لوحة المفاتيح ← / → · Esc للإغلاق</div>
        <button
          onClick={next}
          disabled={idx === slides.length - 1}
          className="inline-flex items-center gap-2 rounded-xl bg-manar-600 hover:bg-manar-500 disabled:opacity-30 font-bold px-6 py-3 transition"
        >
          التالي
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {viewPage !== null && state.book && (
        <OpenPageModal
          bookId={state.book.id}
          page={viewPage}
          onClose={() => setViewPage(null)}
          loadBuffer={pdfBuffer}
          hasPdf={Boolean(state.book.fileName && !state.book.isDemo && !state.book.pdfMissing)}
        />
      )}
    </div>
  );
}

function DocDefSlide({ doc, ctx, onShowPage }: { doc: DocRef; ctx: LessonContext; onShowPage: () => void }) {
  const meta = DOC_KIND_META[doc.kind];
  return (
    <div className="space-y-5 fade-up">
      <SlideHeader step="1" title="التعريف بالوثيقة" doc={doc} />
      <div className="grid sm:grid-cols-2 gap-3">
        <InfoCell label="طبيعة الوثيقة" value={meta.label} />
        <InfoCell label="المصدر" value={doc.origin || 'لم يُستخرج (راجع ص ' + doc.page + ')'} />
        <InfoCell label="التاريخ" value={doc.date || 'لم يُستخرج'} />
        <InfoCell label="الموضوع" value={doc.topic || doc.title} />
      </div>
      <button
        onClick={onShowPage}
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold px-5 py-3 transition text-[14px]"
      >
        👁️ عرض الوثيقة في صفحتها الأصلية (ص {doc.page})
      </button>
      <p className="text-[12px] text-white/40">المصدر: {ctx.bookTitle} — الصفحة {doc.page}</p>
    </div>
  );
}

function DocAnalysisSlide({ doc, ctx }: { doc: DocRef; ctx: LessonContext }) {
  return (
    <div className="space-y-5 fade-up">
      <SlideHeader step="2" title="تحليل الوثيقة" doc={doc} />
      <div className="space-y-3">
        {DOC_ANALYSIS_STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
            <span className="w-9 h-9 rounded-xl bg-manar-600/80 grid place-items-center font-extrabold shrink-0 nums">{i + 1}</span>
            <div>
              <div className="font-extrabold text-[15px]">{s.t}</div>
              <div className="text-[13.5px] text-white/70 mt-1 leading-relaxed">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-white/40">الوثيقة: {doc.title} — {ctx.bookTitle} ص {doc.page}</p>
    </div>
  );
}

function DocQuestionSlide({
  doc,
  ctx,
  qi,
  revealed,
  onReveal,
}: {
  doc: DocRef;
  ctx: LessonContext;
  qi: number;
  revealed: boolean;
  onReveal: () => void;
}) {
  const questions = buildDocQuestions(doc, ctx);
  const q = questions[qi];
  if (!q) return null;
  return (
    <div className="space-y-5 fade-up">
      <SlideHeader step={`${3 + qi}`} title={`سؤال تدريجي — مستوى ${q.lv}`} doc={doc} />
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-manar-600 grid place-items-center font-extrabold shrink-0 nums">{q.n}</span>
          <p className="text-[17px] leading-relaxed font-bold">{q.q}</p>
        </div>
      </div>
      {revealed ? (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-5 fade-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-extrabold text-emerald-300 text-[13px]">عناصر الإجابة المنتظرة</span>
            <ProvenanceBadge p={q.prov} />
          </div>
          <p className="text-[14.5px] leading-relaxed text-white/90">{q.a}</p>
          <p className="text-[12px] text-white/40 mt-3">المصدر: {ctx.bookTitle} — الصفحة {doc.page}</p>
        </div>
      ) : (
        <button
          onClick={onReveal}
          className="inline-flex items-center gap-2 rounded-xl bg-manar-600 hover:bg-manar-500 font-bold px-6 py-3 transition text-[14px]"
        >
          💡 إظهار الإجابة
        </button>
      )}
    </div>
  );
}

function SlideHeader({ step, title, doc }: { step: string; title: string; doc: DocRef }) {
  const meta = DOC_KIND_META[doc.kind];
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
      <span className="text-2xl">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-manar-300 nums">{step} · {title}</div>
        <h2 className="font-extrabold text-[18px] truncate">{doc.title}</h2>
      </div>
      <span className="text-[11px] text-white/40 nums shrink-0">ص {doc.page}</span>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-[11px] font-bold text-white/40 mb-1">{label}</div>
      <div className="text-[14px] font-bold leading-relaxed">{value}</div>
    </div>
  );
}
