// تبويب الوثائق داخل الدرس: أنشطة اشتغال على كل وثيقة
import { useState } from 'react';
import { Library, Plus, Pencil } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card, CardHead, Btn, SourceChip, ProvenanceBadge, Modal, Field, TextInput, Select, Accordion, EmptyState, useToast, Badge } from '../../components/ui';
import type { LessonContext } from '../../lib/generators/common';
import { buildDocQuestions } from '../../lib/generators/docActivity';
import { uid } from '../../lib/extractor';
import { DOC_KIND_META } from '../../types';
import type { DocRef, DocKind } from '../../types';
import { OpenPageModal } from '../../components/PdfPageView';
import { DocPresentation } from '../../components/DocPresentation';
import { Play } from 'lucide-react';

export function DocumentsView({ ctx }: { ctx: LessonContext }) {
  const { state, saveDoc, pdfBuffer } = useApp();
  const { toast } = useToast();
  const [viewPage, setViewPage] = useState<number | null>(null);
  const [editing, setEditing] = useState<DocRef | null>(null);
  const [adding, setAdding] = useState(false);
  const [presenting, setPresenting] = useState(false);

  if (!ctx.docs.length) {
    return (
      <Card>
        <EmptyState
          icon={<Library className="w-7 h-7" />}
          title="لا توجد وثائق مستخرجة لهذا الدرس"
          desc="تعذر استخراج وثائق (خرائط، جداول، مبيانات، نصوص) من النسخة المرفوعة لهذا الدرس. أضفها يدوياً من الكتاب."
          action={<Btn onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> إضافة وثيقة يدوياً</Btn>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex items-center justify-between gap-3 no-print">
        <p className="text-sm text-slate-500">{ctx.docs.length} وثيقة مستخرجة من الكتاب لهذا الدرس — لكل وثيقة نشاط اشتغال: التعريف، التحليل، أسئلة تدريجية، وعناصر الإجابة.</p>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> إضافة وثيقة</Btn>
          <Btn onClick={() => setPresenting(true)} title="عرض تقديمي تفاعلي للوثائق — شاشة كاملة للتنزيل في القسم">
            <Play className="w-4 h-4" /> العرض التفاعلي
          </Btn>
        </div>
      </div>

      {presenting && <DocPresentation ctx={ctx} onClose={() => setPresenting(false)} />}

      {ctx.docs.map((d, i) => (
        <DocActivity key={d.id} doc={d} ctx={ctx} onEdit={() => setEditing({ ...d })} onView={() => setViewPage(d.page)} isFirst={i === 0} />
      ))}

      {viewPage !== null && state.book && (
        <OpenPageModal bookId={state.book.id} page={viewPage} onClose={() => setViewPage(null)} loadBuffer={pdfBuffer} hasPdf={Boolean(state.book.fileName && !state.book.isDemo && !state.book.pdfMissing)} />
      )}
      {editing && <DocModal doc={editing} lessonId={ctx.lesson.id} onClose={() => setEditing(null)} onSave={(d) => { void saveDoc(d); toast('تم حفظ الوثيقة'); setEditing(null); }} />}
      {adding && <DocModal doc={newDoc(ctx)} lessonId={ctx.lesson.id} onClose={() => setAdding(false)} onSave={(d) => { void saveDoc(d); toast('تمت إضافة الوثيقة'); setAdding(false); }} />}
    </div>
  );
}

function newDoc(ctx: LessonContext): DocRef {
  return {
    id: uid('doc'),
    bookId: ctx.lesson.bookId,
    lessonId: ctx.lesson.id,
    kind: 'other',
    title: '',
    page: ctx.lesson.pageStart,
  };
}

function DocModal({ doc, lessonId, onClose, onSave }: { doc: DocRef; lessonId: string; onClose: () => void; onSave: (d: DocRef) => void }) {
  const [d, setD] = useState<DocRef>({ ...doc, lessonId });
  return (
    <Modal open onClose={onClose} title={doc.title ? 'تعديل الوثيقة' : 'إضافة وثيقة من الكتاب'} wide>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="عنوان الوثيقة كما ورد في الكتاب">
          <TextInput value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="مثال: خريطة 1: تيارات الهجرة الداخلية" />
        </Field>
        <Field label="نوع الوثيقة">
          <Select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as DocKind })}>
            {(Object.keys(DOC_KIND_META) as DocKind[]).map((k) => (
              <option key={k} value={k}>{DOC_KIND_META[k].label}</option>
            ))}
          </Select>
        </Field>
        <Field label="الصفحة في الكتاب">
          <TextInput type="number" value={String(d.page)} onChange={(e) => setD({ ...d, page: +e.target.value || 1 })} />
        </Field>
        <Field label="موضوع الوثيقة">
          <TextInput value={d.topic || ''} onChange={(e) => setD({ ...d, topic: e.target.value })} />
        </Field>
        <Field label="مصدر الوثيقة إن وجد">
          <TextInput value={d.origin || ''} onChange={(e) => setD({ ...d, origin: e.target.value })} />
        </Field>
        <Field label="تاريخها إن وجد">
          <TextInput value={d.date || ''} onChange={(e) => setD({ ...d, date: e.target.value })} />
        </Field>
      </div>
      <div className="flex gap-2 mt-5">
        <Btn disabled={!d.title.trim()} onClick={() => onSave(d)}>حفظ الوثيقة</Btn>
        <Btn variant="secondary" onClick={onClose}>إلغاء</Btn>
      </div>
    </Modal>
  );
}

