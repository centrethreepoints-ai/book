// وحدة الفروض: إنشاء + عرض + تصحيح
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PenSquare, Trash2, Printer, FileCheck2, Scale } from 'lucide-react';
import { useApp } from '../lib/store';
import { generateTest } from '../lib/generators/tests';
import { buildLessonContext } from '../lib/generators/common';
import { Card, CardHead, Btn, EmptyState, Field, Select, TextInput, Badge, ProvenanceBadge, useToast } from '../components/ui';
import { DIFF_META } from '../types';
import type { Difficulty, TestScope, Test } from '../types';
import { printArea } from '../lib/print';

export function Tests() {
  const { id } = useParams<{ id: string }>();
  const { state, saveTest, deleteTest } = useApp();
  const { toast } = useToast();

  const [scopeType, setScopeType] = useState<TestScope>('lesson');
  const [scopeId, setScopeId] = useState(state.lessons[0]?.id || '');
  const [multi, setMulti] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [points, setPoints] = useState(state.settings.pointsDefault);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const test = id ? state.tests.find((t) => t.id === id) : undefined;

  const scopeLabel = useMemo(() => {
    if (scopeType === 'lesson') return state.lessons.find((l) => l.id === scopeId)?.title || '—';
    if (scopeType === 'chapter') return state.chapters.find((c) => c.id === scopeId)?.title || '—';
    if (scopeType === 'unit') return state.units.find((u) => u.id === scopeId)?.title || '—';
    return `${multi.length} دروس`;
  }, [scopeType, scopeId, multi, state]);

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<PenSquare className="w-7 h-7" />} title="لا توجد فروض" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  function create() {
    let lessonIds: string[] = [];
    if (scopeType === 'lesson') lessonIds = [scopeId];
    else if (scopeType === 'chapter') lessonIds = state.lessons.filter((l) => l.chapterId === scopeId).map((l) => l.id);
    else if (scopeType === 'unit') lessonIds = state.lessons.filter((l) => l.unitId === scopeId).map((l) => l.id);
    else lessonIds = multi;
    if (!lessonIds.length) {
      toast('اختر دروساً ضمن النطاق أولاً', 'warn');
      return;
    }
    const contexts = lessonIds
      .map((lid) => state.lessons.find((l) => l.id === lid))
      .filter(Boolean)
      .map((l) => buildLessonContext(l!, state.units, state.chapters, state.sections, state.subsections, state.concepts, state.docs, state.activities, state.questions, state.book!.title));
    const t = generateTest({ bookId: state.book!.id, bookTitle: state.book!.title, scopeType, scopeLabel, contexts, difficulty, totalPoints: points });
    void saveTest(t).then(() => {
      toast('تم إنشاء الفرض وحفظه');
      setCreatedId(t.id);
    });
  }

  if (test) {
    return <TestDetail test={test} onDelete={() => void deleteTest(test.id).then(() => toast('حُذف الفرض', 'warn'))} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">📝 إنشاء فرض</h1>
        <p className="text-sm text-slate-500 mt-1">اختر النطاق (درس، محور، وحدة، عدة دروس) ومستوى الصعوبة — فيُبنى الفرض من محتوى الكتاب: استثمار وثائق، أسئلة معرفية، وتركيب، مع سلم التنقيط والتصحيح.</p>
      </div>

      <Card>
        <CardHead icon={<PenSquare className="w-5 h-5" />} title="مواصفات الفرض" />
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          <Field label="نطاق الفرض">
            <Select value={scopeType} onChange={(e) => { setScopeType(e.target.value as TestScope); setScopeId(''); setMulti([]); }}>
              <option value="lesson">درس واحد</option>
              <option value="chapter">محور</option>
              <option value="unit">وحدة</option>
              <option value="multi">عدة دروس</option>
            </Select>
          </Field>
          {scopeType === 'lesson' && (
            <Field label="الدرس">
              <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                {state.lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </Select>
            </Field>
          )}
          {scopeType === 'chapter' && (
            <Field label="المحور">
              <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                {state.chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </Field>
          )}
          {scopeType === 'unit' && (
            <Field label="الوحدة">
              <Select value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                {state.units.map((u) => (
                  <option key={u.id} value={u.id}>{u.title}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="مستوى الصعوبة">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">متقدم</option>
            </Select>
          </Field>
          <Field label="مجموع النقاط">
            <TextInput type="number" min={10} max={40} value={String(points)} onChange={(e) => setPoints(+e.target.value || 20)} />
          </Field>
          {scopeType === 'multi' && (
            <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3 max-h-44 overflow-y-auto">
              {state.lessons.map((l) => (
                <label key={l.id} className="flex items-center gap-2 py-1 text-[13px] font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={multi.includes(l.id)} onChange={(e) => setMulti(e.target.checked ? [...multi, l.id] : multi.filter((x) => x !== l.id))} className="accent-[#2f7165] w-4 h-4" />
                  {l.title}
                </label>
              ))}
            </div>
          )}
          <div className="sm:col-span-2 flex items-center gap-3">
            <Btn onClick={create}>
              <PenSquare className="w-4 h-4" /> إنشاء الفرض ({scopeLabel})
            </Btn>
            <Badge cls={DIFF_META[difficulty].cls}>{DIFF_META[difficulty].label}</Badge>
            <span className="text-[12px] text-slate-400 nums">{points} نقطة</span>
          </div>
        </div>
      </Card>

      {/* الفروض المحفوظة */}
      {state.tests.length === 0 ? (
        <Card>
          <EmptyState icon={<FileCheck2 className="w-7 h-7" />} title="لا توجد فروض محفوظة بعد" desc="أنشئ أول فرض من النموذج بالأعلى." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {state.tests.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/tests/${t.id}`} className="font-extrabold text-[14px] text-manar-950 hover:text-manar-700 block truncate">📝 {t.title}</Link>
                  <div className="text-[12px] text-slate-500 mt-1">{t.scopeLabel} · <Badge cls={DIFF_META[t.difficulty].cls}>{DIFF_META[t.difficulty].label}</Badge></div>
                </div>
                <Badge cls="bg-manar-50 text-manar-700 nums">{t.totalPoints} ن</Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to={`/tests/${t.id}`} className="text-[12.5px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-xl px-3.5 py-2 hover:bg-manar-100 transition">فتح</Link>
                <button onClick={() => void deleteTest(t.id)} className="text-[12.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 hover:bg-rose-100 transition inline-flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {createdId && !test && (
        <div className="fixed bottom-6 left-6 z-40 fade-up">
          <Link to={`/tests/${createdId}`} className="bg-manar-800 text-white rounded-xl px-5 py-3 text-sm font-bold shadow-card-lg hover:bg-manar-900 transition">عرض الفرض الجديد ←</Link>
        </div>
      )}
    </div>
  );
}

/* ---------- عرض فرض مفصل ---------- */
function TestDetail({ test, onDelete }: { test: Test; onDelete: () => void }) {
  const { state } = useApp();
  const [showCorr, setShowCorr] = useState(false);
  const partsPoints = test.parts.map((p) => p.items.reduce((s, i) => s + i.points, 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <Link to="/tests" className="w-9 h-9 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500 hover:text-manar-700">→</Link>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-lg font-extrabold text-manar-950">{test.title}</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge cls="bg-sand-100 text-slate-600">{test.scopeLabel}</Badge>
            <Badge cls={DIFF_META[test.difficulty].cls}>{DIFF_META[test.difficulty].label}</Badge>
            <Badge cls="bg-manar-50 text-manar-700 nums">{test.totalPoints} نقطة</Badge>
            <Badge cls="bg-slate-100 text-slate-500">{new Date(test.createdAt).toLocaleDateString('ar')}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setShowCorr((v) => !v)}>
            <Scale className="w-4 h-4" /> {showCorr ? 'إخفاء التصحيح' : 'التصحيح النموذجي'}
          </Btn>
          <Btn variant="secondary" onClick={printArea}><Printer className="w-4 h-4" /> طباعة / PDF</Btn>
          <Btn variant="danger" onClick={onDelete}><Trash2 className="w-4 h-4" /></Btn>
        </div>
      </div>

      <div data-printable="true" data-print-title={test.title} className="print-area space-y-4">
        <Card className="p-5">
          <div className="text-center space-y-1">
            <div className="font-extrabold text-manar-950">{state.settings.subject} — {state.settings.level}</div>
            <div className="text-[13px] text-slate-500">المؤسسة: {state.settings.institution || '…………'} · الأستاذ: {state.settings.teacherName || '…………'}</div>
            <div className="font-bold text-[14px] text-manar-800 mt-2">{test.title} — مجموع النقاط: {test.totalPoints}</div>
          </div>
        </Card>

        {test.parts.map((p, pi) => (
          <Card key={p.id}>
            <CardHead
              icon={<span className="text-base">{pi === 0 ? '📄' : pi === 1 ? '🧠' : '🧩'}</span>}
              title={p.title}
              sub={p.intro}
              action={<Badge cls="bg-manar-50 text-manar-700 nums">{partsPoints[pi]} نقطة</Badge>}
            />
            <div className="p-4 space-y-3">
              {p.items.map((it, qi) => (
                <div key={it.id} className="rounded-xl border border-slate-100 px-4 py-3">
                  {it.docRef && <div className="rounded-lg bg-sand-50 border border-sand-200 px-3.5 py-2 text-[13px] font-bold text-slate-700 mb-2">📎 {it.docRef}</div>}
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-manar-100 text-manar-800 text-[11px] font-extrabold grid place-items-center shrink-0 nums">{qi + 1}</span>
                    <div className="flex-1">
                      <div className="text-[13.5px] leading-relaxed text-slate-800">{it.text}</div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1 nums">({it.points} نقطة)</div>
                    </div>
                  </div>
                  {showCorr && (
                    <div className="mt-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700 fade-up">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-emerald-800 text-[11.5px]">عناصر الإجابة</span>
                        <ProvenanceBadge p={it.provenance} />
                      </div>
                      {it.correction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* سلم التنقيط */}
        <Card className="p-4">
          <h4 className="font-extrabold text-manar-900 text-sm mb-2 flex items-center gap-2"><Scale className="w-4 h-4" /> سلم التنقيط</h4>
          <div className="flex flex-wrap gap-2">
            {test.parts.map((p, i) => (
              <Badge key={p.id} cls="bg-white border-manar-200 text-manar-800">{p.title}: {partsPoints[i]} ن</Badge>
            ))}
            <Badge cls="bg-manar-700 text-white">المجموع: {test.totalPoints} ن</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
