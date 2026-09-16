// الصفحة التعليمية الخاصة بكل درس
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookText, ClipboardList, Library, NotebookPen, FileText, ArrowRight, Printer, Award } from 'lucide-react';
import { useApp } from '../lib/store';
import { Tabs, Card, EmptyState, ProvenanceBadge, Badge } from '../components/ui';
import { buildLessonContext } from '../lib/generators/common';
import { printArea } from '../lib/print';
import { OriginalView } from './lesson/OriginalView';
import { EducationalView } from './lesson/EducationalView';
import { WorksheetView } from './lesson/WorksheetView';
import { DocumentsView } from './lesson/DocumentsView';
import { ExercisesView } from './lesson/ExercisesView';
import { QuizView } from './lesson/QuizView';

const TABS = [
  { id: 'original', label: 'البنية الأصلية', icon: <BookText className="w-4 h-4" /> },
  { id: 'edu', label: 'الدرس التربوي', icon: <FileText className="w-4 h-4" /> },
  { id: 'quiz', label: 'التقويم الفوري', icon: <Award className="w-4 h-4" /> },
  { id: 'docs', label: 'الوثائق', icon: <Library className="w-4 h-4" /> },
  { id: 'ex', label: 'التمارين', icon: <NotebookPen className="w-4 h-4" /> },
  { id: 'ws', label: 'الجذاذة', icon: <ClipboardList className="w-4 h-4" /> },
];

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const [tab, setTab] = useState('original');

  const lesson = state.lessons.find((l) => l.id === id);

  if (!lesson) {
    return (
      <Card>
        <EmptyState
          icon={<FileText className="w-7 h-7" />}
          title="الدرس غير موجود"
          desc="ربما حُذفت البيانات أو أن الرابط غير صحيح."
          action={<Link to="/lessons" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">عودة إلى الدروس</Link>}
        />
      </Card>
    );
  }

  const ctx = buildLessonContext(lesson, state.units, state.chapters, state.sections, state.subsections, state.concepts, state.docs, state.activities, state.questions, state.book?.title || '');

  return (
    <div className="space-y-4">
      {/* رأس الدرس */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/lessons" className="w-9 h-9 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500 hover:text-manar-700 hover:border-manar-300 transition">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-lg sm:text-xl font-extrabold text-manar-950 leading-snug">{lesson.title}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11.5px] font-bold text-slate-500">
            <Badge cls="bg-manar-50 text-manar-700">{lesson.subject}</Badge>
            <Badge cls="bg-manar-50 text-manar-700">{lesson.level}</Badge>
            {ctx.unit && <Badge cls="bg-sand-100 text-slate-600">📚 {ctx.unit.title}</Badge>}
            {ctx.chapter && <Badge cls="bg-sand-100 text-slate-600">🧭 {ctx.chapter.title}</Badge>}
            <Badge cls="bg-sand-100 text-slate-600 nums">الصفحات {lesson.pageStart} – {lesson.pageEnd} ({lesson.pageEnd - lesson.pageStart + 1} صفحة)</Badge>
          </div>
        </div>
        <button onClick={printArea} className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-manar-300 hover:text-manar-800 transition no-print" title="طباعة / تصدير PDF">
          <Printer className="w-4 h-4" />
          طباعة / PDF
        </button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div data-printable="true" data-print-title={`درس - ${lesson.title}`}>
        {tab === 'original' && <OriginalView ctx={ctx} />}
        {tab === 'edu' && <EducationalView ctx={ctx} />}
        {tab === 'quiz' && <QuizView ctx={ctx} allConcepts={state.concepts} />}
        {tab === 'ws' && <WorksheetView ctx={ctx} />}
        {tab === 'docs' && <DocumentsView ctx={ctx} />}
        {tab === 'ex' && <ExercisesView ctx={ctx} />}
      </div>
    </div>
  );
}

export { ProvenanceBadge };
