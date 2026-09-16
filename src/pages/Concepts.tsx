// قاموس المفاهيم والمصطلحات
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Plus, Search } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, EmptyState, Badge, Modal, Field, TextInput, Select, SourceChip, useToast } from '../components/ui';
import { uid } from '../lib/extractor';
import type { Concept } from '../types';

export function Concepts() {
  const { state, saveConcept } = useApp();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<Concept | null>(null);

  if (!state.book) {
    return (
      <Card>
        <EmptyState icon={<BarChart3 className="w-7 h-7" />} title="لا توجد مفاهيم" desc="ارفع الكتاب المدرسي أولاً." action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5">📤 رفع الكتاب</Link>} />
      </Card>
    );
  }

  const book = state.book;
  const list = state.concepts.filter((c) => !q || c.term.includes(q) || c.definition.includes(q));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950">📖 المفاهيم والمصطلحات</h1>
          <p className="text-sm text-slate-500 mt-1">قاموس الدروس: المصطلح، التعريف الوارد في الكتاب، الصفحة، والدرس المرتبط. التعريفات المستنتجة موسومة للمراجعة.</p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-manar-700 text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-manar-800 transition">
          <Plus className="w-4 h-4" /> إضافة مفهوم
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن مصطلح… (مثال: العولمة)"
          className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-manar-300"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((c) => {
          const les = state.lessons.find((l) => l.id === c.lessonId);
          const acts = state.activities.filter((a) => a.lessonId === c.lessonId);
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="font-extrabold text-[15px] text-manar-900">{c.term}</div>
                <div className="flex items-center gap-1.5">
                  {c.kind !== 'explicit' && <Badge cls="bg-amber-50 text-amber-700 border-amber-200">تعريف مستنتج — يحتاج إلى مراجعة الأستاذ</Badge>}
                  <button onClick={() => setEdit({ ...c })} className="text-[11.5px] font-bold text-slate-500 hover:text-manar-700 px-2 py-1 rounded-lg hover:bg-slate-50">تعديل</button>
                </div>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mt-2">{c.definition}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {c.page && <SourceChip bookTitle={book.title} page={c.page} />}
                {les && (
                  <Link to={`/lessons/${les.id}`} className="text-[11.5px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-full px-3 py-1 hover:bg-manar-100 transition truncate max-w-[260px]">
                    📖 {les.title}
                  </Link>
                )}
                {acts.length > 0 && <Badge cls="bg-sand-100 text-slate-500">✍️ {acts.length} أنشطة مرتبطة</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && (
        <Card>
          <EmptyState icon={<BarChart3 className="w-7 h-7" />} title="لا توجد نتائج" desc={q ? 'جرّب مصطلحاً آخر.' : 'لم يُستخرج مفاهيم بعد — أضفها يدوياً من الكتاب.'} />
        </Card>
      )}

      {(adding || edit) && (
        <ConceptModal
          initial={edit}
          onClose={() => {
            setAdding(false);
            setEdit(null);
          }}
          onSave={(c) => {
            void saveConcept(c);
            toast(edit ? 'تم تعديل المفهوم' : 'تمت إضافة المفهوم');
            setAdding(false);
            setEdit(null);
          }}
        />
      )}
    </div>
  );
}

function ConceptModal({ initial, onClose, onSave }: { initial: Concept | null; onClose: () => void; onSave: (c: Concept) => void }) {
  const { state } = useApp();
  const [c, setC] = useState<Concept>(
    initial || {
      id: uid('cnc'),
      bookId: state.book?.id || '',
      lessonId: state.lessons[0]?.id,
      term: '',
      definition: '',
      page: undefined,
      kind: 'manual',
    }
  );
  return (
    <Modal open onClose={onClose} title={initial ? `تعديل: ${initial.term}` : 'إضافة مفهوم من الكتاب'} wide>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="المصطلح">
          <TextInput value={c.term} onChange={(e) => setC({ ...c, term: e.target.value })} />
        </Field>
        <Field label="الدرس المرتبط">
          <Select value={c.lessonId || ''} onChange={(e) => setC({ ...c, lessonId: e.target.value || undefined })}>
            <option value="">— بدون درس محدد —</option>
            {state.lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="التعريف الوارد في الكتاب" hint="انقل التعريف كما هو من الكتاب — لا تستبدله بتعريف من الإنترنت.">
            <TextInput value={c.definition} onChange={(e) => setC({ ...c, definition: e.target.value })} />
          </Field>
        </div>
        <Field label="الصفحة">
          <TextInput type="number" value={String(c.page ?? '')} onChange={(e) => setC({ ...c, page: e.target.value ? +e.target.value : undefined })} />
        </Field>
        <Field label="نوع التعريف">
          <Select value={c.kind} onChange={(e) => setC({ ...c, kind: e.target.value as Concept['kind'] })}>
            <option value="explicit">صريح في الكتاب 🟢</option>
            <option value="inferred">مستنتج من السياق 🟡 (يحتاج مراجعة)</option>
            <option value="manual">مضاف يدوياً</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button
          disabled={!c.term.trim() || !c.definition.trim()}
          onClick={() => onSave(c)}
          className="bg-manar-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-manar-800 disabled:opacity-50 transition"
        >
          حفظ المفهوم
        </button>
        <button onClick={onClose} className="text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-5 py-2.5 hover:bg-slate-50 transition">
          إلغاء
        </button>
      </div>
    </Modal>
  );
}
