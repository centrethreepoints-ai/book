// وحدة الجذاذات: قائمة + إنشاء من اختيار الدرس
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Trash2, Plus, Printer } from 'lucide-react';
import { useApp } from '../lib/store';
import { generateWorksheet } from '../lib/generators/worksheet';
import { buildLessonContext } from '../lib/generators/common';
import { Card, CardHead, Btn, EmptyState, Field, Select, useToast, ProvenanceBadge } from '../components/ui';

export function Worksheets() {
  const { state, saveWorksheet, deleteWorksheet } = useApp();
  const { toast } = useToast();
  const nav = useNavigate();
  const [lessonId, setLessonId] = useState(state.lessons[0]?.id || '');
  const [duration, setDuration] = useState(state.settings.durationDefault);
  const [busy, setBusy] = useState(false);

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<ClipboardList className="w-7 h-7" />} title="لا توجد جذاذات" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  function create() {
    const lesson = state.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setBusy(true);
    const ctx = buildLessonContext(lesson, state.units, state.chapters, state.sections, state.subsections, state.concepts, state.docs, state.activities, state.questions, state.book!.title);
    const ws = generateWorksheet(ctx, { bookId: lesson.bookId, institution: state.settings.institution, teacherName: state.settings.teacherName, duration });
    void saveWorksheet(ws).then(() => {
      setBusy(false);
      toast('تم إنشاء الجذاذة وحفظها');
      nav(`/lessons/${lesson.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">📋 الجذاذات التربوية</h1>
        <p className="text-sm text-slate-500 mt-1">جذاذات جاهزة للطباعة، مبنية على محتوى الدروس المستخرجة من الكتاب.</p>
      </div>

      <Card>
        <CardHead icon={<Plus className="w-5 h-5" />} title="إنشاء جذاذة جديدة" sub="اختر الدرس والمدة ثم أنشئ" />
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          <Field label="الدرس">
            <Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              {state.lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title} (ص {l.pageStart})</option>
              ))}
            </Select>
          </Field>
          <Field label="المدة الزمنية">
            <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-manar-300" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Btn onClick={create} disabled={!lessonId || busy}>
              <ClipboardList className="w-4 h-4" /> إنشاء الجذاذة
            </Btn>
          </div>
        </div>
      </Card>

      {state.worksheets.length === 0 ? (
        <Card>
          <EmptyState icon={<ClipboardList className="w-7 h-7" />} title="لا توجد جذاذات محفوظة بعد" desc="أنشئ جذاذة من الأعلى، أو من داخل صفحة أي درس (تبويب «الجذاذة»)." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {state.worksheets.map((w) => {
            const lesson = state.lessons.find((l) => l.id === w.lessonId);
            return (
              <Card key={w.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold text-[14px] text-manar-950 truncate">📋 {w.lessonTitle}</div>
                    <div className="text-[12px] text-slate-500 mt-1">{w.unitTitle} · {w.duration}</div>
                  </div>
                  <ProvenanceBadge p="proposal" />
                </div>
                <div className="flex gap-2 mt-4">
                  {lesson && (
                    <Link to={`/lessons/${lesson.id}`} className="text-[12.5px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-xl px-3.5 py-2 hover:bg-manar-100 transition">
                      فتح / طباعة
                    </Link>
                  )}
                  <button onClick={() => window.print()} className="no-print text-[12.5px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2 hover:border-manar-300 transition inline-flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={() => {
                      void deleteWorksheet(w.id);
                      toast('حذفت الجذاذة', 'warn');
                    }}
                    className="no-print mr-auto text-[12.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 hover:bg-rose-100 transition inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
