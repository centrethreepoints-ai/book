// تبويب الجذاذة التربوية داخل الدرس
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw, Printer, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../lib/store';
import { generateWorksheet } from '../../lib/generators/worksheet';
import { Card, CardHead, Btn, ProvenanceBadge, EmptyState, Field, TextInput } from '../../components/ui';
import type { LessonContext } from '../../lib/generators/common';
import { printArea } from '../../lib/print';
import type { Worksheet } from '../../types';

export function WorksheetView({ ctx }: { ctx: LessonContext }) {
  const { state, saveWorksheet, deleteWorksheet } = useApp();
  const existing = state.worksheets.find((w) => w.lessonId === ctx.lesson.id);
  const [ws, setWs] = useState<Worksheet | null>(existing ?? null);
  const [duration, setDuration] = useState(state.settings.durationDefault);

  if (!ws) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList className="w-7 h-7" />}
          title="📋 إنشاء الجذاذة التربوية"
          desc="سيتولى النظام إنشاء جذاذة جاهزة للطباعة مبنية على محتوى هذا الدرس المستخرج من الكتاب: المراحل، أنشطة الأستاذ والمتعلم، الوسائل، الزمن، التقويم والدعم."
          action={
            <div className="flex flex-col items-center gap-3">
              <div className="w-64">
                <Field label="المدة الزمنية">
                  <TextInput value={duration} onChange={(e) => setDuration(e.target.value)} />
                </Field>
              </div>
              <Btn onClick={() => setWs(generateWorksheet(ctx, { bookId: ctx.lesson.bookId, institution: state.settings.institution, teacherName: state.settings.teacherName, duration }))}>
                <ClipboardList className="w-4 h-4" />
                إنشاء الجذاذة
              </Btn>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <ProvenanceBadge p="proposal" full />
        <span className="text-[12px] text-slate-500">جذاذة مقترحة — راجعها وطبّق تعديلاتك قبل الاستعمال.</span>
        <div className="mr-auto flex flex-wrap gap-2">
          <Btn variant="secondary" onClick={() => setWs(generateWorksheet(ctx, { bookId: ctx.lesson.bookId, institution: state.settings.institution, teacherName: state.settings.teacherName, duration: ws.duration }))}>
            <RefreshCw className="w-4 h-4" /> إعادة التوليد
          </Btn>
          <Btn variant="secondary" onClick={printArea}>
            <Printer className="w-4 h-4" /> طباعة / تصدير PDF
          </Btn>
          <Btn onClick={() => void saveWorksheet(ws)}>
            <Save className="w-4 h-4" /> حفظ
          </Btn>
          <Btn
            variant="danger"
            onClick={() => {
              void deleteWorksheet(ws.id);
              setWs(null);
            }}
          >
            <Trash2 className="w-4 h-4" /> حذف
          </Btn>
        </div>
      </div>

      {/* الجذاذة القابلة للطباعة */}
      <div data-printable="true" data-print-title={`جذاذة - ${ws.lessonTitle}`}>
        <Card className="overflow-hidden print-area">
          <div className="bg-gradient-to-l from-manar-800 to-manar-600 px-6 py-4 text-white">
            <h2 className="text-lg font-extrabold">📋 الجذاذة التربوية</h2>
            <p className="text-manar-100 text-[13px] mt-1">المادة: {ws.subject} · المستوى: {ws.level}</p>
          </div>
          <div className="p-5">
            <table className="w-full text-[13px] border-collapse mb-4">
              <tbody>
                <WsRow label="المؤسسة" v={ws.institution || '………………'} />
                <WsRow label="الأستاذ(ة)" v={ws.teacherName || '………………'} />
                <WsRow label="المادة" v={ws.subject} />
                <WsRow label="المستوى" v={ws.level} />
                <WsRow label="الوحدة" v={ws.unitTitle} />
                <WsRow label="عنوان الدرس" v={ws.lessonTitle} />
                <WsRow label="المدة الزمنية" v={ws.duration} />
              </tbody>
            </table>

            <WsBlock label="الكفايات المستهدفة">
              <ul className="pr-4 list-disc space-y-1">{ws.competencies.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </WsBlock>
            <WsBlock label="الأهداف التعليمية">
              <ul className="pr-4 list-disc space-y-1">{ws.objectives.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </WsBlock>
            <WsBlock label="المكتسبات السابقة">
              <ul className="pr-4 list-disc space-y-1">{ws.priorKnowledge.length ? ws.priorKnowledge.map((c, i) => <li key={i}>{c}</li>) : <li>————</li>}</ul>
            </WsBlock>
            <WsBlock label="الإشكالية"><p>{ws.problem}</p></WsBlock>
            <WsBlock label="المفاهيم والمصطلحات">
              <ul className="pr-4 list-disc space-y-1">{ws.concepts.length ? ws.concepts.map((c, i) => <li key={i}>{c}</li>) : <li>————</li>}</ul>
            </WsBlock>
            <WsBlock label="الوسائل التعليمية">
              <ul className="pr-4 list-disc space-y-1">{ws.tools.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </WsBlock>
            <WsBlock label="الوثائق المعتمدة">
              <ul className="pr-4 list-disc space-y-1">{ws.documents.length ? ws.documents.map((c, i) => <li key={i}>{c}</li>) : <li>————</li>}</ul>
            </WsBlock>

            {/* جدول مراحل الدرس */}
            <div className="mt-5">
              <h4 className="font-extrabold text-manar-900 text-sm mb-2">مراحل الدرس</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[12px] border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-manar-700 text-white">
                      <th className="px-3 py-2.5 text-start font-extrabold w-[18%]">مراحل الدرس</th>
                      <th className="px-3 py-2.5 text-start font-extrabold w-[27%]">أنشطة الأستاذ</th>
                      <th className="px-3 py-2.5 text-start font-extrabold w-[27%]">أنشطة المتعلم</th>
                      <th className="px-3 py-2.5 text-start font-extrabold w-[20%]">الوسائل / الوثائق</th>
                      <th className="px-3 py-2.5 text-center font-extrabold w-[8%]">الزمن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ws.stages.map((s, i) => (
                      <tr key={i} className={i % 2 ? 'bg-manar-50/40' : 'bg-white'}>
                        <td className="px-3 py-2.5 font-bold text-manar-900 border-t border-slate-100 align-top">{s.stage}</td>
                        <td className="px-3 py-2.5 text-slate-600 border-t border-slate-100 align-top leading-relaxed">{s.teacher}</td>
                        <td className="px-3 py-2.5 text-slate-600 border-t border-slate-100 align-top leading-relaxed">{s.learner}</td>
                        <td className="px-3 py-2.5 text-slate-600 border-t border-slate-100 align-top">{s.tools}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-700 border-t border-slate-100 nums align-top">{s.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <WsBlock label="التقويم (الأسئلة والأجوبة المنتظرة)">
              <div className="whitespace-pre-line leading-relaxed">{ws.evaluation}</div>
            </WsBlock>
            <WsBlock label="الدعم والمعالجة"><p className="leading-relaxed">{ws.support}</p></WsBlock>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              <span>أُنشئت آلياً بواسطة منصة منار — {new Date(ws.createdAt).toLocaleDateString('ar')}</span>
              <Link to="/worksheets" className="font-bold text-manar-600 hover:underline no-print">كل الجذاذات ←</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WsRow({ label, v }: { label: string; v: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-3 py-2 font-extrabold text-manar-900 bg-manar-50/50 w-40">{label}</td>
      <td className="px-3 py-2 text-slate-700">{v}</td>
    </tr>
  );
}

function WsBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="font-extrabold text-manar-900 text-sm mb-1.5">{label}</h4>
      <div className="rounded-xl bg-sand-50 border border-sand-200 px-4 py-2.5 text-[13px] text-slate-700">{children}</div>
    </div>
  );
}
