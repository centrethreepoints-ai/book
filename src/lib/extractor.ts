// ============================================================
//  محرك استخراج محتوى الكتاب من PDF
//  - قراءة صفحة بصفحة
//  - استخراج النصوص والعناوين والجداول والمفاهيم والوثائق
//  - الحفاظ على المصطلحات والترتيب الأصلي للكتاب
//  - عدم اختراع أي محتوى: ما لم يُستخرج، يُعلَّم بالتحفظ
// ============================================================

import { pdfjsLib } from './pdfjs-setup';
import {
  normalizeDigits,
  isArabic,
  detectHeadingKind,
  matchFunc,
  docKindFromCaption,
  looksLikeQuestion,
  cleanText,
} from './arabic';
import type {
  Book,
  BookUnit,
  Chapter,
  Lesson,
  Section,
  Subsection,
  Concept,
  DocRef,
  Activity,
  Question,
  PageRecord,
  ExtractionReport,
  DocKind,
  QuestionLevel,
} from '../types';
import type { BookSeed } from './seedAlmasar';

export interface ExtractBundle {
  book: Book;
  units: BookUnit[];
  chapters: Chapter[];
  lessons: Lesson[];
  sections: Section[];
  subsections: Subsection[];
  concepts: Concept[];
  docs: DocRef[];
  activities: Activity[];
  questions: Question[];
  pages: PageRecord[];
  report: ExtractionReport;
}

/* ---------- هيكل سطري داخلي ---------- */

interface Word {
  str: string;
  x: number;
  y: number;
  size: number;
  font: string;
  flipped: boolean;
}

interface Line {
  text: string;
  page: number;
  y: number;
  size: number;
  bold: boolean;
  x: number;
}

interface ClassLine extends Line {
  kind: 'unit' | 'domain' | 'axis' | 'lesson' | 'section' | 'subsection' | 'body' | 'caption' | 'question' | 'noise';
  func: string | null;
  doc?: { kind: DocKind; title: string };
}

export type ProgressFn = (done: number, total: number, stage: string) => void;

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ============================================================ */

export async function extractBookFromPdf(
  bookId: string,
  fileName: string,
  fileSize: number,
  meta: { title?: string },
  onProgress: ProgressFn
): Promise<ExtractBundle> {
  const buf = new ArrayBuffer(fileSize);
  // نقرأ الملف في دُفعات حتى لا نثقل الذاكرة
  // (نقبل BufferArray جاهزة عبر المعامل)
  void buf;
  throw new Error('use extractFromBuffer');
}

/** طبقة OCR مسبقّة (صفحة ← كلمات بإحداثيات نقاط PDF) */
export interface OcrLayer {
  scale?: number;
  sizes: Record<string, [number, number]>;
  pages: Record<string, [string, number, number, number, number][]>;
}

/** مزوّد كلمات لكل صفحة: null = صفحة فارغة/ممسوحة */
type PageWords = (p: number) => Promise<{ words: Word[]; ocrUsed: boolean } | null>;

