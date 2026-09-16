// الإعدادات
import { useState } from 'react';
import { Settings, Save, Trash2, ShieldCheck } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, Btn, Field, TextInput, Select, useToast, Modal } from '../components/ui';

export function SettingsPage() {
  const { state, saveSettings, deleteAll } = useApp();
  const { toast } = useToast();
  const [s, setS] = useState(state.settings);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-manar-950">⚙️ الإعدادات</h1>
        <p className="text-sm text-slate-500 mt-1">بيانات المؤسسة والأستاذ تُستعمل في ترويسة الجذاذات والفروض.</p>
      </div>

      <Card>
        <CardHead icon={<Settings className="w-5 h-5" />} title="هوية المنصة" />
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          <Field label="اسم المؤسسة">
            <TextInput value={s.institution} onChange={(e) => setS({ ...s, institution: e.target.value })} placeholder="مثال: الثانوية التأهيلية …" />
          </Field>
          <Field label="اسم الأستاذ(ة)">
            <TextInput value={s.teacherName} onChange={(e) => setS({ ...s, teacherName: e.target.value })} />
          </Field>
          <Field label="المادة">
            <Select value={s.subject} onChange={(e) => setS({ ...s, subject: e.target.value })}>
              <option>الجغرافيا</option>
            </Select>
          </Field>
          <Field label="المستوى">
            <Select value={s.level} onChange={(e) => setS({ ...s, level: e.target.value })}>
              <option>الثانية باكالوريا</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="عنوان الكتاب المرجعي">
              <TextInput value={s.bookTitle} onChange={(e) => setS({ ...s, bookTitle: e.target.value })} />
            </Field>
          </div>
          <Field label="المدة الزمنية الافتراضية للدروس">
            <TextInput value={s.durationDefault} onChange={(e) => setS({ ...s, durationDefault: e.target.value })} />
          </Field>
          <Field label="مجموع نقاط الفرض (افتراضي)">
            <TextInput type="number" value={String(s.pointsDefault)} onChange={(e) => setS({ ...s, pointsDefault: +e.target.value || 20 })} />
          </Field>
        </div>
        <div className="px-4 pb-4">
          <Btn
            onClick={() => {
              void saveSettings(s);
              toast('تم حفظ الإعدادات');
            }}
          >
            <Save className="w-4 h-4" /> حفظ الإعدادات
          </Btn>
        </div>
      </Card>

      <Card>
        <CardHead icon={<ShieldCheck className="w-5 h-5" />} title="خصوصية البيانات" sub="كل المعالجة محلية داخل متصفحك" />
        <div className="px-5 pb-5 text-[13px] text-slate-600 leading-relaxed space-y-2">
          <p>• ملف PDF يُقرأ ويُخزَّن محلياً في قاعدة بيانات متصفحك (IndexedDB) — لا يُرفع إلى أي خادم خارجي.</p>
          <p>• الاستخراج وبناء الفهرس وتوليد الجذاذات والفروض يتم كلها داخل المتصفح.</p>
          <p>• المنصة لا تضيف أي معلومات من الإنترنت تلقائياً، ولا تخمّن محتوى غير واضح.</p>
        </div>
      </Card>

      <Card className="border-rose-200">
        <CardHead icon={<Trash2 className="w-5 h-5" />} title="منطقة الخطر" sub="حذف كل البيانات المستخرجة والمشتقة" />
        <div className="px-5 pb-5">
          <Btn variant="danger" onClick={() => setConfirm(true)}>
            <Trash2 className="w-4 h-4" /> حذف كل البيانات
          </Btn>
        </div>
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="تأكيد الحذف النهائي">
        <p className="text-sm text-slate-600 leading-relaxed">سيتم حذف الكتاب المرفوع، الفهرس، المفاهيم، الوثائق، الجذاذات، الفروض، والتقويمات. لا يمكن التراجع.</p>
        <div className="flex gap-2 mt-5">
          <Btn
            variant="danger"
            onClick={() => {
              void deleteAll();
              setConfirm(false);
              toast('حُذفت جميع البيانات', 'warn');
            }}
          >
            نعم، احذف كل شيء
          </Btn>
          <Btn variant="secondary" onClick={() => setConfirm(false)}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}
