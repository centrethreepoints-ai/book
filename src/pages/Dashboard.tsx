// لوحة تحكم الأستاذ
import { Link } from 'react-router-dom';
import {
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
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, CardHead, StatCard, ProvenanceBadge, Badge } from '../components/ui';

export function Dashboard() {
  const { state } = useApp();
  const { book, report, isDemo } = state;

  if (!book && state.autoBook.status === 'fetching') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card lg>
          <div className="flex items-center gap-4 p-2">
            <div className="text-4xl animate-pulse">📚</div>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-manar-950">دمج الكتاب المدرسي…</h1>
              <p className="text-sm text-slate-500 mt-1">نسخة الكتاب مرفوعة في المستودع — جارٍ جلبها وتحضيرها داخل المنصة.</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="h-2 rounded-full bg-manar-100 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-l from-manar-600 to-manar-400 rounded-full animate-pulse" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!book && state.autoBook.status === 'extracting') {
    const pct = state.autoBook.total > 0 ? Math.round((state.autoBook.done / state.autoBook.total) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto">
        <Card lg>
          <div className="flex items-center gap-4 p-2">
            <div className="text-4xl animate-pulse">⚙️</div>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-manar-950">قراءة الكتاب واستخراج بنيته…</h1>
              <p className="text-sm text-slate-500 mt-1">
                {state.autoBook.stage} — {state.autoBook.done}/{state.autoBook.total}
              </p>
            </div>
            <div className="text-2xl font-extrabold text-manar-700 tabular-nums">{pct}%</div>
          </div>
          <div className="px-6 pb-6">
            <div className="h-2.5 rounded-full bg-manar-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-manar-600 to-manar-400 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!book && state.autoBook.status === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card lg>
          <div className="p-6 space-y-4">
            <h1 className="text-lg font-extrabold text-red-700">تعذر الدمج التلقائي للكتاب</h1>
            <p className="text-sm text-slate-600">{state.autoBook.error}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              الكتاب مدمج في الموقع نفسه — المشكلة غالباً في الاتصال أو مهلة التحميل. أعد المحاولة، وإن تعذر يمكنك الرفع اليدوي.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-manar-700 text-white font-bold rounded-xl px-5 py-3 hover:bg-manar-800 transition"
              >
                <RefreshCw className="w-5 h-5" />
                إعادة المحاولة
              </button>
              <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-manar-800 border border-manar-200 font-bold rounded-xl px-5 py-3 hover:bg-manar-50 transition">
                <Upload className="w-5 h-5" />
                رفع يدوي
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card lg className="overflow-hidden">
          <div className="bg-gradient-to-l from-manar-800 to-manar-600 px-8 py-10 text-white">
            <div className="text-4xl mb-4">📚</div>
            <h1 className="text-2xl font-extrabold leading-snug">منصة منار التعليمية — الجغرافيا</h1>
            <p className="text-manar-100 mt-3 leading-relaxed max-w-xl">
              حوّل كتابك المدرسي إلى قاعدة تعليمية منظمة: دروس، جذاذات، فروض، تمارين، أنشطة وثائقية، وتقويمات — كل ذلك مستخرج من الكتاب كمصدر مرجعي أول وحيد.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-manar-800 font-bold rounded-xl px-5 py-3 hover:bg-manar-50 transition shadow-lg">
                <Upload className="w-5 h-5" />
                ارفع الكتاب (PDF)
              </Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 p-6">
            {[
              { icon: '🔎', t: 'استخراج تلقائي', d: 'قراءة PDF صفحة بصفحة واستخراج العناوين والمفاهيم والوثائق مع الحفاظ على ترتيب الكتاب.' },
              { icon: '📋', t: 'جذاذات وفروض', d: 'جذاذات تربوية وفروض بدرجات صعوبة مختلفة، مع التصحيحات وسلم التنقيط.' },
              { icon: '🟢', t: 'تحقق من المصدر', d: 'كل معلومة موسومة: مستخرجة من الكتاب، منظمة تربوياً، أو مقترح للمراجعة.' },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-manar-100 bg-manar-50/40 p-4">
                <div className="text-2xl">{x.icon}</div>
                <div className="font-bold text-manar-950 mt-2 text-sm">{x.t}</div>
                <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{x.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const counts = {
    lessons: state.lessons.length,
    concepts: state.concepts.length,
    docs: state.docs.length,
    maps: state.docs.filter((d) => d.kind === 'map').length,
    tables: state.docs.filter((d) => d.kind === 'table').length,
    charts: state.docs.filter((d) => d.kind === 'chart').length,
    questions: state.questions.length,
    worksheets: state.worksheets.length,
    tests: state.tests.length,
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-xl font-extrabold text-manar-950">لوحة تحكم الأستاذ</h1>
          <p className="text-sm text-slate-500 mt-1">
            {book.title} · {book.pageCount} صفحة {isDemo && '· نسخة تجريبية'}
          </p>
        </div>
        <Link to="/upload" className="inline-flex items-center gap-2 bg-manar-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm hover:bg-manar-800 transition">
          <Upload className="w-4 h-4" />
          رفع كتاب آخر
        </Link>
      </div>

      {/* الدروس التفاعلية — مسار الاستخدام الأساسي */}
      <Card>
        <CardHead
          icon={<Award className="w-5 h-5" />}
          title="الدروس التفاعلية"
          sub="ادخل أي درس: البنية الأصلية، الدرس التربوي، التقويم الفوري، الوثائق كعرض تفاعلي، التمارين والجذاذة"
          action={<Link to="/lessons" className="text-xs font-bold text-manar-700 hover:underline">كل الدروس ({state.lessons.length}) ←</Link>}
        />
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.lessons.slice(0, 6).map((l) => {
            const u = state.units.find((x) => x.id === l.unitId);
            return (
              <Link
                key={l.id}
                to={`/lessons/${l.id}`}
                className="group rounded-xl border border-manar-100 bg-white hover:border-manar-400 hover:shadow-md transition p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge cls="bg-manar-50 text-manar-700">{l.subject}</Badge>
                  {l.pageStart && <span className="text-[10.5px] font-bold text-slate-400 nums mr-auto">ص {l.pageStart}–{l.pageEnd}</span>}
                </div>
                <div className="font-extrabold text-[13.5px] text-manar-950 mt-2 leading-snug group-hover:text-manar-700 transition">{l.title}</div>
                <div className="text-[11px] text-slate-400 mt-1.5 truncate">{u?.title}</div>
                <div className="flex items-center gap-1 text-[11.5px] font-bold text-manar-600 mt-2">
                  ادخل الدرس
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
          {state.lessons.length === 0 && <p className="text-sm text-slate-400 py-4 text-center col-span-full">لم تُستخرج دروس بعد.</p>}
        </div>
      </Card>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="الكتاب المدرسي" value={book.pageCount} sub="صفحة مستخرجة" to="/book" />
        <StatCard icon={<FileText className="w-5 h-5" />} label="الدروس" value={counts.lessons} sub="درس مستخرج من الكتاب" to="/lessons" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="المفاهيم والمصطلحات" value={counts.concepts} sub="مصطلح موصوف" to="/concepts" />
        <StatCard icon={<Library className="w-5 h-5" />} label="الوثائق" value={counts.docs} sub={`🗺 ${counts.maps} · 📊 ${counts.tables} · 📈 ${counts.charts}`} to="/documents" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="الجذاذات" value={counts.worksheets} sub="جذاذة مهيأة" to="/worksheets" />
        <StatCard icon={<PenSquare className="w-5 h-5" />} label="الفروض" value={counts.tests} sub="فرض محفوظ" to="/tests" />
        <StatCard icon={<NotebookPen className="w-5 h-5" />} label="التمارين" value={counts.lessons * 7} sub="تمرين لكل درس" to="/exercises" />
        <StatCard icon={<FileCheck2 className="w-5 h-5" />} label="أسئلة الكتاب" value={counts.questions} sub="سؤال مستخرج" to="/search" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* نظرة عامة على الفهرس */}
        <Card className="lg:col-span-2">
          <CardHead icon={<BookOpen className="w-5 h-5" />} title="نظرة عامة على بنية الكتاب" sub="الوحدات والمحاور كما استُخرجت من الفهرس" action={<Link to="/book" className="text-xs font-bold text-manar-700 hover:underline">الفهرس كاملاً ←</Link>} />
          <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
            {state.units.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">لم يُستخرج أي عنوان كبير — افتح «فهرس الكتاب» للتهيئة اليدوية.</p>}
            {state.units.map((u) => (
              <div key={u.id} className="rounded-xl border border-manar-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-manar-50/60 flex items-center gap-2">
                  <span className="text-sm font-extrabold text-manar-900">📚 {u.title}</span>
                  {u.pageStart && <Badge cls="bg-white border-manar-200 text-manar-700 nums">ص {u.pageStart}–{u.pageEnd}</Badge>}
                </div>
                <div className="p-3 space-y-2">
                  {state.chapters.filter((c) => c.unitId === u.id).map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-slate-700">🧭 {c.title}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {state.lessons.filter((l) => l.chapterId === c.id).map((l) => (
                          <Link key={l.id} to={`/lessons/${l.id}`} className="text-[12px] font-semibold bg-white border border-slate-200 hover:border-manar-300 hover:text-manar-800 rounded-full px-3 py-1 transition">
                            {l.title} <span className="text-slate-400 nums">ص{l.pageStart}</span>
                          </Link>
                        ))}
                        {state.lessons.filter((l) => l.unitId === u.id && !l.chapterId).map((l) => (
                          <Link key={l.id} to={`/lessons/${l.id}`} className="text-[12px] font-semibold bg-white border border-slate-200 hover:border-manar-300 hover:text-manar-800 rounded-full px-3 py-1 transition">
                            {l.title} <span className="text-slate-400 nums">ص{l.pageStart}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  {state.chapters.filter((c) => c.unitId === u.id).length === 0 && state.lessons.filter((l) => l.unitId === u.id).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {state.lessons.filter((l) => l.unitId === u.id).map((l) => (
                        <Link key={l.id} to={`/lessons/${l.id}`} className="text-[12px] font-semibold bg-white border border-slate-200 hover:border-manar-300 rounded-full px-3 py-1 transition">
                          {l.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {/* تقرير الاستخراج */}
          <Card>
            <CardHead icon={<Sparkles className="w-5 h-5" />} title="تقرير الاستخراج" sub="نتيجة قراءة الكتاب صفحة بصفحة" />
            <div className="p-4 space-y-2.5 text-sm">
              {report ? (
                <>
                  <Row ok label={`الصفحات القابلة للقراءة`} v={`${report.pagesReadable} / ${report.pagesTotal}`} />
                  {report.pagesScanned > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{report.pagesScanned} صفحة مصورة: «تعذر استخراج هذا الجزء من النسخة المرفوعة» — لم يُخمَّن أي محتوى.</span>
                    </div>
                  )}
                  <Row ok label="الدروس المستخرجة" v={String(report.lessonsFound)} />
                  <Row ok label="المباحث" v={String(report.sectionsFound)} />
                  <Row ok label="المفاهيم" v={String(report.conceptsFound)} />
                  <Row ok label="الوثائق" v={String(report.docsFound)} />
                  <Row ok label="الأسئلة" v={String(report.questionsFound)} />
                  {report.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-slate-400 text-xs leading-relaxed">
                  لا يوجد تقرير — استخدم تقرير الاستخراج بعد رفع الكتاب. في النسخة التجريبية، البيانات معروضة لأغراض العرض.
                </p>
              )}
            </div>
          </Card>

          {/* دليل شارات المصدر */}
          <Card>
            <CardHead icon={<CheckCircle2 className="w-5 h-5" />} title="نظام التحقق من المصدر" sub="كل محتوى في المنصة يحمل علامة مصدره" />
            <div className="p-4 space-y-2.5">
              <ProvenanceBadge p="book" full />
              <div>
                <ProvenanceBadge p="organized" full />
              </div>
              <div>
                <ProvenanceBadge p="proposal" full />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                🔴 <span>معلومة خارج الكتاب — تظهر فقط كتنبيه: «هذه المعلومة غير واردة صراحة في الكتاب المدرسي.»</span>
              </div>
            </div>
          </Card>

          {/* وصول سريع */}
          <Card>
            <CardHead icon={<Search className="w-5 h-5" />} title="وصول سريع" />
            <div className="p-4 grid grid-cols-2 gap-2">
              <QuickLink to="/search" label="🔎 البحث الذكي" />
              <QuickLink to="/evaluation" label="🎯 التقويم التشخيصي" />
              <QuickLink to="/worksheets" label="📋 الجذاذات" />
              <QuickLink to="/tests" label="📝 إنشاء فرض" />
              <QuickLink to="/concepts" label="📖 المفاهيم" />
              <QuickLink to="/exercises" label="✏️ التمارين" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v, ok }: { label: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-600">
        {ok && <CheckCircle2 className="w-4 h-4 text-manar-500" />}
        {label}
      </span>
      <span className="font-extrabold text-manar-950 nums">{v}</span>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-[13px] font-bold text-slate-700 bg-sand-50 hover:bg-manar-50 hover:text-manar-800 border border-slate-200 rounded-xl px-3 py-2.5 text-center transition">
      {label}
    </Link>
  );
}
