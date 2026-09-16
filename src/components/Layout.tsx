// الهيكل العام: شريط جانبي + رأس الصفحة
import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  PenSquare,
  NotebookPen,
  Map,
  Table,
  BarChart3,
  Library,
  FileCheck2,
  Search,
  Settings,
  Menu,
  X,
  GraduationCap,
  BookUp,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { DemoBanner } from './ui';

const NAV = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'الكتاب المدرسي', icon: BookOpen },
  { to: '/book', label: 'فهرس الكتاب', icon: BookUp },
  { to: '/lessons', label: 'الدروس', icon: FileText },
  { to: '/worksheets', label: 'الجذاذات', icon: ClipboardList },
  { to: '/tests', label: 'الفروض', icon: PenSquare },
  { to: '/exercises', label: 'التمارين', icon: NotebookPen },
  { to: '/documents', label: 'الوثائق', icon: Library },
  { to: '/maps', label: 'الخرائط', icon: Map },
  { to: '/tables', label: 'الجداول والمبيانات', icon: Table, charts: true },
  { to: '/concepts', label: 'المفاهيم والمصطلحات', icon: BarChart3 },
  { to: '/evaluation', label: 'التقويم', icon: FileCheck2 },
  { to: '/search', label: 'البحث', icon: Search },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const { state } = useApp();

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-manar-500/20 text-manar-200 grid place-items-center">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-white text-[15px] leading-tight">منصة منار</div>
          <div className="text-[11px] text-manar-200/80">جغرافيا · الثانية باكالوريا</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors ${
                isActive ? 'bg-manar-500/25 text-white' : 'text-manar-100/75 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <n.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="truncate">{n.label}</span>
            {n.charts && <span className="text-[10px] text-manar-200/60 mr-auto">(والمبيانات)</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-[11px] text-manar-200/70 leading-relaxed">
          {state.book ? (
            <>
              <div className="font-bold text-manar-100 truncate">{state.book.title}</div>
              <div className="nums">{state.book.pageCount} صفحة · {state.lessons.length} درس</div>
            </>
          ) : (
            'لم يُرفع الكتاب بعد — ابدأ برفع PDF'
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* شريط جانبي — سطح المكتب */}
      <aside className="no-print hidden lg:block w-[260px] shrink-0 bg-manar-950 fixed inset-y-0 right-0 z-40">{sidebar}</aside>
      {/* شريط جانبي — الجوال */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[280px] bg-manar-950 shadow-2xl fade-up">
            <button onClick={() => setOpen(false)} className="absolute top-4 left-4 w-9 h-9 rounded-lg grid place-items-center text-white/70 hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:mr-[260px] min-w-0">
        {/* الرأس */}
        <header className="no-print sticky top-0 z-30 bg-sand-50/90 backdrop-blur border-b border-sand-200">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
            <button onClick={() => setOpen(true)} className="lg:hidden w-9 h-9 rounded-lg grid place-items-center bg-white border border-slate-200 text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-[13px] font-bold text-slate-500 truncate">
              {state.book ? (
                <>
                  <span className="text-manar-800">{state.book.title}</span>
                  <span className="text-slate-400"> · {state.settings.level} · {state.settings.subject}</span>
                </>
              ) : (
                'مرحباً بك في منصة منار التعليمية'
              )}
            </div>
            <div className="mr-auto flex items-center gap-2">
              {state.isDemo && <span className="hidden sm:inline-flex text-[11px] font-bold bg-accent-50 text-accent-600 border border-accent-400/40 rounded-full px-3 py-1">نسخة تجريبية</span>}
              <Link to="/upload" className="text-[12px] font-bold text-manar-700 bg-manar-50 border border-manar-200 rounded-full px-3.5 py-1.5 hover:bg-manar-100 transition">
                {state.book ? 'رفع كتاب آخر' : 'رفع الكتاب'}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-5 max-w-[1200px] mx-auto">
          <DemoBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
