// مكونات واجهة موحدة — بطاقات، تبويبات، أكورديون، شارات المصدر...
import React, { useState, createContext, useContext } from 'react';
import { X, ChevronDown, FlaskConical, BookOpenCheck } from 'lucide-react';
import type { Provenance } from '../types';
import { PROVENANCE_META } from '../types';
import { useApp } from '../lib/store';
import { OpenPageModal } from './PdfPageView';

/* ---------- بطاقة ---------- */
export function Card({ children, className = '', lg = false }: { children: React.ReactNode; className?: string; lg?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-manar-100 ${lg ? 'shadow-card-lg' : 'shadow-card'} ${className}`}>
      {children}
    </div>
  );
}

export function CardHead({ icon, title, sub, action }: { icon?: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-manar-50">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="w-9 h-9 rounded-xl bg-manar-50 text-manar-700 grid place-items-center shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h3 className="font-bold text-[15px] text-manar-950 leading-snug">{title}</h3>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------- زر ---------- */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export function Btn({ children, onClick, variant = 'primary', className = '', disabled, type = 'button', title }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-manar-700 text-white hover:bg-manar-800 shadow-sm',
    secondary: 'bg-manar-50 text-manar-800 hover:bg-manar-100 border border-manar-200',
    ghost: 'text-manar-700 hover:bg-manar-50',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- شارة ---------- */
export function Badge({ children, cls = 'bg-slate-100 text-slate-700' }: { children: React.ReactNode; cls?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${cls}`}>{children}</span>;
}

/* ---------- شارة المصدر (نظام التحقق من المصدر) ---------- */
export function ProvenanceBadge({ p, full = false }: { p: Provenance; full?: boolean }) {
  const m = PROVENANCE_META[p];
  return (
    <span title={m.label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${m.cls} whitespace-nowrap`}>
      <span>{m.icon}</span>
      {full ? m.label : m.short}
    </span>
  );
}

/* ---------- تبويبات ---------- */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: React.ReactNode }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            active === t.id ? 'bg-manar-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-manar-50'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- أكورديون ---------- */
export function Accordion({ title, subtitle, page, children, defaultOpen = false, icon }: {
  title: string;
  subtitle?: string;
  page?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-manar-100 rounded-xl bg-white overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-manar-50/50 transition-colors">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-sm text-manar-950 truncate">{title}</span>
          {subtitle && <span className="block text-xs text-slate-500 truncate">{subtitle}</span>}
        </span>
        {page && <Badge cls="bg-sand-100 text-slate-600">ص {page}</Badge>}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 fade-up">{children}</div>}
    </div>
  );
}

/* ---------- نافذة ---------- */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-manar-950/40 backdrop-blur-sm no-print" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-card-lg w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[88vh] flex flex-col fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-manar-50">
          <h3 className="font-bold text-manar-950 text-[15px]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ---------- حقول ---------- */
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-manar-300 focus:border-manar-400 transition';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[90px] leading-relaxed ${props.className || ''}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ''}`} />;
}

/* ---------- حالة فارغة ---------- */
export function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-16 h-16 rounded-2xl bg-manar-50 text-manar-500 grid place-items-center mb-4">{icon}</div>
      <h3 className="font-bold text-manar-950">{title}</h3>
      {desc && <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- شريط تقدم ---------- */
export function Progress({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>{label}</span>
          <span className="nums">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-manar-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------- شارة المصدر مع رابط الصفحة ---------- */
export function SourceChip({ bookTitle, page }: { bookTitle: string; page?: number }) {
  const { state, pdfBuffer } = useApp();
  const [open, setOpen] = useState(false);
  if (!page) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-manar-700 bg-manar-50 hover:bg-manar-100 border border-manar-200 rounded-full px-2.5 py-1 transition"
        title="عرض الصفحة الأصلية في الكتاب"
      >
        <BookOpenCheck className="w-3.5 h-3.5" />
        <span>المصدر: {bookTitle} — الصفحة {page}</span>
      </button>
      {open && state.book && (
        <OpenPageModal
          bookId={state.book.id}
          page={page}
          onClose={() => setOpen(false)}
          loadBuffer={pdfBuffer}
          hasPdf={Boolean(state.book.fileName && !state.book.isDemo && !state.book.pdfMissing)}
        />
      )}
    </>
  );
}

/* ---------- لافتة البيانات التجريبية ---------- */
export function DemoBanner() {
  const { state } = useApp();
  if (!state.isDemo) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-accent-50 border border-accent-400/40 px-4 py-3 text-[13px] text-accent-600 font-semibold">
      <FlaskConical className="w-5 h-5 shrink-0" />
      <span>
        بيانات تجريبية توضيحية لأغراض العرض فقط — ليست محتوى كتاب «منار الجغرافيا». ارفع نسخة PDF حقيقية من كتابك لاستخراج المحتوى الأصلي بدقة.
      </span>
    </div>
  );
}

/* ---------- بطاقة إحصائية ---------- */
export function StatCard({ icon, label, value, sub, to }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; to?: string }) {
  return (
    <a href={to} className="group">
      <Card className="p-4 h-full group-hover:border-manar-300 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-manar-50 text-manar-600 grid place-items-center shrink-0">{icon}</div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-manar-950 nums leading-none">{value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1.5">{label}</div>
            {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
          </div>
        </div>
      </Card>
    </a>
  );
}

/* ---------- سياق التنبيهات ---------- */
const ToastCtx = createContext<{ toast: (msg: string, kind?: 'ok' | 'warn' | 'err') => void }>({ toast: () => {} });
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: 'ok' | 'warn' | 'err' }[]>([]);
  const toast = (msg: string, kind: 'ok' | 'warn' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, msg, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  };
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 left-5 z-[60] space-y-2 no-print">
        {items.map((t) => (
          <div
            key={t.id}
            className={`fade-up rounded-xl px-4 py-3 text-sm font-semibold shadow-card-lg border max-w-sm ${
              t.kind === 'ok' ? 'bg-manar-800 text-white border-manar-700' : t.kind === 'warn' ? 'bg-accent-50 text-accent-600 border-accent-400' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  return useContext(ToastCtx);
}