async function extractCore(
  bookId: string,
  fileName: string,
  fileSize: number,
  numPages: number,
  docTitle: string,
  getWords: PageWords,
  meta: { title?: string; ocr?: OcrLayer; seed?: BookSeed },
  onProgress: ProgressFn
): Promise<ExtractBundle> {
  onProgress(0, numPages, 'قراءة الصفحات');

  /* 1) استخراج الأسطر صفحة بصفحة */
  const allLines: Line[] = [];
  const pageTexts: string[][] = [];
  let pagesScanned = 0;
  let reversedLines = 0;
  let ocrPagesUsed = 0;

  for (let p = 1; p <= numPages; p++) {
    const res = await getWords(p);
    if (!res) {
      pagesScanned++;
      pageTexts.push([]);
      continue;
    }
    if (res.ocrUsed) ocrPagesUsed++;
    const words = res.words;

    // تجميع الكلمات في أسطر حسب الإحداثي الرأسي
    words.sort((a, b) => b.y - a.y);
    const clusters: Word[][] = [];
    for (const w of words) {
      const last = clusters[clusters.length - 1];
      if (last && Math.abs(last[0].y - w.y) <= Math.max(2.5, w.size * 0.45)) {
        last.push(w);
      } else {
        clusters.push([w]);
      }
    }

    const lines: Line[] = [];
    for (const cluster of clusters) {
      const avgSize = cluster.reduce((s, w) => s + w.size, 0) / cluster.length;
      if (avgSize < 5) continue; // علامات صغيرة
      // الشرائح المعكوسة تُقرأ من اليمين إلى اليسار مثل النص العربي
      const flipped = cluster.filter((w) => w.flipped).length > cluster.length / 2;
      const preJoin = cluster.map((w) => w.str).join(' ');
      const rtl = flipped || isArabic(preJoin);
      cluster.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
      const raw = cluster
        .map((w) => w.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!raw) continue;
      // كشف الأسطر المخزنة بالترتيب البصري (بدون مصفوفة سالبة) وعكسها للمرتبة المنطقية
      let text = maybeReverseVisualLine(raw);
      if (text !== raw) reversedLines++;
      const bold = cluster.some((w) => /bold|Bold|Black|Heavy/.test(w.font));
      lines.push({
        text,
        page: p,
        y: cluster[0].y,
        size: Math.round(avgSize * 10) / 10,
        bold,
        x: Math.min(...cluster.map((w) => w.x)),
      });
    }
    // إزالة التكرار الناتج عن تكرار نص PDF
    lines.sort((a, b) => b.y - a.y);
    const dedup: Line[] = [];
    for (const l of lines) {
      if (dedup[dedup.length - 1]?.text === l.text) continue;
      dedup.push(l);
    }
    allLines.push(...dedup);
    pageTexts.push(dedup.map((l) => l.text));
    if (p % 5 === 0 || p === numPages) onProgress(p, numPages, 'قراءة الصفحات');
  }

  /* 2) تحديد حجم الخط الأساسي (الجسم) */
  const sizeFreq = new Map<number, number>();
  for (const l of allLines) {
    const bucket = Math.round(l.size);
    sizeFreq.set(bucket, (sizeFreq.get(bucket) || 0) + l.text.length);
  }
  let bodySize = 10;
  let best = -1;
  for (const [s, w] of sizeFreq.entries()) {
    if (w > best) {
      best = w;
      bodySize = s;
    }
  }

  /* 3) إسكات الترويسات والتذييلات المتكررة */
  const lineFreq = new Map<string, number>();
  for (const l of allLines) {
    const key = l.text.trim();
    if (key.length < 60) lineFreq.set(key, (lineFreq.get(key) || 0) + 1);
  }
  const threshold = Math.max(4, Math.floor(numPages * 0.25));
  const isNoise = (l: Line): boolean => {
    const t = l.text.trim();
    if (!t) return true;
    if (/^\d{1,4}$/.test(normalizeDigits(t))) return true; // رقم صفحة وحده
    return (lineFreq.get(t) || 0) >= threshold;
  };

  /* 4) تصنيف الأسطر */
  const classify = (l: Line): ClassLine => {
    const text = l.text.trim();
    const base: ClassLine = { ...l, kind: 'body', func: null };
    if (isNoise(l)) return { ...base, kind: 'noise' };

    const kw = detectHeadingKind(text);
    const sizeRatio = l.size / bodySize;
    const shortish = text.length <= 80;

    const cap = docKindFromCaption(text);
    if (cap && shortish && (l.bold || sizeRatio >= 1.02 || /^(?:ال)?وثيقة\s*[\d٠-٩.]/.test(text))) {
      return { ...base, kind: 'caption', doc: cap };
    }
    if (kw && kw !== 'other' && shortish && (l.bold || sizeRatio >= 1.04 || kw === 'lesson')) {
      return { ...base, kind: kw === 'domain' ? 'unit' : kw };
    }
    // العناوين الوظيفية (الإشكالية، الخلاصة، المفاهيم...) قبل مستويات الحجم
    const f = matchFunc(text);
    if (f && shortish && (l.bold || sizeRatio >= 1.03) && !['intro'].includes(f)) {
      return { ...base, kind: 'subsection', func: f };
    }
    if (sizeRatio >= 1.45 && text.length <= 60) {
      return { ...base, kind: 'unit' };
    }
    if (sizeRatio >= 1.3 && text.length <= 70) {
      return { ...base, kind: 'lesson' };
    }
    if (sizeRatio >= 1.12 && l.bold && text.length <= 80) {
      return { ...base, kind: 'section' };
    }
    if (sizeRatio >= 1.12 && !l.bold && text.length <= 70 && sizeFreq.get(Math.round(l.size)) && sizeFreq.get(Math.round(l.size))! < 300) {
      return { ...base, kind: 'subsection' };
    }

    if (looksLikeQuestion(text) && sizeRatio < 1.18) {
      return { ...base, kind: 'question' };
    }
    if (f && shortish) {
      return { ...base, kind: 'subsection', func: f };
    }
    return base;
  };

  const classLines: ClassLine[] = allLines.map(classify);

  /* 5) كشف صفحات الغلاف والفهرس (جدول المحتويات) وإهمال عناوينها */
  const headingPages = new Map<number, number>();
  for (const l of classLines) {
    if (['unit', 'axis', 'lesson', 'section'].includes(l.kind)) {
      headingPages.set(l.page, (headingPages.get(l.page) || 0) + 1);
    }
  }
  const tocPages = new Set<number>();
  for (const [pg, n] of headingPages.entries()) {
    if (n >= 5) tocPages.add(pg);
  }
  // صفحات بها نقاط قياسية كثيرة (.....) أو فراغات مغلقة = فهرس
  const dottedByPage = new Map<number, number>();
  const kwByPage = new Map<number, number>();
  for (const l of classLines) {
    // سلسلة طويلة من النقاط (أو رموز ناقصة متتالية) = نقاط دليل الفهرس
    if (/\.{5,}|[.·]{5,}|\u0000{5,}/.test(l.text)) {
      dottedByPage.set(l.page, (dottedByPage.get(l.page) || 0) + 1);
    }
    if (l.text.length < 70 && detectHeadingKind(l.text)) {
      kwByPage.set(l.page, (kwByPage.get(l.page) || 0) + 1);
    }
  }
  for (const [pg, n] of dottedByPage.entries()) {
    if (n >= 3) tocPages.add(pg);
  }
  // 4+ عناوين مفتاحية قصيرة في صفحة واحدة = فهرس/جدول محتويات
  for (const [pg, n] of kwByPage.entries()) {
    if (n >= 4) tocPages.add(pg);
  }
  // صفحة الغلاف: صفحة أولى قليلة الأسطر أو بخط كبير
  const page1Lines = classLines.filter((l) => l.page === 1 && l.kind !== 'noise');
  const isCover =
    page1Lines.length <= 6 || page1Lines.some((l) => l.size >= 20);
  if (page1Lines.length > 0 && isCover) {
    for (const l of page1Lines) {
      if (['unit', 'axis', 'lesson', 'section'].includes(l.kind)) l.kind = 'body';
    }
  }
  for (const l of classLines) {
    if (tocPages.has(l.page) && ['unit', 'axis', 'lesson', 'section'].includes(l.kind)) {
      l.kind = 'body';
    }
  }

  /* 6) بناء الشجرة الهرمية: وحدة ← محور ← درس ← مبحث ← عنوان فرعي */
  const units: BookUnit[] = [];
  const chapters: Chapter[] = [];
  const lessons: Lesson[] = [];
  const sections: Section[] = [];
  const subsections: Subsection[] = [];
  const concepts: Concept[] = [];
  const docs: DocRef[] = [];
  const activities: Activity[] = [];
  const questions: Question[] = [];

  let curUnit: BookUnit | null = null;
  let curAxis: Chapter | null = null;
  let curLesson: Lesson | null = null;
  let curSection: Section | null = null;

  // دوال قراءة تمنع تضيق الأنواع الخاطئ داخل حلقة البناء
  const getCurUnit = (): BookUnit | null => curUnit;
  const getCurAxis = (): Chapter | null => curAxis;
  const getCurLesson = (): Lesson | null => curLesson;

  const startLesson = (l: ClassLine) => {
    const lesson: Lesson = {
      id: uid('les'),
      bookId,
      unitId: curUnit?.id || rootUnitId(),
      chapterId: curAxis?.id,
      title: cleanText(l.text.replace(/^(الدرس|درس)\s*/i, '')),
      order: lessons.length + 1,
      level: 'الثانية باكالوريا',
      subject: 'الجغرافيا',
      pageStart: l.page,
      pageEnd: l.page,
      problemExplicit: false,
    };
    lessons.push(lesson);
    curLesson = lesson;
    curSection = null;
  };

  function rootUnitId(): string {
    if (!curUnit) {
      const u: BookUnit = {
        id: uid('unit'),
        bookId,
        title: 'المحتوى العام',
        kind: 'unit',
        order: units.length + 1,
      };
      units.push(u);
      curUnit = u;
    }
    return curUnit.id;
  }

  for (const l of classLines) {
    switch (l.kind) {
      case 'unit': {
        const u: BookUnit = {
          id: uid('unit'),
          bookId,
          title: cleanText(l.text.replace(/^(الوحدة|المجال)\s*/i, '')),
          kind: /المجال/.test(l.text) ? 'domain' : 'unit',
          order: units.length + 1,
          pageStart: l.page,
        };
        units.push(u);
        curUnit = u;
        curAxis = null;
        curLesson = null;
        break;
      }
      case 'axis': {
        if (!curUnit) rootUnitId();
        const c: Chapter = {
          id: uid('chap'),
          bookId,
          unitId: curUnit!.id,
          title: cleanText(l.text.replace(/^المحور\s*/i, '')),
          order: chapters.filter((x) => x.unitId === curUnit!.id).length + 1,
          pageStart: l.page,
        };
        chapters.push(c);
        curAxis = c;
        curLesson = null;
        break;
      }
      case 'lesson':
        startLesson(l);
        break;
      case 'section': {
        const ls1 = getCurLesson();
        if (!ls1) break;
        let secTitle = cleanText(l.text);
        if (/^(المبحث|القسم)/.test(l.text)) {
          const stripped = l.text
            .replace(/^(المبحث|القسم)\s*/i, '')
            .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس|1|2|3|4|5)[\s.:：\-—ـ]*/i, '')
            .trim();
          if (stripped) secTitle = cleanText(stripped);
        }
        const s: Section = {
          id: uid('sec'),
          lessonId: ls1.id,
          title: secTitle,
          order: sections.filter((x) => x.lessonId === ls1.id).length + 1,
          pageStart: l.page,
        };
        sections.push(s);
        curSection = s;
        break;
      }
      case 'subsection': {
        const ls2 = getCurLesson();
        if (!ls2) break;
        const s: Subsection = {
          id: uid('sub'),
          lessonId: ls2.id,
          sectionId: curSection?.id,
          title: cleanText(l.text),
          order: subsections.filter((x) => x.lessonId === ls2.id).length + 1,
          pageStart: l.page,
        };
        subsections.push(s);
        break;
      }
      case 'caption': {
        if (!l.doc) break;
        const d: DocRef = {
          id: uid('doc'),
          bookId,
          lessonId: getCurLesson()?.id,
          kind: l.doc.kind,
          title: cleanText(l.doc.title),
          page: l.page,
        };
        docs.push(d);
        break;
      }
      case 'question': {
        const ls3 = getCurLesson();
        if (!ls3) break;
        const q: Question = {
          id: uid('q'),
          bookId,
          lessonId: ls3.id,
          text: cleanText(l.text),
          level: qLevel(l.text),
          page: l.page,
          provenance: 'book',
        };
        questions.push(q);
        break;
      }
      case 'body':
      default:
        break;
    }
  }

  /* 6b) بذرة الفهرس (كتاب «المسار»): شجرة مُتحقَّق منها من فهرس الكتاب نفسه */
  const seedLessonIds = new Set<string>();
  if (meta.seed) {
    units.length = 0;
    chapters.length = 0;
    lessons.length = 0;
    sections.length = 0;
    subsections.length = 0;
    activities.length = 0;
    for (const su of meta.seed.units) {
      const u: BookUnit = {
        id: uid('unit'),
        bookId,
        title: su.title,
        kind: su.kind ?? 'unit',
        order: units.length + 1,
        pageStart: su.pageStart,
        pageEnd: su.pageEnd,
      };
      units.push(u);
      for (const sa of su.axes) {
        const c: Chapter = {
          id: uid('chap'),
          bookId,
          unitId: u.id,
          title: sa.title,
          order: chapters.filter((x) => x.unitId === u.id).length + 1,
          pageStart: sa.pageStart,
          pageEnd: sa.pageEnd,
        };
        chapters.push(c);
        for (const sl of sa.lessons) {
          const ls: Lesson = {
            id: uid('les'),
            bookId,
            unitId: u.id,
            chapterId: c.id,
            title: sl.title,
            order: lessons.filter((x) => x.chapterId === c.id).length + 1,
            level: meta.seed!.level,
            subject: su.subject,
            pageStart: sl.pageStart,
            pageEnd: sl.pageEnd,
            problemExplicit: false,
          };
          lessons.push(ls);
          seedLessonIds.add(ls.id);
        }
      }
    }
    // إعادة ربط المحتويات المجمّعة (وثائق/أسئلة/مفاهيم) بدروس البذرة حسب الصفحة
    const seedLessonAt = (page: number) =>
      lessons.find((l) => seedLessonIds.has(l.id) && page >= l.pageStart && page <= l.pageEnd);
    for (const d of docs) {
      const l = seedLessonAt(d.page);
      if (l) d.lessonId = l.id;
    }
    for (let i = questions.length - 1; i >= 0; i--) {
      const q = questions[i];
      if (q.page === undefined) continue;
      const l = seedLessonAt(q.page);
      if (!l) questions.splice(i, 1);
    }
    for (let i = concepts.length - 1; i >= 0; i--) {
      const c = concepts[i];
      if (c.page === undefined) continue;
      const l = seedLessonAt(c.page);
      if (l) c.lessonId = l.id;
    }
  }

  // ضبط نهاية كل درس (الدروس من البذرة لها نهايات معلومة بدقة)
  for (let i = 0; i < lessons.length; i++) {
    if (seedLessonIds.has(lessons[i].id)) continue;
    const endPage = i + 1 < lessons.length ? lessons[i + 1].pageStart - 1 : numPages;
    lessons[i].pageEnd = Math.max(lessons[i].pageStart, Math.max(1, endPage));
  }
  // ضبط نهايات الوحدات والمحاور
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const uLessons = lessons.filter((x) => x.unitId === u.id);
    if (uLessons.length) {
      u.pageEnd = uLessons[uLessons.length - 1].pageEnd;
    } else {
      const next = i + 1 < units.length ? units[i + 1] : undefined;
      u.pageEnd = next?.pageStart ? Math.max(1, next.pageStart - 1) : numPages;
    }
  }
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    const cLessons = lessons.filter((x) => x.chapterId === c.id);
    c.pageEnd = cLessons.length ? cLessons[cLessons.length - 1].pageEnd : c.pageStart || numPages;
  }

  /* 7) استخراج مضامين الدرس: مقدمة، إشكالية، خلاصة، مفاهيم، أنشطة */
  const linesByPage = new Map<number, ClassLine[]>();
  for (const l of classLines) {
    const arr = linesByPage.get(l.page) || [];
    arr.push(l);
    linesByPage.set(l.page, arr);
  }

  for (const lesson of lessons) {
    const lLines: ClassLine[] = [];
    for (let p = lesson.pageStart; p <= lesson.pageEnd; p++) {
      const arr = linesByPage.get(p) || [];
      // العناوين (مبحث/عنوان فرعي/رأس...) تدخل كعلامات توقف عند جمع المحتوى
      lLines.push(
        ...arr.filter(
          (x) =>
            x.kind === 'body' ||
            x.kind === 'question' ||
            x.kind === 'subsection' ||
            x.kind === 'section' ||
            x.kind === 'unit' ||
            x.kind === 'axis' ||
            x.kind === 'caption'
        )
      );
    }
    // المقدمة: بعد عنوان «أمهد لتعلماتي/تمهيد» إن وُجد، وإلا أول فقرة طويلة
    const amhedIdx = lLines.findIndex(
      (x) => /أمهد|تمهيد|أستذكر/.test(x.text) && x.text.length < 40
    );
    const paraSource = amhedIdx >= 0 ? lLines.slice(amhedIdx + 1) : lLines;
    const firstPara = paragraphsOf(paraSource).find(
      (t) => t.length >= 40 && !/أهداف|اهداف/.test(t.slice(0, 40))
    );
    if (firstPara) lesson.intro = firstPara;

    // الإشكالية: جملة استفهامية في أول الدرس أو بعد عنوان "الإشكالية"
    const probIdx = lLines.findIndex((x) => x.kind === 'subsection' && x.func === 'problem');
    let problemText = '';
    if (probIdx >= 0) {
      // نأخذ الأسطر التالية (نص أو أسئلة) حتى عنوان آخر
      const following = leadingContent(lLines.slice(probIdx + 1))
        .slice(0, 4)
        .map((x) => x.text);
      problemText = following.join(' ');
    }
    if (!problemText) {
      // جملة استفهامية مبكرة (أول 15 سطراً)
      const early = lLines.slice(0, 20).filter((x) => x.kind === 'body');
      const qs = early.filter((x) => isInterrogativeSentence(x.text));
      if (qs.length) problemText = qs.map((x) => cleanText(x.text)).join(' ');
    }
    if (problemText.trim().length >= 15) {
      lesson.problem = cleanText(problemText);
      lesson.problemExplicit = true;
    } else {
      lesson.problemExplicit = false;
    }

    // الخلاصة / الاستنتاج
    const sumIdx = lLines.findIndex((x) => x.kind === 'subsection' && (x.func === 'summary' || x.func === 'conclusion'));
    if (sumIdx >= 0) {
      const following = lLines
        .slice(sumIdx + 1)
        .filter((x) => x.kind === 'body')
        .slice(0, 6)
        .map((x) => x.text);
      const txt = following.join(' ').trim();
      if (txt.length >= 30) {
        const isConclusion = lLines[sumIdx].func === 'conclusion';
        if (isConclusion) lesson.conclusion = txt;
        else lesson.summary = txt;
      }
    } else {
      // آخر فقرة طويلة قبل نهاية الدرس
      const paras = paragraphsOf(lLines);
      if (paras.length >= 3) {
        const last = paras[paras.length - 1];
        if (last.length >= 60 && /خلاصة|استنتاج|نستخلص|نتوصل|يخلص|نتج عن ذلك/.test(last)) {
          lesson.summary = last;
        }
      }
    }

    // المفاهيم: بعد عنوان "المفاهيم"
    const cIdx = lLines.findIndex((x) => x.kind === 'subsection' && x.func === 'concepts');
    if (cIdx >= 0) {
      const following = lLines
        .slice(cIdx + 1)
        .filter((x) => x.kind === 'body')
        .slice(0, 12);
      for (const f of following) {
        const parsed = parseConceptLine(f.text, f.page);
        if (parsed) {
          concepts.push({
            id: uid('cnc'),
            bookId,
            lessonId: lesson.id,
            term: parsed.term,
            definition: parsed.def,
            page: f.page,
            kind: 'explicit',
          });
        }
      }
    }

    // الأنشطة: أسطر أوامر تعليمية (نشاط/تطبيق أو صيغ أمر مثل اقرأ/استخرج/حلل/قارن)
    for (const x of lLines) {
      const isActivityLine =
        ((x.kind === 'body' || x.kind === 'question') && isImperative(x.text)) ||
        (x.kind === 'subsection' && x.func === 'activity');
      if (isActivityLine && x.text.length < 200) {
        const instr = cleanText(x.text.replace(/^(نشاط|الأنشطة|تطبيق|تمرين)\s*[:：]?\s*/i, ''));
        if (instr.length >= 15) {
          activities.push({
            id: uid('act'),
            bookId,
            lessonId: lesson.id,
            title: x.kind === 'subsection' || /^نشاط/.test(x.text) ? 'نشاط من الكتاب' : 'تمرين من الكتاب',
            instruction: instr,
            page: x.page,
            provenance: 'book',
          });
        }
      }
    }
  }

  // إزالة تكرار المفاهيم
  const seen = new Set<string>();
  const uniqueConcepts = concepts.filter((c) => {
    const k = `${c.term}|${c.page}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  /* 8) سجل الصفحات */
  const pages: PageRecord[] = [];
  for (let p = 1; p <= numPages; p++) {
    const txt = cleanText((pageTexts[p - 1] || []).join(' '));
    pages.push({
      id: `pg_${bookId}_${p}`,
      bookId,
      pageNum: p,
      text: txt,
      readable: txt.trim().length > 0,
      headingTitles: classLines.filter((l) => l.page === p && l.kind !== 'body' && l.kind !== 'noise' && l.kind !== 'question' && l.kind !== 'caption').map((l) => l.text),
    });
  }

  onProgress(numPages, numPages, 'بناء الفهرس');

  /* 9) التقرير */
  const warnings: string[] = [];
  if (pagesScanned > 0) {
    warnings.push(`وجدت ${pagesScanned} صفحة مصورة لا تُقرأ نصياً — «تعذر استخراج هذا الجزء من النسخة المرفوعة»، لم يتم تخمين محتواه.`);
  }
  if (lessons.length === 0) {
    warnings.push('لم يُعثر على دروس بصيغة «الدرس» في هذه النسخة — يمكن تهيئة البنية يدوياً من وحدة «فهرس الكتاب المدرسي».');
  }
  if (tocPages.size > 0) {
    warnings.push(`تم تجاهل ${tocPages.size} صفحة فهارس/جدول محتويات لتفادي تكرار العناوين.`);
  }
  if (reversedLines > 0) {
    warnings.push(`تم اكتشاف ${reversedLines} سطراً مخزَّناً بالترتيب البصري في PDF وإعادته للترتيب المنطقي تلقائياً.`);
  }
  if (ocrPagesUsed > 0) {
    warnings.push(
      `هذا الكتاب يستخدم ترميز خطوط غير قياسي تجعل طبقة النص غير قابلة للقراءة — استُخرج النص تلقائياً عبر تقنية OCR من نفس الصفحات (${ocrPagesUsed}/${numPages}).`
    );
  }
  if (meta.seed) {
    warnings.push('وُيّه فهرس الكتاب (المجزوءات/المحاور/الدروس وأرقام الصفحات) اعتماداً على فهرس الكتاب نفسه (ص 215–216) والتحقق من الصفحات الداخلية — يُنصح بمراجعته.');
    warnings.push('تنبيه: في النسخة المرفوعة ينتهي قسم الجغرافيا عند الصفحة 208 (لائحة الصيغ والرموز) بينما يذكر الفهرس دروساً لاحقة — النسخة قد تكون غير مكتملة.');
  }

  const report: ExtractionReport = {
    ok: lessons.length > 0 || units.length > 0,
    pagesTotal: numPages,
    pagesReadable: numPages - pagesScanned,
    pagesScanned,
    lessonsFound: lessons.length,
    sectionsFound: sections.length,
    conceptsFound: uniqueConcepts.length,
    docsFound: docs.length,
    questionsFound: questions.length,
    warnings,
  };

  return {
    book: {
      id: bookId,
      title: docTitle || 'كتاب الجغرافيا',
      subject: 'الجغرافيا',
      level: 'الثانية باكالوريا',
      fileName,
      fileSize,
      pageCount: numPages,
      status: 'ready',
      uploadedAt: Date.now(),
    },
    units,
    chapters,
    lessons,
    sections,
    subsections,
    concepts: uniqueConcepts,
    docs,
    activities,
    questions,
    pages,
    report,
  };
}

/**
 * الاستخراج من ملف PDF كامل: يقرأ طبقة النص بـ pdfjs، ويكتشف تلقائياً
 * الطبقات المشفرة (نسبة الحروف العربية) فيقرأ من طبقة OCR إن وجدت.
 */
export async function extractFromBuffer(
  bookId: string,
  fileName: string,
  fileSize: number,
  data: ArrayBuffer,
  meta: { title?: string; ocr?: OcrLayer; seed?: BookSeed },
  onProgress: ProgressFn
): Promise<ExtractBundle> {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
  const numPages = doc.numPages;

  let docTitle = meta.title || '';
  try {
    const m = await doc.getMetadata();
    const info = m.info as { Title?: string };
    if (info.Title && info.Title.trim().length > 3) docTitle = info.Title.trim();
  } catch {
    /* العنوان غير متاح */
  }

  const getWords: PageWords = async (p) => {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items.filter((it) => 'str' in it) as Array<{
      str: string;
      transform: number[];
      fontName: string;
    }>;
    // كشف الطبقة المشفرة: نسبة الحروف العربية منخفضة + توجد طبقة OCR
    const rawText = items.map((it) => it.str).join(' ');
    const ratio = arabicRatio(rawText);
    const ocrWords = meta.ocr?.pages[String(p)];
    if (ocrWords && ocrWords.length > 0 && ratio < 0.2) {
      return {
        words: ocrWords.map(([t, x, y, , h]) => ({ str: t, x, y, size: h * 0.8, font: 'ocr', flipped: false })),
        ocrUsed: true,
      };
    }
    if (!items.length) return null;
    const words: Word[] = [];
    for (const it of items) {
      let str = it.str;
      if (!str.trim()) continue;
      const flipped = it.transform[0] < 0;
      if (flipped) str = [...str].reverse().join('');
      const size = Math.abs(it.transform[3] || it.transform[0] || 10);
      words.push({ str, x: it.transform[4], y: it.transform[5], size, font: it.fontName, flipped });
    }
    if (!words.length) return null;
    return { words, ocrUsed: false };
  };

  return extractCore(bookId, fileName, fileSize, numPages, docTitle, getWords, meta, onProgress);
}

/**
 * الاستخراج من طبقة OCR + الفهرس فقط (بدون ملف PDF).
 * يُستخدم عندما يتعذر جلب ملف الـ PDF (حجمه كبير/اتصال) — المحتوى
 * والفهرس متماثلان تماماً، ويتعطل فقط عرض الصفحة الأصلية المصورة.
 */
export async function extractFromOcr(
  bookId: string,
  fileName: string,
  ocr: OcrLayer,
  meta: { title?: string; seed?: BookSeed },
  onProgress: ProgressFn
): Promise<ExtractBundle> {
  const ocrPages = Object.keys(ocr.pages).map(Number);
  const maxOcr = ocrPages.length ? Math.max(...ocrPages) : 1;
  const seedMax = meta.seed ? Math.max(0, ...meta.seed.units.map((u) => u.pageEnd)) : 0;
  const numPages = Math.max(maxOcr, seedMax, 1);

  const getWords: PageWords = async (p) => {
    const ocrWords = ocr.pages[String(p)];
    if (!ocrWords || !ocrWords.length) return null;
    return {
      words: ocrWords.map(([t, x, y, , h]) => ({ str: t, x, y, size: h * 0.8, font: 'ocr', flipped: false })),
      ocrUsed: true,
    };
  };

  const bundle = await extractCore(bookId, fileName, 0, numPages, meta.title || fileName, getWords, { ...meta, ocr }, onProgress);
  bundle.book.pdfMissing = true;
  return bundle;
}

/* ---------- أدوات مساعدة داخلية ---------- */

/**
 * بعض مولدات PDF تخزّن النص العربي بالترتيب البصري (معكوس) بدون مصفوفة سالبة.
 * نكشف ذلك عبر:
 *  1) سؤال استفهامي في أول السطر (؟...) — يستحيل في الترتيب المنطقي
 *  2) نهاية السطر بكلمة معكوسة من علامات بداية العناوين (مثال: "يتابرخ" = خريطة معكوسة)
 */
const LOGICAL_LEADERS = [
  'الوحدة', 'المجال', 'المحور', 'الدرس', 'المبحث', 'المفاهيم', 'المصطلحات', 'معجم',
  'الإشكالية', 'إشكالية', 'الخلاصة', 'خلاصة', 'الاستنتاجات', 'الاستنتاج', 'الخاتمة',
  'مقدمة', 'تمهيد', 'التمهيد', 'نشاط', 'الأنشطة', 'تطبيق',
  'خريطة', 'مبيان', 'جدول', 'وثيقة', 'شكل', 'نص', 'صورة', 'مصدر',
  'التنقيط', 'سلم', 'الفهرس', 'المحتويات', 'فرض', 'الدرس',
];
const revWord = (w: string) => [...w].reverse().join('');
const LEADER_RE = new RegExp(`^(${LOGICAL_LEADERS.join('|')})`);
const TAIL_RE = new RegExp(`(${LOGICAL_LEADERS.map(revWord).join('|')})$`);

function maybeReverseVisualLine(text: string): string {
  if (text.length > 220 || text.length < 4) return text;
  const t = text.trim();
  // علامة حاسمة: سطر يبدأ بعلامة استفهام → مخزّن بالترتيب البصري
  if (t.startsWith('؟') || t.startsWith('?')) {
    return [...t].reverse().join('');
  }
  if (!isArabic(t)) return text;
  if (LEADER_RE.test(t)) return text; // يبدأ بعلامة بداية منطقية → الترتيب صحيح
  if (TAIL_RE.test(t)) {
    return [...t].reverse().join('');
  }
  // إشارة نحوية: حرف "ة" لا يأتي أبداً في بداية كلمة عربية صحيحة؛
  // وجوده في بدايات الكلمات يعني أن السطر مخزّن بالترتيب البصري.
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    const startsTa = words.filter((w) => w[0] === 'ة').length;
    const endsLa = words.filter((w) => w.length >= 3 && w.endsWith('لا')).length;
    const endsTa = words.filter((w) => w.endsWith('ة')).length;
    if (startsTa > 0 || (endsLa >= 2 && endsLa > endsTa)) {
      return [...t].reverse().join('');
    }
  }
  return text;
}

function paragraphsOf(lines: ClassLine[]): string[] {
  const paras: string[] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (l.kind === 'body') {
      cur.push(l.text.trim());
    } else {
      if (cur.length) {
        paras.push(cur.join(' '));
        cur = [];
      }
    }
  }
  if (cur.length) paras.push(cur.join(' '));
  return paras;
}

function isInterrogativeSentence(t: string): boolean {
  const s = normalizeDigits(cleanText(t));
  return (
    (s.includes('؟') || s.includes('?')) &&
    /^(ما|ماذا|هل|لماذا|كيف|إلى أي|ما مدى|أين|متى|من أي)/.test(s)
  );
}

const IMPERATIVE =
  /^(حلّل|حلل|اشرح|فسّر|فسر|علّل|علل|قارن|استخرج|اذكر|أعطِ|أعط|رسم|ارسم|قوّم|قيّم|استنتج|حلّل|املأ|اعتماداً|بالاستعانة|من خلال|عبر قراءة|قراءة|تعليق|تعليقاً)/;
function isImperative(t: string): boolean {
  return IMPERATIVE.test(normalizeDigits(t.trim()));
}

function qLevel(text: string): QuestionLevel {
  const t = normalizeDigits(text);
  if (/^(عرّف|تعريف|ما هو تعريف)/.test(t)) return 'comprehension';
  if (/استخرج/.test(t)) return 'extraction';
  if (/قارن|حلّل|حلل|تحليل/.test(t)) return 'analysis';
  if (/علّل|علل|فسّر|فسر|لماذا/.test(t)) return 'interpretation';
  if (/تركيب|استنتاج|اكتب مقالاً/.test(t)) return 'synthesis';
  return 'comprehension';
}

/** نسبة الحروف العربية من مجموع الحروف (لكشف الطبقات النصية المشفّرة) */
function arabicRatio(text: string): number {
  if (!text) return 0;
  let ar = 0;
  let letters = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) || 0;
    const isArabic =
      (c >= 0x0600 && c <= 0x06ff) ||
      (c >= 0x0750 && c <= 0x077f) ||
      (c >= 0xfb50 && c <= 0xfdff) ||
      (c >= 0xfe70 && c <= 0xfeff);
    const isLatin = (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || (c >= 0xc0 && c <= 0x24f);
    if (isArabic) ar++;
    if (isArabic || isLatin) letters++;
  }
  return letters ? ar / letters : 0;
}

/** الأسطر المتتالية من المحتوى (نص/أسئلة) متجاهلة الضجيج، وتتوقف عند أول عنوان */
function leadingContent(lines: ClassLine[]): ClassLine[] {
  const out: ClassLine[] = [];
  for (const l of lines) {
    if (l.kind === 'body' || l.kind === 'question') out.push(l);
    else if (l.kind === 'noise') continue;
    else break;
  }
  return out;
}

function parseConceptLine(text: string, page: number): { term: string; def: string } | null {
  void page;
  // نُبقي \u0000 (رمز ناقص قد يكون فاصلة) ولا نستبدله قبل مطابقة الفاصل
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length < 20 || t.length > 400) return null;
  // "المصطلح: التعريف" أو "المصطلح — التعريف" (المصطلح قد يتكون من عدة كلمات)
  const m = t.match(/^([أ-يA-Za-z][أ-يA-Za-z\s]{1,60}?)\s*[:：\-—ـ\u0000]\s*(.{15,350})$/);
  if (m) {
    const term = cleanText(m[1]);
    const def = cleanText(m[2]);
    // المصطلح يجب أن يحتوي حروفاً عربية (معجم الكتاب عربي)
    if (!term || def.length < 15 || !/[؀-ۿ]/.test(term)) return null;
    return { term, def };
  }
  return null;
}
