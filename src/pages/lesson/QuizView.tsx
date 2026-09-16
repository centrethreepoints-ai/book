// تقويم فوري للدرس: اختبار تفاعلي ذاتي التصحيح من محتوى الدرس
import { useMemo, useState } from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowLeft, BookOpenCheck } from 'lucide-react';
import type { LessonContext } from '../../lib/generators/common';
import { generateLessonQuiz, type QuizItem } from '../../lib/generators/quiz';
import { Card, CardHead, Btn, Badge, ProvenanceBadge, Progress, EmptyState } from '../../components/ui';
import { useApp } from '../../lib/store';
import type { Concept } from '../../types';

type Phase = 'ready' | 'taking' | 'result';

export function QuizView({ ctx, allConcepts }: { ctx: LessonContext; allConcepts: Concept[] }) {
  const { state } = useApp();
  const items = useMemo(() => generateLessonQuiz(ctx, allConcepts), [ctx, allConcepts]);
  const [phase, setPhase] = useState<Phase>('ready');
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({}); // mcq/tf
  const [openDone, setOpenDone] = useState<Record<string, boolean>>({}); // أسئلة مفتوحة: أتممت المراجعة
  const [revealed, setRevealed] = useState(false);

  const total = items.reduce((s, i) => s + i.points, 0);

  function start() {
    setPhase('taking');
    setIdx(0);
    setPicked({});
    setOpenDone({});
    setRevealed(false);
  }

  function score() {
    let s = 0;
    for (const it of items) {
      if (it.type === 'mcq') {
        if (picked[it.id] === it.correct) s += it.points;
      } else if (it.type === 'tf') {
        const choice = picked[it.id]; // 0 = صواب، 1 = خطأ
        if (choice === (it.answer ? 0 : 1)) s += it.points;
      } else {
        if (openDone[it.id]) s += it.points; // ذاتي التقييم: تمت مراجعة الإجابة مقابل الكتاب
      }
    }
    return s;
  }

  if (!items.length) {
    return (
      <Card>
        <EmptyState
          icon={<BookOpenCheck className="w-7 h-7" />}
          title="لا يمكن بناء التقويم الفوري بعد"
          desc="يتطلب التقويم مفاهيم أو أسئلة مستخرجة من الدرس. غنيّ الدرس من تبويبي «الوثائق» و«المفاهيم» ثم أعد المحاولة."
        />
      </Card>
    );
  }

  const nMcq = items.filter((i) => i.type === 'mcq').length;
  const nTf = items.filter((i) => i.type === 'tf').length;
  const nOpen = items.filter((i) => i.type === 'open').length;

  if (phase === 'ready') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card lg>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-manar-700 text-white grid place-items-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-manar-950">التقويم الفوري للدرس</h2>
                <p className="text-[12.5px] text-slate-500 mt-0.5">اختبار تفاعلي ذاتي التصحيح، مبني من محتوى هذا الدرس فقط</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-sand-50 border border-sand-200 py-3">
                <div className="text-2xl font-extrabold text-manar-800 nums">{nMcq}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">اختيار من متعدد</div>
              </div>
              <div className="rounded-xl bg-sand-50 border border-sand-200 py-3">
                <div className="text-2xl font-extrabold text-manar-800 nums">{nTf}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">صواب / خطأ</div>
              </div>
              <div className="rounded-xl bg-sand-50 border border-sand-200 py-3">
                <div className="text-2xl font-extrabold text-manar-800 nums">{nOpen}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">من أسئلة الكتاب</div>
              </div>
            </div>
            <div className="rounded-xl bg-manar-50/60 border border-manar-100 px-4 py-3 text-[12.5px] leading-relaxed text-slate-600">
              الإجابات تظهر فور اختيارها مع الصفحة الأصلية في الكتاب. الأسئلة المفتوحة تُقيَّم ذاتياً بمقابلة إجابتك بالنص في الصفحة المذكورة. المجموع: <b className="nums">{total} نقطة</b>.
            </div>
            <Btn onClick={start} className="w-full justify-center">
              <Award className="w-4 h-4" /> بدء التقويم
            </Btn>
          </div>
        </Card>
        <p className="text-[11.5px] text-slate-400 text-center">
          المصادر: مفاهيم الدرس {ctx.concepts.length > 0 && `(${ctx.concepts.length})`} · أسئلة الكتاب {ctx.questions.length > 0 && `(${ctx.questions.length})`} — موسومة بشارات المصدر
        </p>
      </div>
    );
  }

  if (phase === 'taking') {
    const it = items[idx];
    const doneCount = items.filter((i) => (i.type === 'open' ? openDone[i.id] : picked[i.id] !== undefined)).length;
    const isLast = idx === items.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-extrabold text-[14px] text-manar-950 nums">السؤال {idx + 1} / {items.length}</div>
          <Badge cls="bg-manar-50 text-manar-700 nums">{it.points} نقاط</Badge>
        </div>
        <Progress value={doneCount} max={items.length} label="التقدم" />

        <Card className="p-5 space-y-4">
          {it.type === 'mcq' && (
            <>
              <div className="font-extrabold text-[16px] text-manar-950 leading-relaxed">{it.text}</div>
              <div className="space-y-2">
                {it.options.map((op, oi) => {
                  const chosen = picked[it.id] === oi;
                  const isCorrect = oi === it.correct;
                  const showState = picked[it.id] !== undefined;
                  return (
                    <button
                      key={oi}
                      disabled={showState}
                      onClick={() => setPicked((p) => ({ ...p, [it.id]: oi }))}
                      className={`w-full text-right flex items-start gap-2.5 rounded-xl border px-4 py-3 transition text-[13.5px] leading-relaxed ${
                        showState && isCorrect
                          ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900'
                          : showState && chosen
                            ? 'border-rose-400 bg-rose-50 text-rose-900'
                            : showState
                              ? 'border-slate-200 opacity-60'
                              : 'border-slate-200 hover:border-manar-400 hover:bg-manar-50/40 cursor-pointer'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-300 grid place-items-center text-[11px] font-extrabold shrink-0 nums text-slate-500">
                        {['أ', 'ب', 'ج', 'د'][oi]}
                      </span>
                      {op}
                      {showState && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mr-auto" />}
                      {showState && chosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0 mr-auto" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {it.type === 'tf' && (
            <>
              <div className="font-extrabold text-[15px] text-manar-950">{it.text}</div>
              <div className="rounded-xl bg-sand-50 border border-sand-200 px-4 py-3 text-[14px] leading-relaxed text-slate-700">
                {it.statement}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 0, label: 'صواب ✓', ok: it.answer },
                  { v: 1, label: 'خطأ ✗', ok: !it.answer },
                ].map((opt) => {
                  const chosen = picked[it.id] === opt.v;
                  const showState = picked[it.id] !== undefined;
                  return (
                    <button
                      key={opt.v}
                      disabled={showState}
                      onClick={() => setPicked((p) => ({ ...p, [it.id]: opt.v }))}
                      className={`rounded-xl border-2 px-4 py-3.5 font-extrabold text-[15px] transition ${
                        showState && opt.ok
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : showState && chosen
                            ? 'border-rose-400 bg-rose-50 text-rose-800'
                            : showState
                              ? 'border-slate-200 opacity-60'
                              : 'border-slate-200 hover:border-manar-400 hover:bg-manar-50/40 cursor-pointer'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {it.type === 'open' && (
            <>
              <div className="font-extrabold text-[15px] text-manar-950 leading-relaxed">{it.text}</div>
              <div className="rounded-xl border border-dashed border-manar-300 bg-manar-50/30 px-4 py-5 text-center text-[13px] text-slate-500">
                أجِب كتابياً أو شفهياً، ثم قارن إجابتك بالنص الأصلي في <b className="text-manar-800">صفحة {it.page}</b> من الكتاب.
              </div>
              <label className="flex items-center gap-2.5 text-[13px] font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(openDone[it.id])}
                  onChange={(e) => setOpenDone((o) => ({ ...o, [it.id]: e.target.checked }))}
                  className="accent-[#2f7165] w-4 h-4"
                />
                قمت بمراجعة إجابتي مقابل الكتاب (أنهي نقطة هذا السؤال)
              </label>
            </>
          )}

          {/* شريط المصدر + تنقّل */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11.5px] text-slate-400">المصدر: {ctx.bookTitle} — الصفحة {it.page}</span>
            <ProvenanceBadge p={it.prov} />
            <div className="mr-auto flex gap-2">
              {picked[it.id] !== undefined || openDone[it.id] ? (
                <Btn onClick={() => (isLast ? (setRevealed(true), setPhase('result')) : setIdx((i) => i + 1))}>
                  {isLast ? 'النتيجة النهائية' : 'السؤال التالي'}
                  <ArrowLeft className="w-4 h-4" />
                </Btn>
              ) : (
                <span className="text-[11.5px] text-slate-400 self-center">اختر إجابة للمتابعة</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // النتيجة
  const sc = score();
  const pct = Math.round((sc / total) * 100);
  const judged = items.filter((i) => i.type !== 'open');
  const missed = judged.filter((i) => {
    if (i.type === 'mcq') return picked[i.id] !== i.correct;
    return picked[i.id] !== ((i as { answer: boolean }).answer ? 0 : 1);
  });
  const missedTerms = [...new Set(missed.map((i) => 'term' in i && i.term ? i.term : ''))].filter(Boolean);
  const masteredTerms = [...new Set(judged.filter((i) => !missed.includes(i)).map((i) => ('term' in i && i.term ? i.term : '')).filter(Boolean))];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center py-3">
        <div className="text-5xl mb-2">{pct >= 50 ? '🏆' : '📚'}</div>
        <h2 className="text-lg font-extrabold text-manar-950">نتيجة التقويم الفوري</h2>
      </div>
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-manar-50 border border-manar-100 py-4">
            <div className="text-3xl font-extrabold text-manar-800 nums">{sc}/{total}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">النقطة</div>
          </div>
          <div className={`rounded-xl border py-4 ${pct >= 50 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`text-3xl font-extrabold nums ${pct >= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>{pct}%</div>
            <div className="text-xs font-bold text-slate-500 mt-1">{pct >= 50 ? 'محصول جيد ✓' : 'أعد مراجعة الدرس'}</div>
          </div>
        </div>
      </Card>
      {missedTerms.length > 0 && (
        <Card>
          <CardHead icon={<XCircle className="w-5 h-5" />} title="مفاهيم تحتاج إلى إعادة قراءة" />
          <div className="p-4 flex flex-wrap gap-1.5">
            {missedTerms.map((t) => (
              <Badge key={t} cls="bg-rose-50 text-rose-700 border-rose-200">{t}</Badge>
            ))}
          </div>
        </Card>
      )}
      {masteredTerms.length > 0 && (
        <Card>
          <CardHead icon={<CheckCircle2 className="w-5 h-5" />} title="مفاهيم متحكم فيها" />
          <div className="p-4 flex flex-wrap gap-1.5">
            {masteredTerms.map((t) => (
              <Badge key={t} cls="bg-emerald-50 text-emerald-700 border-emerald-200">✓ {t}</Badge>
            ))}
          </div>
        </Card>
      )}
      {revealed && <p className="text-center text-[11px] text-slate-400">تقويم ذاتي — للتمرين داخل الدرس (غير محفوظ في السجل).</p>}
      <div className="flex gap-2 justify-center">
        <Btn onClick={start}>
          <RotateCcw className="w-4 h-4" /> إعادة التقويم
        </Btn>
        <Btn variant="secondary" onClick={() => setPhase('ready')}>العودة</Btn>
      </div>
      <p className="text-center text-[11px] text-slate-400">
        الدرس: {ctx.lesson.title} · {state.book?.title || ctx.bookTitle}
      </p>
    </div>
  );
}
