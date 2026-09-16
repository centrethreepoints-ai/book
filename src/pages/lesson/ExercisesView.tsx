// تبويب التمارين التطبيقية السبعة
import { useState } from 'react';
import { NotebookPen, Printer, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../../lib/store';
import { generateExercises, type Exercise } from '../../lib/generators/exercises';
import { Card, CardHead, Btn, ProvenanceBadge, Accordion, EmptyState } from '../../components/ui';
import type { LessonContext } from '../../lib/generators/common';
import { printArea } from '../../lib/print';
import { useToast } from '../../components/ui';

export function ExercisesView({ ctx }: { ctx: LessonContext }) {
  const { toast } = useToast();
  const [exs, setExs] = useState<Exercise[] | null>(null);
  const [showCorr, setShowCorr] = useState(false);

  if (!exs) {
    return (
      <Card>
        <EmptyState
          icon={<NotebookPen className="w-7 h-7" />}
          title="✏️ التمارين التطبيقية"
          desc="سبعة تمارين مبنية على محتوى الدرس المستخرج: استيعاب المفاهيم، أسئلة قصيرة، تحليل وثيقة، تحليل جدول، تحليل مبيان، تحليل خريطة، وتركيب واستنتاج — مع النقاط وعناصر التصحيح."
          action={<Btn onClick={() => { setExs(generateExercises(ctx)); toast('تم توليد التمارين من محتوى الدرس'); }}><NotebookPen className="w-4 h-4" /> توليد التمارين</Btn>}
        />
      </Card>
    );
  }

  const total = exs.reduce((s, e) => s + e.totalPoints, 0);

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <div className="flex items-center gap-2">
          <ProvenanceBadge p="organized" full />
          <span className="text-[12px] text-slate-500">المجموع: {total} نقطة</span>
        </div>
        <div className="mr-auto flex flex-wrap gap-2">
          <Btn variant="secondary" onClick={() => setShowCorr((v) => !v)}>
            {showCorr ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {showCorr ? 'إخفاء التصحيح' : 'إظهار التصحيح'}
          </Btn>
          <Btn variant="secondary" onClick={printArea}><Printer className="w-4 h-4" /> طباعة / تصدير PDF</Btn>
          <Btn variant="secondary" onClick={() => setExs(generateExercises(ctx))}>إعادة التوليد</Btn>
        </div>
      </div>

      <div data-printable="true" data-print-title={`تمارين - ${ctx.lesson.title}`}>
        <div className="space-y-4 print-area">
          <Card className="p-4 bg-manar-50/40">
            <div className="font-extrabold text-manar-900">✏️ تمارين تطبيقية — {ctx.lesson.title}</div>
            <div className="text-[12px] text-slate-500 mt-1">المستوى: {ctx.lesson.level} · المادة: {ctx.lesson.subject} · المصدر: {ctx.bookTitle}</div>
          </Card>
          {exs.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} showCorr={showCorr} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, showCorr }: { ex: Exercise; showCorr: boolean }) {
  return (
    <Card>
      <CardHead
        icon={<span className="text-base">✏️</span>}
        title={`تمرين ${ex.type}: ${ex.title}`}
        sub={ex.docTitle ? `الوثيقة: ${ex.docTitle} (ص ${ex.docPage})` : ex.note || undefined}
        action={<span className="text-[12px] font-extrabold text-manar-800 bg-manar-50 border border-manar-200 rounded-full px-3 py-1 nums">{ex.totalPoints} نقطة</span>}
      />
      <div className="p-4 space-y-3">
        <div className="rounded-xl bg-sand-50 border border-sand-200 px-4 py-2.5 text-[13px] font-bold text-slate-700">
          {ex.instructions}
        </div>
        <div className="space-y-2">
          {ex.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-manar-100 text-manar-800 text-[11px] font-extrabold grid place-items-center shrink-0 nums">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-[13.5px] leading-relaxed text-slate-800">{q.text}</div>
                  <div className="text-[11px] font-bold text-slate-400 mt-1 nums">{q.points} نقطة</div>
                </div>
              </div>
              {showCorr && (
                <div className="mt-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700 fade-up">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-emerald-800 text-[11.5px]">عناصر التصحيح</span>
                    <ProvenanceBadge p={q.provenance} />
                  </div>
                  {q.correction}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
