// محرك البحث الذكي في الكتاب والمنصة
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Map as MapIcon, Table2, TrendingUp, FileText, MessageCircleQuestion, Activity as ActivityIcon, Library } from 'lucide-react';
import { useApp } from '../lib/store';
import { searchAll, type SearchHit } from '../lib/search';
import { Card, CardHead, Badge, EmptyState, SourceChip } from '../components/ui';

const TYPE_ICON: Record<SearchHit['type'], React.ReactNode> = {
  concept: <BookOpen className="w-4 h-4" />,
  term: <BookOpen className="w-4 h-4" />,
  document: <Library className="w-4 h-4" />,
  map: <MapIcon className="w-4 h-4" />,
  table: <Table2 className="w-4 h-4" />,
  chart: <TrendingUp className="w-4 h-4" />,
  question: <MessageCircleQuestion className="w-4 h-4" />,
  page: <FileText className="w-4 h-4" />,
  lesson: <FileText className="w-4 h-4" />,
  activity: <ActivityIcon className="w-4 h-4" />,
};

const SUGGESTIONS = ['المفاهيم', 'الإشكالية', 'خريطة', 'جدول', 'مبيان', 'الهجرة', 'الزيادة الطبيعية', 'التمدين', 'الخلاصة'];

export function SearchPage() {
  const { state } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  function run(query: string) {
    if (!query.trim()) {
      setHits(null);
      return;
    }
    setHits(
      searchAll(
        { books: state.book ? [state.book] : [], lessons: state.lessons, concepts: state.concepts, docs: state.docs, questions: state.questions, pages: state.pages, activities: state.activities },
        query
      )
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">🔎 البحث الذكي</h1>
        <p className="text-sm text-slate-500 mt-1">
          ابحث في الكتاب والمنصة: عنوان درس، مفهوم، مصطلح، وثيقة، خريطة، مبيان، جدول، سؤال، أو رقم صفحة.
        </p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            run(e.target.value);
          }}
          placeholder='مثال: «أبحث عن مفهوم العولمة» أو «خريطة الهجرة» أو «الإشكالية»'
          className="w-full rounded-2xl border border-slate-200 bg-white pr-12 pl-4 py-4 text-[15px] shadow-card focus:outline-none focus:ring-2 focus:ring-manar-300"
        />
      </div>

      {!hits && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setQ(s); run(s); }} className="text-[12.5px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-manar-300 hover:text-manar-800 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {hits !== null && hits.length === 0 && (
        <Card>
          <EmptyState icon={<Search className="w-7 h-7" />} title="لا توجد نتائج" desc={`لم يُعثر على «${q}» في الكتاب المستخرج. هذه المعلومة غير واردة صراحة في المحتوى المستخرج من النسخة المرفوعة — جرب صياغة أخرى.`} />
        </Card>
      )}

      {hits && hits.length > 0 && (
        <Card>
          <CardHead icon={<Search className="w-5 h-5" />} title={`${hits.length} نتيجة`} sub="مرتبة حسب الأهمية: المفاهيم أولاً ثم الوثائق ثم الدروس ثم الصفحات" />
          <div className="divide-y divide-slate-50">
            {hits.slice(0, 30).map((h) => (
              <div key={h.id} className="px-4 py-3.5 hover:bg-manar-50/30 transition">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 rounded-lg bg-manar-50 text-manar-600 grid place-items-center">{TYPE_ICON[h.type]}</span>
                  <Badge cls="bg-sand-100 text-slate-500">{h.typeLabel}</Badge>
                  <span className="font-extrabold text-[13.5px] text-manar-950 flex-1 min-w-[180px]">{h.title}</span>
                  {h.page && state.book && <SourceChip bookTitle={state.book.title} page={h.page} />}
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mt-1.5 pr-9">{h.snippet}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 pr-9">
                  {h.lessonTitle && (
                    <Link to={`/lessons/${h.lessonId!}`} className="text-[11.5px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-full px-3 py-1 hover:bg-manar-100 transition">
                      📖 {h.lessonTitle}
                    </Link>
                  )}
                  {!h.lessonTitle && h.conceptId && <span className="text-[11px] text-slate-400">مفهوم عام في الكتاب</span>}
                  {!h.lessonTitle && !h.conceptId && !h.page && <span className="text-[11px] text-slate-400">—</span>}
                  {h.related && h.related.length > 0 && (
                    <span className="text-[11px] text-slate-400">أنشطة مرتبطة: {h.related.join('، ')}</span>
                  )}
                  {h.type === 'concept' && h.lessonId && (
                    <button onClick={() => nav('/lessons/' + h.lessonId! + '?tab=edu')} className="text-[11.5px] font-bold text-accent-600 hover:underline">عرض في الدرس التربوي ←</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
