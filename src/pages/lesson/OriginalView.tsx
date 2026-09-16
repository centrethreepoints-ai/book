// بنية الدرس الأصلية كما وردت في الكتاب (15 عنصراً)
import { Card, CardHead, ProvenanceBadge, SourceChip, Badge } from '../../components/ui';
import type { LessonContext } from '../../lib/generators/common';
import { NOT_IN_BOOK, UNREADABLE } from '../../lib/arabic';
import { DOC_KIND_META } from '../../types';

function Block({ title, icon, prov, page, bookTitle, children, empty }: {
  title: string;
  icon: string;
  prov?: 'book' | 'organized';
  page?: number;
  bookTitle: string;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHead
        icon={<span className="text-base">{icon}</span>}
        title={title}
        sub={prov ? undefined : '—'}
        action={
          <div className="flex items-center gap-2">
            {page && <SourceChip bookTitle={bookTitle} page={page} />}
            {prov && <ProvenanceBadge p={prov} />}
          </div>
        }
      />
      <div className="px-5 pb-4 text-sm leading-7 text-slate-700">{children || empty}</div>
    </Card>
  );
}

export function OriginalView({ ctx }: { ctx: LessonContext }) {
  const { lesson, bookTitle } = ctx;
  const subBySection = (sid?: string) => ctx.subsections.filter((s) => (sid ? s.sectionId === sid : true));

  return (
    <div className="space-y-4 fade-up">
      {/* 1-3: معلومات الدرس */}
      <Card>
        <CardHead icon={<span className="text-base">🗂️</span>} title="معلومات الدرس" />
        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <Info label="المستوى" v={lesson.level} />
          <Info label="المادة" v={lesson.subject} />
          <Info label="الوحدة" v={ctx.unit?.title || '—'} />
          <Info label="المحور" v={ctx.chapter?.title || '—'} />
          <Info label="عدد الصفحات" v={`${lesson.pageEnd - lesson.pageStart + 1} صفحة`} />
          <Info label="صفحات الدرس" v={`${lesson.pageStart} – ${lesson.pageEnd}`} />
        </div>
      </Card>

      {/* 4: المقدمة كما وردت */}
      <Block title="المقدمة (كما وردت في الكتاب)" icon="📜" prov={lesson.intro ? 'book' : undefined} page={lesson.intro ? lesson.pageStart : undefined} bookTitle={bookTitle}
        empty={<span className="text-slate-400 italic">{lesson.intro ? '' : 'تعذر استخراج مقدمة صريحة من بداية الدرس في النسخة المرفوعة. ' + UNREADABLE}</span>}>
        {lesson.intro && <p>{lesson.intro}</p>}
      </Block>

      {/* 5: الإشكالية */}
      <Card>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-[15px] text-manar-950">🎯 الإشكالية</h3>
            {lesson.problemExplicit && <ProvenanceBadge p="book" />}
            {!lesson.problemExplicit && <Badge cls="bg-amber-50 text-amber-700 border-amber-200">لم تعثر المنصة على نص صريح</Badge>}
            {lesson.problem && <SourceChip bookTitle={bookTitle} page={lesson.pageStart} />}
          </div>
          {lesson.problem ? (
            <p className="mt-3 rounded-xl bg-accent-50/60 border border-accent-400/30 px-4 py-3 text-[14px] leading-7 text-slate-800">{lesson.problem}</p>
          ) : (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              لم يتم العثور على إشكالية صريحة في النص المستخرج من الكتاب.
              <span className="block mt-1 text-[12px] text-slate-400">لا تخترع المنصة إشكالية — يمكن للأستاذ إضافتها يدوياً بعد مراجعة الدرس في الكتاب.</span>
            </p>
          )}
        </div>
      </Card>

      {/* 6: المفاهيم والمصطلحات */}
      <Card>
        <CardHead icon={<span className="text-base">📖</span>} title="المفاهيم والمصطلحات (كما وردت)" action={ctx.concepts.length ? <ProvenanceBadge p="book" /> : <Badge cls="bg-slate-100 text-slate-500">لم تُستخرج</Badge>} />
        <div className="px-5 pb-4">
          {ctx.concepts.length ? (
            <div className="space-y-2">
              {ctx.concepts.map((c) => (
                <div key={c.id} className="rounded-xl border border-manar-100 bg-manar-50/30 px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-manar-900 text-sm">{c.term}</span>
                    <SourceChip bookTitle={bookTitle} page={c.page} />
                    {c.kind !== 'explicit' && <Badge cls="bg-amber-50 text-amber-700 border-amber-200">تعريف مستنتج — يحتاج إلى مراجعة الأستاذ</Badge>}
                  </div>
                  <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{c.definition}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              لم يُستخرج قاموس مفاهيم تلقائياً لهذا الدرس. {NOT_IN_BOOK} يمكن للأستاذ إضافة المفاهيم من الكتاب عبر زر «إضافة مفهوم» في تبويب «المفاهيم» من القائمة الجانبية.
            </p>
          )}
        </div>
      </Card>

      {/* 7-8: العناوين الرئيسية والفرعية + المضامين */}
      <Card>
        <CardHead icon={<span className="text-base">🧩</span>} title="العناوين الرئيسية والفرعية والمضامين الأساسية" sub="المباحث والعناوين الصغيرة بالترتيب كما في الكتاب" action={<ProvenanceBadge p="book" />} />
        <div className="px-5 pb-4 space-y-4">
          {ctx.sections.length === 0 && <p className="text-sm text-slate-400 italic">تعذر استخراج العناوين الرئيسية لهذا الدرس من النسخة المرفوعة — يمكن تهيئتها يدوياً من «فهرس الكتاب».</p>}
          {ctx.sections.map((s, i) => (
            <div key={s.id} className="border-r-4 border-manar-400 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-[14.5px] text-manar-900">{i + 1}. {s.title}</span>
                {s.pageStart && <SourceChip bookTitle={bookTitle} page={s.pageStart} />}
              </div>
              {subBySection(s.id).length > 0 && (
                <ul className="mt-2 space-y-1 pr-4 list-disc text-[13px] text-slate-600">
                  {subBySection(s.id).map((sub) => (
                    <li key={sub.id} className="flex items-center gap-2 flex-wrap">
                      <span>{sub.title}</span>
                      {sub.pageStart && <SourceChip bookTitle={bookTitle} page={sub.pageStart} />}
                    </li>
                  ))}
                </ul>
              )}
              {subBySection(s.id).length === 0 && ctx.subsections.length > 0 && i === 0 && (
                <ul className="mt-2 space-y-1 pr-4 list-disc text-[13px] text-slate-600">
                  {ctx.subsections.map((sub) => (
                    <li key={sub.id}>{sub.title}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 9: الوثائق والخرائط والجداول والمبيانات */}
      <Card>
        <CardHead icon={<span className="text-base">🗺️</span>} title="الوثائق والخرائط والجداول والمبيانات" sub="كما وردت في الكتاب مع رقم الصفحة" />
        <div className="px-5 pb-4">
          {ctx.docs.length ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {ctx.docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                  <span className="text-xl">{DOC_KIND_META[d.kind].icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-700 truncate">{d.title}</div>
                    <div className="text-[11px] text-slate-400">{DOC_KIND_META[d.kind].label} · ص {d.page}</div>
                  </div>
                  <SourceChip bookTitle={bookTitle} page={d.page} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">تعذر استخراج وثائق لهذا الدرس من النسخة المرفوعة — أضفها يدوياً من تبويب «الوثائق».</p>
          )}
        </div>
      </Card>

      {/* 10: الأنشطة والأسئلة */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHead icon={<span className="text-base">✍️</span>} title="الأنشطة" action={<ProvenanceBadge p="book" />} />
          <div className="px-5 pb-4 space-y-2">
            {ctx.activities.length ? (
              ctx.activities.map((a) => (
                <div key={a.id} className="rounded-xl bg-sand-50 border border-sand-200 px-4 py-3 text-[13px] leading-relaxed text-slate-700">
                  {a.instruction}
                  <div className="mt-2"><SourceChip bookTitle={bookTitle} page={a.page} /></div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">لم تُستخرج أنشطة صريحة لهذا الدرس.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHead icon={<span className="text-base">❓</span>} title="الأسئلة (كما وردت في الكتاب)" action={<ProvenanceBadge p="book" />} />
          <div className="px-5 pb-4 space-y-2">
            {ctx.questions.length ? (
              ctx.questions.map((q) => (
                <div key={q.id} className="rounded-xl bg-white border border-slate-100 px-4 py-2.5 text-[13px] leading-relaxed text-slate-700">
                  • {q.text}
                  <div className="mt-1.5"><SourceChip bookTitle={bookTitle} page={q.page} /></div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">لم تُستخرج أسئلة صريحة لهذا الدرس من النص.</p>
            )}
          </div>
        </Card>
      </div>

      {/* 11: الخلاصة */}
      <Block title="الخلاصة / الاستنتاج (كما ورد في الكتاب)" icon="🧠" prov={lesson.summary ? 'book' : undefined} page={lesson.summary ? lesson.pageEnd : undefined} bookTitle={bookTitle}
        empty={<span className="text-slate-400 italic">تعذر استخراج خلاصة صريحة من نهاية الدرس. {NOT_IN_BOOK}</span>}>
        {lesson.summary && <p>{lesson.summary}</p>}
      </Block>

      {/* 12: الخاتمة إن وجدت */}
      {lesson.conclusion && (
        <Block title="الخاتمة" icon="🔚" prov="book" page={lesson.pageEnd} bookTitle={bookTitle}>
          <p>{lesson.conclusion}</p>
        </Block>
      )}
      {!lesson.conclusion && !lesson.summary && (
        <p className="text-[12px] text-slate-400 text-center">لم تُستخرج خاتمة — لا تنشئ المنصة خاتمة من عندها إذا لم تكن موجودة في الكتاب.</p>
      )}
    </div>
  );
}

function Info({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div className="font-bold text-slate-700 text-[13px] mt-0.5">{v}</div>
    </div>
  );
}
