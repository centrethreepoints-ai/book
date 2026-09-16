// وحدة التمارين: لكل درس 7 تمارين مبنية على محتواه
import { Link } from 'react-router-dom';
import { NotebookPen } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, EmptyState, Badge } from '../components/ui';

const EX_TYPES = ['استيعاب المفاهيم', 'أسئلة قصيرة', 'تحليل وثيقة', 'تحليل جدول', 'تحليل مبيان', 'تحليل خريطة', 'تركيب واستنتاج'];

export function Exercises() {
  const { state } = useApp();

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<NotebookPen className="w-7 h-7" />} title="لا توجد تمارين" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">✏️ التمارين التطبيقية</h1>
        <p className="text-sm text-slate-500 mt-1">
          لكل درس مجموعة من سبعة تمارين مولدة من محتواه: مفاهيمه، وثائقه، جداوله وخرائطة. تولّد التمارين داخل صفحة كل درس (تبويب «التمارين»).
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {state.lessons.map((l) => {
          const concepts = state.concepts.filter((c) => c.lessonId === l.id).length;
          const docs = state.docs.filter((d) => d.lessonId === l.id);
          const usable = 1 + (concepts ? 1 : 0) + (docs.length ? 1 : 0);
          return (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-extrabold text-[14px] text-manar-950">{l.title}</div>
                <Badge cls="bg-sand-100 text-slate-500 nums">ص {l.pageStart}–{l.pageEnd}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {EX_TYPES.map((t, i) => {
                  const available = i === 0 ? concepts > 0 : i === 3 ? docs.some((d) => d.kind === 'table') : i === 4 ? docs.some((d) => d.kind === 'chart') : i === 5 ? docs.some((d) => d.kind === 'map') : true;
                  return <Badge key={t} cls={available ? 'bg-manar-50 text-manar-700' : 'bg-slate-50 text-slate-300 line-through'}>{i + 1}. {t}</Badge>;
                })}
              </div>
              <div className="mt-4">
                <Link to={`/lessons/${l.id}`} className="text-[13px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-xl px-4 py-2 inline-block hover:bg-manar-100 transition">
                  توليد التمارين السبعة ←
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
