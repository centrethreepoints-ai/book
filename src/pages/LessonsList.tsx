// قائمة الدروس
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, Badge, EmptyState, Select } from '../components/ui';
import { useState } from 'react';

export function LessonsList() {
  const { state } = useApp();
  const [filter, setFilter] = useState('all');

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<FileText className="w-7 h-7" />} title="لا توجد دروس" desc="ارفع الكتاب المدرسي أولاً ليتم استخراج الدروس." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  const units = state.units;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950">📖 الدروس</h1>
          <p className="text-sm text-slate-500 mt-1">{state.lessons.length} درساً مستخرجاً من الكتاب، مرتبة كما وردت.</p>
        </div>
        <div className="w-56">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">كل الوحدات</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </Select>
        </div>
      </div>

      {units.filter((u) => filter === 'all' || u.id === filter).map((u) => (
        <Card key={u.id}>
          <CardHead title={u.kind === 'domain' ? `المجال: ${u.title}` : `الوحدة: ${u.title}`} sub={u.pageStart ? `الصفحات ${u.pageStart} – ${u.pageEnd ?? '?'}` : undefined} icon={<FileText className="w-5 h-5" />} />
          <div className="p-4 space-y-3">
            {state.chapters.filter((c) => c.unitId === u.id).map((c) => {
              const cLessons = state.lessons.filter((l) => l.chapterId === c.id);
              const freeLessons = state.lessons.filter((l) => l.unitId === u.id && !l.chapterId);
              if (!cLessons.length && !freeLessons.length) return null;
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-extrabold text-manar-800">🧭 {c.title}</span>
                    {c.pageStart && <Badge cls="bg-sand-100 text-slate-500 nums">ص {c.pageStart}–{c.pageEnd ?? '؟'}</Badge>}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...cLessons, ...(!c.id || cLessons.length ? freeLessons : [])].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i).map((l) => (
                      <LessonCard key={l.id} id={l.id} title={l.title} pageStart={l.pageStart} pageEnd={l.pageEnd} hasProblem={Boolean(l.problem)} concepts={state.concepts.filter((x) => x.lessonId === l.id).length} docs={state.docs.filter((d) => d.lessonId === l.id).length} hasWs={state.worksheets.some((w) => w.lessonId === l.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
            {state.chapters.filter((c) => c.unitId === u.id).length === 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.lessons.filter((l) => l.unitId === u.id).map((l) => (
                  <LessonCard key={l.id} id={l.id} title={l.title} pageStart={l.pageStart} pageEnd={l.pageEnd} hasProblem={Boolean(l.problem)} concepts={state.concepts.filter((x) => x.lessonId === l.id).length} docs={state.docs.filter((d) => d.lessonId === l.id).length} hasWs={state.worksheets.some((w) => w.lessonId === l.id)} />
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function LessonCard({ id, title, pageStart, pageEnd, hasProblem, concepts, docs, hasWs }: { id: string; title: string; pageStart: number; pageEnd: number; hasProblem: boolean; concepts: number; docs: number; hasWs: boolean }) {
  return (
    <Link to={`/lessons/${id}`} className="group block rounded-xl border border-slate-100 bg-white p-4 hover:border-manar-300 hover:shadow-card transition">
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-[14px] text-manar-950 leading-snug group-hover:text-manar-800">{title}</div>
        <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-manar-600 shrink-0 mt-1" />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3 text-[11px] font-bold">
        <Badge cls="bg-sand-100 text-slate-500 nums">ص {pageStart} – {pageEnd}</Badge>
        <Badge cls="bg-manar-50 text-manar-700">{concepts} مفاهيم</Badge>
        <Badge cls="bg-manar-50 text-manar-700">{docs} وثائق</Badge>
        {hasProblem && <Badge cls="bg-accent-50 text-accent-600">🎯 إشكالية</Badge>}
        {hasWs && <Badge cls="bg-emerald-50 text-emerald-700">📋 جذاذة</Badge>}
      </div>
    </Link>
  );
}
