// 📚 فهرس الكتاب المدرسي — الشجرة الهرمية للعناوين مع أرقام الصفحات
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookUp, Pencil, Trash2, Plus, Layers, GitBranch, FileText, ListTree } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, Accordion, Badge, Btn, Modal, Field, TextInput, EmptyState } from '../components/ui';
import { uid } from '../lib/extractor';
import type { BookUnit, Chapter, Lesson } from '../types';

export function BookIndex() {
  const { state, saveUnit, saveChapter, saveLesson, deleteAll } = useApp();
  const [editUnit, setEditUnit] = useState<BookUnit | null>(null);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [addChapterTo, setAddChapterTo] = useState<BookUnit | null>(null);
  const [showClear, setShowClear] = useState(false);

  if (!state.book) {
    return (
      <Card>
        <EmptyState
          icon={<BookUp className="w-7 h-7" />}
          title="لا يوجد كتاب مرفوع"
          desc="ارفع نسخة PDF من الكتاب المدرسي ليتم استخراج الفهرس تلقائياً: الوحدات، المحاور، الدروس، والمباحث مع أرقام الصفحات."
          action={<Link to="/upload" className="text-sm font-bold text-white bg-manar-700 rounded-xl px-5 py-2.5 hover:bg-manar-800 transition">📤 رفع الكتاب</Link>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-manar-950 flex items-center gap-2">
            <BookUp className="w-6 h-6 text-manar-600" /> فهرس الكتاب المدرسي
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            التسلسل الهرمي كما ورد في الكتاب: الوحدة ← المحور ← الدرس ← المبحث ← العنوان الفرعي — مع رقم الصفحة الأصلية لكل عنصر.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="danger" onClick={() => setShowClear(true)}>
            <Trash2 className="w-4 h-4" /> حذف كل البيانات
          </Btn>
        </div>
      </div>

      {state.units.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTree className="w-7 h-7" />}
            title="لم يُستخرج أي عنوان كبير تلقائياً"
            desc="قد تكون النسخة المرفوعة بصيغة مختلفة. أضف الوحدات والمحاور يدوياً، أو أعد الرفع."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {state.units.map((u, ui) => (
            <Card key={u.id}>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gradient-to-l from-manar-800 to-manar-600 rounded-t-2xl">
                <Layers className="w-5 h-5 text-white" />
                <span className="font-extrabold text-white text-[15px] flex-1">
                  {u.kind === 'domain' ? 'المجال' : 'الوحدة'}: {u.title}
                </span>
                {u.pageStart && <Badge cls="bg-white/15 text-white nums border-white/20">ص {u.pageStart} – {u.pageEnd ?? '؟'}</Badge>}
                <div className="flex gap-1">
                  <button onClick={() => setEditUnit({ ...u })} className="w-8 h-8 rounded-lg grid place-items-center text-white/80 hover:bg-white/15" title="تعديل">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setAddChapterTo(u)} className="w-8 h-8 rounded-lg grid place-items-center text-white/80 hover:bg-white/15" title="إضافة محور">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {state.chapters.filter((c) => c.unitId === u.id).length === 0 && (
                  <p className="text-xs text-slate-400">لا توجد محاور — أضف محوراً.</p>
                )}
                {state.chapters.filter((c) => c.unitId === u.id).map((c) => (
                  <div key={c.id} className="border border-manar-100 rounded-xl overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-manar-50/50">
                      <GitBranch className="w-4.5 h-4.5 w-[18px] h-[18px] text-manar-600" />
                      <span className="font-bold text-manar-900 text-sm flex-1">🧭 المحور: {c.title}</span>
                      {c.pageStart && <Badge cls="bg-white border-manar-200 text-manar-700 nums">ص {c.pageStart} – {c.pageEnd ?? '؟'}</Badge>}
                      <button onClick={() => setEditChapter({ ...c })} className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="تعديل">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {state.lessons.filter((l) => l.chapterId === c.id).map((l) => (
                        <Link
                          key={l.id}
                          to={`/lessons/${l.id}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white border border-slate-100 hover:border-manar-300 hover:bg-manar-50/40 transition group"
                        >
                          <FileText className="w-4 h-4 text-manar-500 shrink-0" />
                          <span className="text-[13.5px] font-bold text-slate-700 group-hover:text-manar-900 flex-1 truncate">{l.title}</span>
                          <Badge cls="bg-sand-100 text-slate-500 nums">ص {l.pageStart} – {l.pageEnd}</Badge>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditLesson({ ...l });
                            }}
                            className="w-7 h-7 rounded-lg grid place-items-center text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                            title="تعديل الدرس"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      ))}
                      {state.lessons.filter((l) => l.chapterId === c.id).length === 0 && (
                        <p className="text-xs text-slate-400 px-2">لا توجد دروس في هذا المحور.</p>
                      )}
                    </div>
                  </div>
                ))}
                {/* دروس بلا محور */}
                {state.lessons.filter((l) => l.unitId === u.id && !l.chapterId).length > 0 && (
                  <div className="p-3 space-y-1.5 rounded-xl border border-dashed border-sand-300 bg-sand-50/50">
                    <div className="text-[11px] font-bold text-slate-400 px-1">دروس غير مصنفة تحت محور:</div>
                    {state.lessons
                      .filter((l) => l.unitId === u.id && !l.chapterId)
                      .map((l) => (
                        <Link key={l.id} to={`/lessons/${l.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white border border-slate-100 hover:border-manar-300 transition">
                          <FileText className="w-4 h-4 text-manar-500" />
                          <span className="text-[13.5px] font-bold text-slate-700 flex-1 truncate">{l.title}</span>
                          <Badge cls="bg-sand-100 text-slate-500 nums">ص {l.pageStart} – {l.pageEnd}</Badge>
                        </Link>
                      ))}
                  </div>
                )}
                {ui === 0 && state.units.length > 0 && (
                  <div className="pt-1">
                    <Btn variant="secondary" className="!py-1.5 !text-xs" onClick={() => setAddChapterTo(u)}>
                      <Plus className="w-3.5 h-3.5" /> إضافة محور لهذه الوحدة
                    </Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* تحرير وحدة */}
      {editUnit && (
        <Modal open onClose={() => setEditUnit(null)} title="تعديل الوحدة">
          <EditFields
            title={editUnit.title}
            onTitle={(t) => setEditUnit({ ...editUnit, title: t })}
            onPages={(s, e) => setEditUnit({ ...editUnit, pageStart: s ?? editUnit.pageStart, pageEnd: e ?? editUnit.pageEnd })}
            onSave={() => {
              void saveUnit(editUnit);
              setEditUnit(null);
            }}
            onCancel={() => setEditUnit(null)}
          />
        </Modal>
      )}
      {editChapter && (
        <Modal open onClose={() => setEditChapter(null)} title="تعديل المحور">
          <EditFields
            title={editChapter.title}
            onTitle={(t) => setEditChapter({ ...editChapter, title: t })}
            onPages={(s, e) => setEditChapter({ ...editChapter, pageStart: s ?? editChapter.pageStart, pageEnd: e ?? editChapter.pageEnd })}
            onSave={() => {
              void saveChapter(editChapter);
              setEditChapter(null);
            }}
            onCancel={() => setEditChapter(null)}
          />
        </Modal>
      )}
      {editLesson && (
        <Modal open onClose={() => setEditLesson(null)} title="تعديل الدرس">
          <EditFields
            title={editLesson.title}
            onTitle={(t) => setEditLesson({ ...editLesson, title: t })}
            onPages={(s, e) => setEditLesson({ ...editLesson, pageStart: s ?? editLesson.pageStart, pageEnd: e ?? editLesson.pageEnd })}
            onSave={() => {
              void saveLesson(editLesson);
              setEditLesson(null);
            }}
            onCancel={() => setEditLesson(null)}
          />
        </Modal>
      )}
      {addChapterTo && (
        <Modal open onClose={() => setAddChapterTo(null)} title={`إضافة محور إلى: ${addChapterTo.title}`}>
          <AddChapter unit={addChapterTo} onDone={(c) => { void saveChapter(c); setAddChapterTo(null); }} />
        </Modal>
      )}
      <Modal open={showClear} onClose={() => setShowClear(false)} title="حذف كل البيانات">
        <p className="text-sm text-slate-600 leading-relaxed">سيتم حذف الكتاب المرفوع وكل المحتوى المستخرج والمشتق (الجذاذات، الفروض، التقويمات). هذا الإجراء لا يمكن التراجع عنه.</p>
        <div className="flex gap-2 mt-5">
          <Btn
            variant="danger"
            onClick={() => {
              void deleteAll();
              setShowClear(false);
            }}
          >
            نعم، احذف كل شيء
          </Btn>
          <Btn variant="secondary" onClick={() => setShowClear(false)}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

function EditFields({ title, onTitle, onPages, onSave, onCancel }: {
  title: string;
  onTitle: (t: string) => void;
  onPages: (s?: number, e?: number) => void;
  onPagesInit?: { s?: number; e?: number };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [s, setS] = useState('');
  const [e, setE] = useState('');
  return (
    <div className="space-y-4">
      <Field label="العنوان">
        <TextInput value={title} onChange={(ev) => onTitle(ev.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="صفحة البداية">
          <TextInput type="number" value={s} onChange={(ev) => { setS(ev.target.value); onPages(ev.target.value ? +ev.target.value : undefined, e ? +e : undefined); }} placeholder="12" />
        </Field>
        <Field label="صفحة النهاية">
          <TextInput type="number" value={e} onChange={(ev) => { setE(ev.target.value); onPages(s ? +s : undefined, ev.target.value ? +ev.target.value : undefined); }} placeholder="18" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Btn onClick={onSave}>حفظ</Btn>
        <Btn variant="secondary" onClick={onCancel}>إلغاء</Btn>
      </div>
    </div>
  );
}

function AddChapter({ unit, onDone }: { unit: BookUnit; onDone: (c: Chapter) => void }) {
  const [title, setTitle] = useState('');
  return (
    <div className="space-y-4">
      <Field label="عنوان المحور">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: الدينامية الديموغرافية" />
      </Field>
      <div className="flex gap-2">
        <Btn
          disabled={!title.trim()}
          onClick={() =>
            onDone({
              id: uid('chap'),
              bookId: unit.bookId,
              unitId: unit.id,
              title: title.trim(),
              order: 99,
            })
          }
        >
          إضافة المحور
        </Btn>
      </div>
    </div>
  );
}