/* ---------- نشاط الاشتغال على وثيقة ---------- */
function DocActivity({ doc, ctx, onEdit, onView, isFirst }: { doc: DocRef; ctx: LessonContext; onEdit: () => void; onView: () => void; isFirst: boolean }) {
  const { bookTitle } = ctx;
  const [open, setOpen] = useState(isFirst);
  const meta = DOC_KIND_META[doc.kind];

  // أسئلة تدريجية: فهم ← استخراج ← تحليل ← تفسير ← تركيب
  const questions = buildDocQuestions(doc, ctx);

  return (
    <Card>
      <CardHead
        icon={<span className="text-base">{meta.icon}</span>}
        title={doc.title}
        sub={`${meta.label} · الصفحة ${doc.page}${doc.origin ? ' · المصدر: ' + doc.origin : ''}${doc.date ? ' · ' + doc.date : ''}`}
        action={
          <div className="flex items-center gap-1.5 no-print">
            <SourceChip bookTitle={bookTitle} page={doc.page} />
            <button onClick={onView} className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="عرض الصفحة الأصلية">👁️</button>
            <button onClick={onEdit} className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="تعديل">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setOpen((o) => !o)} className="text-[12px] font-bold text-manar-700 px-3 py-1.5 rounded-lg hover:bg-manar-50">{open ? 'إخفاء النشاط' : 'عرض النشاط'}</button>
          </div>
        }
      />
      {open && (
        <div className="p-4 space-y-4 fade-up">
          {/* التعريف بالوثيقة */}
          <div className="rounded-xl bg-sand-50 border border-sand-200 p-4">
            <h4 className="font-extrabold text-manar-900 text-[13.5px] mb-2">التعريف بالوثيقة</h4>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
              <div><span className="font-bold text-slate-500">طبيعة الوثيقة: </span>{meta.label}</div>
              <div><span className="font-bold text-slate-500">المصدر: </span>{doc.origin || 'لم يُستخرج (راجع الكتاب)'}</div>
              <div><span className="font-bold text-slate-500">التاريخ: </span>{doc.date || 'لم يُستخرج'}</div>
              <div><span className="font-bold text-slate-500">الموضوع: </span>{doc.topic || doc.title}</div>
              <div><span className="font-bold text-slate-500">الصفحة: </span><SourceChip bookTitle={bookTitle} page={doc.page} /></div>
            </div>
          </div>

          {/* تحليل الوثيقة */}
          <div className="rounded-xl border border-manar-100 p-4">
            <h4 className="font-extrabold text-manar-900 text-[13.5px] mb-2 flex items-center gap-2">تحليل الوثيقة <Badge cls="bg-manar-50 text-manar-700">ملاحظة · وصف · تفسير · استنتاج</Badge></h4>
            <ol className="list-decimal pr-5 space-y-1.5 text-[13px] text-slate-600">
              <li><b className="text-slate-700">الملاحظة:</b> حدد طبيعة الوثيقة وعناصرها الظاهرة الرئيسية.</li>
              <li><b className="text-slate-700">الوصف:</b> صف ما تلاحظه بدقة (أسماء، أرقام، اتجاهات، توزيعات).</li>
              <li><b className="text-slate-700">التفسير:</b> اشرح العلاقات والسببية بين المعطيات.</li>
              <li><b className="text-slate-700">الاستنتاج:</b> صغ خلاصة تربط الوثيقة بموضوع الدرس.</li>
            </ol>
          </div>

          {/* الأسئلة التدريجية */}
          <div>
            <h4 className="font-extrabold text-manar-900 text-[13.5px] mb-2">الأسئلة التدريجية مع عناصر الإجابة المنتظرة</h4>
            <div className="space-y-2">
              {questions.map((q) => (
                <Accordion key={q.n} title={`${q.n}. ${q.q}`} subtitle={`مستوى ${q.lv}`} icon="❓" page={doc.page}>
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700">
                    <div className="flex items-center gap-2 mb-1"><span className="font-extrabold text-emerald-800 text-[12px]">عناصر الإجابة المنتظرة</span><ProvenanceBadge p={q.prov as 'book' | 'organized' | 'proposal'} /></div>
                    {q.a}
                  </div>
                </Accordion>
              ))}
            </div>
            <p className="text-[11.5px] text-slate-400 mt-2">الإجابات مستندة إلى الوثيقة والكتاب فقط. العناصر الموسومة 🔵 مقترحة وتحتاج إلى مراجعة الأستاذ حسب مضمون الوثيقة الأصلي.</p>
          </div>
        </div>
      )}
    </Card>
  );
}
