// التقويم التشخيصي: إنشاء + إجراء + تحليل النتائج
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck2, CheckCircle2, XCircle, RotateCcw, BarChart3 } from 'lucide-react';
import { useApp } from '../lib/store';
import { generateDiagnostic, analyzeDiagnostic } from '../lib/generators/diagnostic';
import { Card, CardHead, Btn, EmptyState, Badge, ProvenanceBadge, useToast, Progress } from '../components/ui';
import type { DiagnosticQuiz } from '../types';

type Phase = 'build' | 'taking' | 'result';

export function Evaluation() {
  const { state, saveDiagnostic, dispatch } = useApp();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('build');
  const [quiz, setQuiz] = useState<DiagnosticQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<FileCheck2 className="w-7 h-7" />} title="لا يمكن إنشاء تقويم تشخيصي" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  function start() {
    const lessonTitles: Record<string, string> = {};
    state.lessons.forEach((l) => (lessonTitles[l.id] = l.title));
    const q = generateDiagnostic({ bookId: state.book!.id, bookTitle: state.book!.title, concepts: state.concepts, lessonTitles });
    if (!q.items.length) {
      toast('لا توجد مفاهيم كافية (5+) لإنشاء التقويم — أضف المفاهيم من الكتاب أولاً', 'warn');
      return;
    }
    void saveDiagnostic(q);
    setQuiz(q);
    setAnswers({});
    setDone(false);
    setPhase('taking');
  }

  if (phase === 'build') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950">🎯 التقويم التشخيصي — {state.settings.level}</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            يقيس التقويم المكتسبات الأساسية اللازمة لفهم دروس {state.settings.level}. يُبنى حصرياً من مفاهيم الكتاب المرفوع، ويرتبط كل سؤال بمفهوم ودرس محددين.
          </p>
        </div>
        <Card>
          <CardHead icon={<FileCheck2 className="w-5 h-5" />} title="إنشاء التقويم" sub={`${state.concepts.length} مفاهيم متاحة — سيُختار منها حتى 10 أسئلة`} />
          <div className="p-4 space-y-4">
            {state.concepts.length < 5 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-800 leading-relaxed">
                ⚠️ عدد المفاهيم المستخرجة ({state.concepts.length}) أقل من الحد الأدنى (5). أضف المفاهيم من الكتاب عبر «المفاهيم والمصطلحات» ثم أعد المحاولة.
              </div>
            ) : null}
            <div className="rounded-xl bg-sand-50 border border-sand-200 px-4 py-3 text-[12.5px] text-slate-600 leading-relaxed">
              في نهاية التقويم ستظهر: النقطة، نسبة النجاح، المفاهيم المتحكم فيها، المفاهيم التي تحتاج إلى دعم، المهارات التي تحتاج إلى معالجة، واقتراحات أنشطة للدعم.
            </div>
            <Btn onClick={start} disabled={state.concepts.length < 5}>
              <FileCheck2 className="w-4 h-4" /> إنشاء وإجراء التقويم
            </Btn>
          </div>
        </Card>
        {state.diagnostics.length > 0 && (
          <Card>
            <CardHead icon={<BarChart3 className="w-5 h-5" />} title="تقويمات سابقة" />
            <div className="px-4 pb-4 space-y-2">
              {state.diagnostics.slice(-5).reverse().map((d) => (
                <div key={d.id} className="flex items-center justify-between text-[13px] border-b border-slate-50 pb-2">
                  <span className="font-bold text-slate-700 truncate">{d.title}</span>
                  <span className="text-slate-400 nums shrink-0">{d.items.length} أسئلة · {new Date(d.createdAt).toLocaleDateString('ar')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (!quiz) return null;

  if (phase === 'taking') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-extrabold text-manar-950">{quiz.title}</h1>
          <Badge cls="bg-manar-50 text-manar-700 nums">{quiz.items.length} أسئلة · {quiz.totalPoints} ن</Badge>
        </div>
        <div className="no-print">
          <Progress value={Object.keys(answers).length} max={quiz.items.length} label="التقدم" />
        </div>
        {quiz.items.map((it, i) => (
          <Card key={it.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-manar-700 text-white font-extrabold grid place-items-center shrink-0 nums text-sm">{i + 1}</span>
              <div className="flex-1">
                <div className="font-bold text-[14px] text-manar-950 leading-relaxed">{it.text}</div>
                <div className="text-[11px] text-slate-400 mt-1">مرتبط بمفهوم «{it.concept}»{it.linkedLesson ? ` · الدرس: ${it.linkedLesson}` : ''}</div>
                <div className="mt-3 space-y-2">
                  {it.options.map((op, oi) => (
                    <label key={oi} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 cursor-pointer transition text-[13px] leading-relaxed ${answers[it.id] === oi ? 'border-manar-500 bg-manar-50 font-semibold' : 'border-slate-200 hover:border-manar-300'}`}>
                      <input
                        type="radio"
                        name={it.id}
                        checked={answers[it.id] === oi}
                        onChange={() => setAnswers((a) => ({ ...a, [it.id]: oi }))}
                        className="accent-[#2f7165] mt-0.5"
                      />
                      {op}
                    </label>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400 nums shrink-0">{it.points} ن</span>
            </div>
          </Card>
        ))}
        <div className="flex gap-2 no-print">
          <Btn
            disabled={Object.keys(answers).length < quiz.items.length}
            onClick={() => {
              void (async () => {
                const lessonTitles: Record<string, string> = {};
                state.lessons.forEach((l) => (lessonTitles[l.id] = l.title));
                const a = analyzeDiagnostic(quiz, answers, lessonTitles);
                const result = { id: `dr_${Date.now()}`, quizId: quiz.id, score: a.score, total: a.total, answers, doneAt: Date.now() };
                try {
                  const { idbPut } = await import('../lib/db');
                  await idbPut('demo', result as never);
                  dispatch({ type: 'SAVE_DIAG_RESULT', result });
                } catch {
                  dispatch({ type: 'SAVE_DIAG_RESULT', result });
                }
              })();
              setDone(true);
              setPhase('result');
            }}
          >
            <CheckCircle2 className="w-4 h-4" /> تسليم ومعالجة النتائج
          </Btn>
          <Btn variant="secondary" onClick={() => setPhase('build')}>إلغاء</Btn>
        </div>
        {Object.keys(answers).length < quiz.items.length && (
          <p className="text-[12px] text-slate-400">أجب عن جميع الأسئلة ({Object.keys(answers).length}/{quiz.items.length}) للتسليم.</p>
        )}
      </div>
    );
  }

  // النتائج
  const lessonTitles: Record<string, string> = {};
  state.lessons.forEach((l) => (lessonTitles[l.id] = l.title));
  const an = analyzeDiagnostic(quiz, answers, lessonTitles);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-center py-4">
        <div className="text-5xl mb-3">{an.pass ? '✅' : '📌'}</div>
        <h1 className="text-xl font-extrabold text-manar-950">نتائج التقويم التشخيصي</h1>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-manar-50 border border-manar-100 py-4">
            <div className="text-3xl font-extrabold text-manar-800 nums">{an.score}/{an.total}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">النقطة</div>
          </div>
          <div className={`rounded-xl border py-4 ${an.pass ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`text-3xl font-extrabold nums ${an.pass ? 'text-emerald-700' : 'text-amber-700'}`}>{an.percent}%</div>
            <div className="text-xs font-bold text-slate-500 mt-1">نسبة النجاح {an.pass ? '(ناجح ✓)' : '(يحتاج دعمًا)'}</div>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHead icon={<CheckCircle2 className="w-5 h-5" />} title="المفاهيم المتحكم فيها" />
          <div className="p-4 flex flex-wrap gap-1.5">
            {an.mastered.length ? an.mastered.map((m) => <Badge key={m} cls="bg-emerald-50 text-emerald-700 border-emerald-200">✓ {m}</Badge>) : <span className="text-sm text-slate-400">—</span>}
          </div>
        </Card>
        <Card>
          <CardHead icon={<XCircle className="w-5 h-5" />} title="المفاهيم التي تحتاج إلى دعم" />
          <div className="p-4 flex flex-wrap gap-1.5">
            {an.needsSupport.length ? an.needsSupport.map((m) => <Badge key={m} cls="bg-rose-50 text-rose-700 border-rose-200">{m}</Badge>) : <span className="text-sm text-slate-400">لا توجد — أحسنت ✓</span>}
          </div>
        </Card>
        <Card>
          <CardHead icon={<BarChart3 className="w-5 h-5" />} title="مهارات تحتاج إلى معالجة" />
          <ul className="px-5 pb-4 pr-8 list-disc text-[13px] text-slate-600 space-y-1">
            {an.skillsToWork.length ? an.skillsToWork.map((s, i) => <li key={i}>{s}</li>) : <li>لا توجد مهارات عاجلة للمعالجة.</li>}
          </ul>
        </Card>
        <Card>
          <CardHead icon={<RotateCcw className="w-5 h-5" />} title="اقتراحات أنشطة للدعم" sub="مقترحات تربوية — للمراجعة" />
          <ul className="px-5 pb-4 pr-8 list-disc text-[13px] text-slate-600 space-y-1.5">
            {an.suggestions.length ? an.suggestions.map((s, i) => <li key={i}>{s}</li>) : <li>يمكن تعزيز المكتسبات بأنشطة قراءة وثائق إضافية من الكتاب.</li>}
          </ul>
          <div className="px-5 pb-4"><ProvenanceBadge p="proposal" /></div>
        </Card>
      </div>

      <div className="flex gap-2 justify-center no-print">
        <Btn variant="secondary" onClick={start}>
          <RotateCcw className="w-4 h-4" /> إعادة التقويم
        </Btn>
        <Btn onClick={() => setPhase('build')}>العودة</Btn>
      </div>
      {done && <p className="text-center text-[11px] text-slate-400">حُفظت النتيجة في سجل التقويمات.</p>}
    </div>
  );
}
