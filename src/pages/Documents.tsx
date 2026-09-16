// وحدة الوثائق: مكتبة كل الوثائق (نصوص، صور، أخرى)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, EmptyState, Badge, Select, SourceChip } from '../components/ui';
import { DOC_KIND_META, type DocKind } from '../types';

export function Documents() {
  const { state } = useApp();
  const [kind, setKind] = useState<'all' | DocKind>('all');
  const [lesson, setLesson] = useState('all');

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<Library className="w-7 h-7" />} title="لا توجد وثائق" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  const book = state.book;
  const all = state.docs.filter((d) => (kind === 'all' || d.kind === kind) && (lesson === 'all' || d.lessonId === lesson));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950">📄 الوثائق</h1>
          <p className="text-sm text-slate-500 mt-1">جميع الوثائق المستخرجة من الكتاب: نصوص، صور، ومواد أخرى — المرتبطة بدرورها.</p>
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Select value={kind} onChange={(e) => setKind(e.target.value as 'all' | DocKind)}>
              <option value="all">كل الأنواع</option>
              {(Object.keys(DOC_KIND_META) as DocKind[]).map((k) => (
                <option key={k} value={k}>{DOC_KIND_META[k].label}</option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Select value={lesson} onChange={(e) => setLesson(e.target.value)}>
              <option value="all">كل الدروس</option>
              {state.lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHead icon={<Library className="w-5 h-5" />} title={`${all.length} وثيقة`} />
        <div className="divide-y divide-slate-50">
          {all.map((d) => {
            const les = state.lessons.find((l) => l.id === d.lessonId);
            return (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-manar-50/30 transition">
                <span className="text-2xl">{DOC_KIND_META[d.kind].icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-slate-800 truncate">{d.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge cls="bg-sand-100 text-slate-500">{DOC_KIND_META[d.kind].label}</Badge>
                    {les && (
                      <Link to={`/lessons/${les.id}`} className="text-[11.5px] font-bold text-manar-700 hover:underline truncate max-w-[220px]">
                        📖 {les.title}
                      </Link>
                    )}
                  </div>
                </div>
                <SourceChip bookTitle={book.title} page={d.page} />
              </div>
            );
          })}
          {all.length === 0 && <p className="text-sm text-slate-400 text-center py-8">لا توجد وثائق مطابقة للفلاتر.</p>}
        </div>
      </Card>
    </div>
  );
}
