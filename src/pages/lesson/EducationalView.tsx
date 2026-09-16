// الدرس التربوي المنظم — مبني على مادة الكتاب
import { Card, CardHead, ProvenanceBadge, SourceChip, Badge } from '../../components/ui';
import type { LessonContext } from '../../lib/generators/common';
import { suggestedObjectives } from '../../lib/generators/common';
import { NOT_IN_BOOK } from '../../lib/arabic';
import { DOC_KIND_META } from '../../types';

function EduSection({ n, title, icon, prov, children, page, bookTitle, sub }: {
  n: number;
  title: string;
  icon: string;
  prov?: 'book' | 'organized' | 'proposal';
  children: React.ReactNode;
  page?: number;
  bookTitle: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHead
        icon={<span className="text-base">{icon}</span>}
        title={`${n}. ${title}`}
        sub={sub}
        action={
          <div className="flex items-center gap-2">
            {page && <SourceChip bookTitle={bookTitle} page={page} />}
            {prov && <ProvenanceBadge p={prov} />}
          </div>
        }
      />
      <div className="px-5 pb-4 text-sm leading-7 text-slate-700">{children}</div>
    </Card>
  );
}

export function EducationalView({ ctx }: { ctx: LessonContext }) {
  const { lesson, bookTitle } = ctx;
  const objectives = suggestedObjectives(ctx);

  return (
    <div className="space-y-4 fade-up">
      <div className="rounded-xl bg-manar-50 border border-manar-100 px-4 py-3 text-[12.5px] text-manar-800 leading-relaxed flex gap-2">
        <span>ℹ️</span>
        <span>نسخة منظمة تربوياً للدرس، موجهة للأستاذ والمتعلم. كل عنصر موسوم بمصدره: 🟢 من الكتاب، 🟡 منظم اعتماداً على الكتاب، 🔵 مقترح يحتاج إلى مراجعة الأستاذ. لا يتضمن هذا الدرس أي معلومات خارج الكتاب.</span>
      </div>

      {/* التمهيد */}
      <EduSection n={1} title="التمهيد" icon="🚪" prov={lesson.intro ? 'book' : 'proposal'} page={lesson.intro ? lesson.pageStart : undefined} bookTitle={bookTitle}>
        {lesson.intro ? (
          <p>{lesson.intro}</p>
        ) : (
          <p className="text-slate-500">
            لم تُستخرج مقدمة صريحة من بداية الدرس، فيُقتراح تمهيد قصير يستحضر مكتسبات المتعلمين حول {lesson.title.toLowerCase()} ويربطها بالتساؤلات المركزية.
            <span className="block mt-1 text-[12px] text-slate-400">{NOT_IN_BOOK} — مقترح للمراجعة.</span>
          </p>
        )}
      </EduSection>

      {/* الإشكالية */}
      <EduSection n={2} title="الإشكالية" icon="🎯" prov={lesson.problemExplicit ? 'book' : 'proposal'} page={lesson.problemExplicit ? lesson.pageStart : undefined} bookTitle={bookTitle}>
        {lesson.problem ? (
          <p className="font-semibold text-manar-900">{lesson.problem}</p>
        ) : (
          <p className="text-slate-500">
            لم يتم العثور على إشكالية صريحة في النص المستخرج من الكتاب. يقترح النظام صياغة تساؤلات انطلاقاً من محاور الدرس (مقترح — للمراجعة):
            <ul className="mt-2 pr-5 list-disc space-y-1">
              {ctx.sections.slice(0, 2).map((s) => (
                <li key={s.id}>ما مظاهر: {s.title.replace(/^المبحث [^\d:]*:\s*/, '')}؟</li>
              ))}
              {ctx.sections.length > 2 && <li>ما العوامل والنتائج المرتبطة بهذه الظاهرة؟</li>}
            </ul>
          </p>
        )}
      </EduSection>

      {/* الأهداف */}
      <EduSection n={3} title="الأهداف التعليمية" icon="🎯" prov="proposal" bookTitle={bookTitle} sub="مقترحة بناءً على مفاهيم ومحاور الدرس — راجعها قبل الاستعمال">
        <ul className="pr-5 list-disc space-y-1.5">
          {objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </EduSection>

      {/* المفاهيم */}
      <EduSection n={4} title="المفاهيم والمصطلحات" icon="📖" prov={ctx.concepts.length ? (ctx.concepts.some((c) => c.kind !== 'explicit') ? 'organized' : 'book') : undefined} bookTitle={bookTitle}>
        {ctx.concepts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-manar-50/60 text-manar-900">
                  <th className="text-start font-extrabold px-3 py-2 border-b border-manar-100">المصطلح</th>
                  <th className="text-start font-extrabold px-3 py-2 border-b border-manar-100">التعريف الوارد في الكتاب</th>
                  <th className="text-center font-extrabold px-3 py-2 border-b border-manar-100 w-16">الصفحة</th>
                </tr>
              </thead>
              <tbody>
                {ctx.concepts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-3 py-2.5 font-bold text-manar-900 align-top">{c.term}</td>
                    <td className="px-3 py-2.5 text-slate-600 align-top">
                      {c.definition}
                      {c.kind !== 'explicit' && <Badge cls="bg-amber-50 text-amber-700 border-amber-200">مستنتج — مراجعة الأستاذ</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-center align-top"><SourceChip bookTitle={bookTitle} page={c.page} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 italic">لا توجد مفاهيم مستخرجة لهذا الدرس — أضفها من «المفاهيم والمصطلحات» في القائمة الجانبية.</p>
        )}
      </EduSection>

      {/* المحاور */}
      {ctx.sections.length === 0 && (
        <Card className="p-5 text-sm text-slate-500">تعذر استخراج المحاور/المباحث لهذا الدرس من النسخة المرفوعة — راجع «فهرس الكتاب» للتهيئة اليدوية.</Card>
      )}
      {ctx.sections.map((s, i) => (
        <EduSection key={s.id} n={5 + i} title={`المحور ${i + 1}: ${s.title.replace(/^المبحث [^\d:]*:\s*/, '')}`} icon="🧭" prov="organized" page={s.pageStart} bookTitle={bookTitle}>
          <div className="space-y-2">
            <p className="text-slate-600">
              العرض المنظم للمبحث كما ورد في الكتاب (ص {s.pageStart ?? '—'}): قراءة العناوين الفرعية والمضامين الأساسية مع التركيز على المفاهيم الواردة.
            </p>
            {ctx.subsections.filter((x) => x.sectionId === s.id).length > 0 && (
              <ul className="pr-5 list-disc space-y-1 text-[13.5px]">
                {ctx.subsections.filter((x) => x.sectionId === s.id).map((sub) => (
                  <li key={sub.id} className="font-semibold text-slate-700">{sub.title}</li>
                ))}
              </ul>
            )}
            {ctx.docs.filter((d) => d.page >= (s.pageStart || 0) && d.page <= (s.pageEnd || d.page)).slice(0, 2).map((d) => (
              <p key={d.id} className="text-[12.5px] text-slate-500">
                📎 الوثيقة المرتبطة: {DOC_KIND_META[d.kind].icon} {d.title} (ص {d.page})
              </p>
            ))}
          </div>
        </EduSection>
      ))}

      {/* تحليل الوثائق */}
      <EduSection n={5 + ctx.sections.length} title="تحليل الوثائق" icon="🔍" prov="organized" bookTitle={bookTitle} sub="أنشطة قراءة موجهة للوثائق الواردة في الدرس">
        {ctx.docs.length ? (
          <div className="space-y-3">
            {ctx.docs.slice(0, 3).map((d) => (
              <div key={d.id} className="rounded-xl border border-slate-100 bg-white p-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{DOC_KIND_META[d.kind].icon}</span>
                  <span className="font-bold text-[13.5px] text-manar-900 flex-1">{d.title}</span>
                  <SourceChip bookTitle={bookTitle} page={d.page} />
                </div>
                <ul className="mt-2 pr-4 text-[13px] text-slate-600 list-disc space-y-1">
                  <li>الملاحظة: ما الذي يظهر في الوثيقة؟ (طبيعتها: {DOC_KIND_META[d.kind].label})</li>
                  <li>الوصف: وصف العناصر الظاهرة وربطها بموضوع الدرس.</li>
                  <li>التفسير: تفسير العلاقة بين المعطيات الظاهرة.</li>
                  <li>الاستنتاج: استخلاص خلاصة تخدم الإجابة على الإشكالية.</li>
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">لا توجد وثائق مستخرجة لهذا الدرس.</p>
        )}
      </EduSection>

      {/* الاستنتاجات والخلاصة */}
      <EduSection n={6 + ctx.sections.length} title="الاستنتاجات والخلاصة" icon="🧠" prov={lesson.summary ? 'book' : 'proposal'} page={lesson.summary ? lesson.pageEnd : undefined} bookTitle={bookTitle}>
        {lesson.summary ? (
          <p>{lesson.summary}</p>
        ) : (
          <p className="text-slate-500">
            لم تُستخرج خلاصة صريحة — يقترح النظام صياغة استنتاج يجمع محاور الدرس: {ctx.sections.map((s) => s.title.replace(/^المبحث [^\d:]*:\s*/, '')).slice(0, 3).join('، ')}.
            <span className="block mt-1 text-[12px] text-slate-400">مقترح — للمراجعة.</span>
          </p>
        )}
      </EduSection>

      {/* التقويم */}
      <EduSection n={7 + ctx.sections.length} title="التقويم" icon="✅" prov={ctx.questions.length ? 'book' : 'proposal'} bookTitle={bookTitle}>
        {ctx.questions.length ? (
          <div className="space-y-2">
            {ctx.questions.slice(0, 4).map((q, i) => (
              <div key={q.id} className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-manar-100 text-manar-800 text-[11px] font-extrabold grid place-items-center shrink-0 nums">{i + 1}</span>
                <span className="flex-1">{q.text} <SourceChip bookTitle={bookTitle} page={q.page} /></span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">لا توجد أسئلة مستخرجة — أضف أسئلة تقويم من الكتاب ثم أعد فتح هذا التبويب.</p>
        )}
      </EduSection>
    </div>
  );
}
