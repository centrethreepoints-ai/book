// وحدة الخرائط والجداول والمبيانات
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Table, BarChart3 } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, EmptyState, Badge, Select, SourceChip } from '../components/ui';
import type { DocKind } from '../types';

const META: Record<string, { title: string; icon: React.ReactNode; desc: string; kinds: DocKind[] }> = {
  map: { title: '🗺️ الخرائط', icon: <Map className="w-6 h-6 text-manar-600" />, desc: 'الخرائط المستخرجة من الكتاب مع رقم الصفحة المرتبط بها.', kinds: ['map'] },
  'table+chart': { title: '📊 الجداول والمبيانات', icon: <Table className="w-6 h-6 text-manar-600" />, desc: 'الجداول الإحصائية والمبيانات المستخرجة من الكتاب.', kinds: ['table', 'chart'] },
};

export function Visuals({ kind }: { kind: 'map' | 'table+chart' }) {
  const { state } = useApp();
  const [lesson, setLesson] = useState('all');
  const m = META[kind];

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={m.icon} title="لا توجد بيانات" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  const book = state.book;
  const all = state.docs.filter((d) => m.kinds.includes(d.kind) && (lesson === 'all' || d.lessonId === lesson));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950 flex items-center gap-2">
            {kind === 'map' ? <Map className="w-6 h-6 text-manar-600" /> : <BarChart3 className="w-6 h-6 text-manar-600" />}
            {m.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{m.desc}</p>
        </div>
        <div className="w-56">
          <Select value={lesson} onChange={(e) => setLesson(e.target.value)}>
            <option value="all">كل الدروس</option>
            {state.lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHead icon={m.icon} title={`${all.length} عنصراً`} />
        <div className="divide-y divide-slate-50">
          {all.map((d) => {
            const les = state.lessons.find((l) => l.id === d.lessonId);
            return (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-manar-50/30 transition">
                <span className="text-2xl">{d.kind === 'map' ? '🗺️' : d.kind === 'table' ? '📊' : '📈'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-slate-800 truncate">{d.title}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {d.topic && <Badge cls="bg-sand-100 text-slate-500">{d.topic}</Badge>}
                    {les && (
                      <Link to={`/lessons/${les.id}`} className="text-[11.5px] font-bold text-manar-700 hover:underline truncate max-w-[240px]">
                        📖 {les.title}
                      </Link>
                    )}
                  </div>
                </div>
                <SourceChip bookTitle={book.title} page={d.page} />
              </div>
            );
          })}
          {all.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">
              تعذر استخراج خرائط/جداول/مبيانات من هذه النسخة (قد تكون صوراً مدمجة). أضفها يدوياً من صفحة الدرس (تبويب «الوثائق»).
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
