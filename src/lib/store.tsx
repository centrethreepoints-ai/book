// مخزن الحالة المركزي — يربط IndexedDB بواجهة React
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  idbGetAll,
  idbGet,
  idbPut,
  idbStoreAll,
  idbClear,
  idbDelete,
  storePdf,
  loadPdf,
} from './db';
import { extractFromBuffer, extractFromOcr, uid } from './extractor';
import type { OcrLayer } from './extractor';
import { ALMASAR_SEED } from './seedAlmasar';
import { buildDemoData } from './demo';
import { AUTO_BOOK_FILE, AUTO_BOOK_KEY, AUTO_BOOK_OCR_URL, AUTO_BOOK_TITLE, AUTO_BOOK_URL, AUTO_BOOK_IDLE, type AutoBookState } from './autoBook';
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
  Answer,
  Worksheet,
  Test,
  PageRecord,
  AppSettings,
  DiagnosticQuiz,
  DiagnosticResult,
  ExtractionReport,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface AppState {
  loading: boolean;
  book?: Book;
  units: BookUnit[];
  chapters: Chapter[];
  lessons: Lesson[];
  sections: Section[];
  subsections: Subsection[];
  concepts: Concept[];
  docs: DocRef[];
  activities: Activity[];
  questions: Question[];
  answers: Answer[];
  worksheets: Worksheet[];
  tests: Test[];
  pages: PageRecord[];
  diagnostics: DiagnosticQuiz[];
  diagResults: DiagnosticResult[];
  settings: AppSettings;
  report?: ExtractionReport;
  isDemo: boolean;
  autoBook: AutoBookState;
}

type Action =
  | { type: 'HYDRATE'; state: Partial<AppState> }
  | { type: 'SET_BOOK'; book?: Book; isDemo: boolean; report?: ExtractionReport }
  | { type: 'SET_STRUCTURE'; units: BookUnit[]; chapters: Chapter[]; lessons: Lesson[]; sections: Section[]; subsections: Subsection[]; concepts: Concept[]; docs: DocRef[]; activities: Activity[]; questions: Question[]; pages: PageRecord[] }
  | { type: 'PATCH_LESSON'; lesson: Lesson }
  | { type: 'PATCH_CONCEPT'; concept: Concept }
  | { type: 'ADD_CONCEPT'; concept: Concept }
  | { type: 'PATCH_DOC'; doc: DocRef }
  | { type: 'ADD_DOC'; doc: DocRef }
  | { type: 'PATCH_UNIT'; unit: BookUnit }
  | { type: 'PATCH_CHAPTER'; chapter: Chapter }
  | { type: 'SAVE_WORKSHEET'; ws: Worksheet }
  | { type: 'DELETE_WORKSHEET'; id: string }
  | { type: 'SAVE_TEST'; test: Test }
  | { type: 'DELETE_TEST'; id: string }
  | { type: 'SAVE_DIAG'; diag: DiagnosticQuiz }
  | { type: 'DELETE_DIAG'; id: string }
  | { type: 'SAVE_DIAG_RESULT'; result: DiagnosticResult }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'AUTO_BOOK'; state: AutoBookState }
  | { type: 'DELETE_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.state, loading: false };
    case 'SET_BOOK':
      return { ...state, book: action.book, isDemo: action.isDemo, report: action.report };
    case 'SET_STRUCTURE':
      return { ...state, ...action };
    case 'PATCH_LESSON':
      return { ...state, lessons: state.lessons.map((l) => (l.id === action.lesson.id ? action.lesson : l)) };
    case 'PATCH_CONCEPT':
      return { ...state, concepts: state.concepts.map((c) => (c.id === action.concept.id ? action.concept : c)) };
    case 'ADD_CONCEPT':
      return { ...state, concepts: [...state.concepts, action.concept] };
    case 'PATCH_DOC':
      return { ...state, docs: state.docs.map((d) => (d.id === action.doc.id ? action.doc : d)) };
    case 'ADD_DOC':
      return { ...state, docs: [...state.docs, action.doc] };
    case 'PATCH_UNIT':
      return { ...state, units: state.units.map((u) => (u.id === action.unit.id ? action.unit : u)) };
    case 'PATCH_CHAPTER':
      return { ...state, chapters: state.chapters.map((c) => (c.id === action.chapter.id ? action.chapter : c)) };
    case 'SAVE_WORKSHEET': {
      const exists = state.worksheets.some((w) => w.id === action.ws.id);
      return {
        ...state,
        worksheets: exists
          ? state.worksheets.map((w) => (w.id === action.ws.id ? action.ws : w))
          : [...state.worksheets, action.ws],
      };
    }
    case 'DELETE_WORKSHEET':
      return { ...state, worksheets: state.worksheets.filter((w) => w.id !== action.id) };
    case 'SAVE_TEST': {
      const exists = state.tests.some((t) => t.id === action.test.id);
      return {
        ...state,
        tests: exists ? state.tests.map((t) => (t.id === action.test.id ? action.test : t)) : [...state.tests, action.test],
      };
    }
    case 'DELETE_TEST':
      return { ...state, tests: state.tests.filter((t) => t.id !== action.id) };
    case 'SAVE_DIAG': {
      const exists = state.diagnostics.some((d) => d.id === action.diag.id);
      return {
        ...state,
        diagnostics: exists ? state.diagnostics.map((d) => (d.id === action.diag.id ? action.diag : d)) : [...state.diagnostics, action.diag],
      };
    }
    case 'DELETE_DIAG':
      return { ...state, diagnostics: state.diagnostics.filter((d) => d.id !== action.id) };
    case 'SAVE_DIAG_RESULT':
      return { ...state, diagResults: [...state.diagResults, action.result] };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'AUTO_BOOK':
      return { ...state, autoBook: action.state };
    case 'DELETE_ALL':
      return { ...state, book: undefined, isDemo: false, report: undefined, units: [], chapters: [], lessons: [], sections: [], subsections: [], concepts: [], docs: [], activities: [], questions: [], answers: [], worksheets: [], tests: [], pages: [], diagnostics: [], diagResults: [] };
    default:
      return state;
  }
}

const initialState: AppState = {
  loading: true,
  units: [],
  chapters: [],
  lessons: [],
  sections: [],
  subsections: [],
  concepts: [],
  docs: [],
  activities: [],
  questions: [],
  answers: [],
  worksheets: [],
  tests: [],
  pages: [],
  diagnostics: [],
  diagResults: [],
  settings: { ...DEFAULT_SETTINGS },
  autoBook: AUTO_BOOK_IDLE,
  isDemo: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // أفعال مركبة
  hydrate: () => Promise<void>;
  uploadPdf: (file: File, onProgress: (done: number, total: number, stage: string) => void) => Promise<ExtractionReport>;
  loadDemo: () => Promise<void>;
  deleteAll: () => Promise<void>;
  saveLesson: (lesson: Lesson) => Promise<void>;
  saveConcept: (concept: Concept) => Promise<void>;
  saveDoc: (doc: DocRef) => Promise<void>;
  saveUnit: (u: BookUnit) => Promise<void>;
  saveChapter: (c: Chapter) => Promise<void>;
  saveWorksheet: (ws: Worksheet) => Promise<void>;
  deleteWorksheet: (id: string) => Promise<void>;
  saveTest: (t: Test) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  saveDiagnostic: (d: DiagnosticQuiz) => Promise<void>;
  deleteDiagnostic: (id: string) => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
  pdfBuffer: (bookId: string) => Promise<ArrayBuffer | undefined>;
}>(null as never);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const hydrate = useCallback(async () => {
    try {
      const [books, units, chapters, lessons, sections, subsections, concepts, docs, activities, questions, answers, worksheets, tests, pages, diagnostics, diagResults, settingsRow, demoRow, reportRow] = await Promise.all([
        idbGetAll<Book>('books'),
        idbGetAll<BookUnit>('units'),
        idbGetAll<Chapter>('chapters'),
        idbGetAll<Lesson>('lessons'),
        idbGetAll<Section>('sections'),
        idbGetAll<Subsection>('subsections'),
        idbGetAll<Concept>('concepts'),
        idbGetAll<DocRef>('documents'),
        idbGetAll<Activity>('activities'),
        idbGetAll<Question>('questions'),
        idbGetAll<Answer>('answers'),
        idbGetAll<Worksheet>('worksheets'),
        idbGetAll<Test>('tests'),
        idbGetAll<PageRecord>('pages'),
        idbGetAll<DiagnosticQuiz>('diagnostics'),
        idbGetAll<DiagnosticResult>('demo'), // نتائج التقويم المخزنة تحت demo لتفادي تعارض اسم
        idbGet<AppSettings>('settings', 'app'),
        idbGet<{ id: string }>('demo', 'flag'),
        idbGet<{ id: string; report: ExtractionReport }>('settings', 'report'),
      ]);
      const active = books.find((b) => !b.isDemo) || books[0];
      dispatch({
        type: 'HYDRATE',
        state: {
          book: active,
          units,
          chapters,
          lessons,
          sections,
          subsections,
          concepts,
          docs: docs,
          activities,
          questions,
          answers,
          worksheets,
          tests,
          pages,
          diagnostics,
          diagResults: (diagResults as unknown as DiagnosticResult[]).filter((r) => r && r.quizId),
          settings: settingsRow || { ...DEFAULT_SETTINGS },
          report: reportRow?.report,
          isDemo: Boolean(active?.isDemo || (demoRow && !books.find((b) => !b.isDemo))),
        },
      });
    } catch (e) {
      console.error('hydrate', e);
      dispatch({ type: 'HYDRATE', state: { settings: { ...DEFAULT_SETTINGS } } });
    }
  }, []);

  /** حفظ حزمة كتاب مستخرجة في IndexedDB وتحديث الحالة */
  const persistBundle = useCallback(async (bundle: Awaited<ReturnType<typeof extractFromBuffer>>) => {
    // مسح أي كتاب سابق ومحتواه المشتق
    const stores = ['books', 'units', 'chapters', 'lessons', 'sections', 'subsections', 'concepts', 'documents', 'activities', 'questions', 'answers', 'worksheets', 'lesson_plans', 'tests', 'test_questions', 'corrections', 'pages', 'sources', 'diagnostics', 'pdfs'];
    await Promise.all(stores.map((s) => idbClear(s as never)));
    await Promise.all([
      idbStoreAll('books', [bundle.book]),
      idbStoreAll('units', bundle.units),
      idbStoreAll('chapters', bundle.chapters),
      idbStoreAll('lessons', bundle.lessons),
      idbStoreAll('sections', bundle.sections),
      idbStoreAll('subsections', bundle.subsections),
      idbStoreAll('concepts', bundle.concepts),
      idbStoreAll('documents', bundle.docs),
      idbStoreAll('activities', bundle.activities),
      idbStoreAll('questions', bundle.questions),
      idbStoreAll('pages', bundle.pages),
      idbPut('settings', { id: 'report', report: bundle.report } as never),
    ]);
    dispatch({ type: 'DELETE_ALL' });
    dispatch({ type: 'SET_BOOK', book: bundle.book, isDemo: false, report: bundle.report });
    dispatch({
      type: 'SET_STRUCTURE',
      units: bundle.units,
      chapters: bundle.chapters,
      lessons: bundle.lessons,
      sections: bundle.sections,
      subsections: bundle.subsections,
      concepts: bundle.concepts,
      docs: bundle.docs,
      activities: bundle.activities,
      questions: bundle.questions,
      pages: bundle.pages,
    });
  }, []);

  const uploadPdf = useCallback(
    async (file: File, onProgress: (done: number, total: number, stage: string) => void) => {
      const bookId = uid('book');
      const data = await file.arrayBuffer();
      await storePdf(bookId, data.slice(0));
      const bundle = await extractFromBuffer(bookId, file.name, file.size, data, { title: DEFAULT_SETTINGS.bookTitle }, onProgress);
      await persistBundle(bundle);
      return bundle.report;
    },
    [persistBundle]
  );

  const loadDemo = useCallback(async () => {
    const bookId = uid('demo');
    const bundle = buildDemoData(bookId);
    await Promise.all([
      idbStoreAll('books', [bundle.book]),
      idbStoreAll('units', bundle.units),
      idbStoreAll('chapters', bundle.chapters),
      idbStoreAll('lessons', bundle.lessons),
      idbStoreAll('sections', bundle.sections),
      idbStoreAll('subsections', bundle.subsections),
      idbStoreAll('concepts', bundle.concepts),
      idbStoreAll('documents', bundle.docs),
      idbStoreAll('activities', bundle.activities),
      idbStoreAll('questions', bundle.questions),
      idbStoreAll('pages', bundle.pages),
    ]);
    dispatch({ type: 'SET_BOOK', book: bundle.book, isDemo: true });
    dispatch({
      type: 'SET_STRUCTURE',
      units: bundle.units,
      chapters: bundle.chapters,
      lessons: bundle.lessons,
      sections: bundle.sections,
      subsections: bundle.subsections,
      concepts: bundle.concepts,
      docs: bundle.docs,
      activities: bundle.activities,
      questions: bundle.questions,
      pages: bundle.pages,
    });
  }, []);

  const deleteAll = useCallback(async () => {
    const stores = ['books', 'units', 'chapters', 'lessons', 'sections', 'subsections', 'concepts', 'documents', 'maps', 'tables', 'charts', 'activities', 'questions', 'answers', 'worksheets', 'lesson_plans', 'tests', 'test_questions', 'corrections', 'pages', 'sources', 'diagnostics', 'pdfs', 'demo'];
    await Promise.all(stores.map((s) => idbClear(s as never)));
    localStorage.removeItem(AUTO_BOOK_KEY);
    dispatch({ type: 'DELETE_ALL' });
  }, []);

  const saveLesson = useCallback(async (lesson: Lesson) => {
    await idbPut('lessons', lesson);
    dispatch({ type: 'PATCH_LESSON', lesson });
  }, []);

  const saveConcept = useCallback(async (concept: Concept) => {
    await idbPut('concepts', concept);
    dispatch({ type: 'PATCH_CONCEPT', concept });
  }, []);

  const saveDoc = useCallback(async (doc: DocRef) => {
    await idbPut('documents', doc);
    dispatch({ type: 'PATCH_DOC', doc });
  }, []);

  const saveUnit = useCallback(async (unit: BookUnit) => {
    await idbPut('units', unit);
    dispatch({ type: 'PATCH_UNIT', unit });
  }, []);

  const saveChapter = useCallback(async (chapter: Chapter) => {
    await idbPut('chapters', chapter);
    dispatch({ type: 'PATCH_CHAPTER', chapter });
  }, []);

  const saveWorksheet = useCallback(async (ws: Worksheet) => {
    await idbPut('worksheets', ws);
    dispatch({ type: 'SAVE_WORKSHEET', ws });
  }, []);

  const deleteWorksheet = useCallback(async (id: string) => {
    await idbDelete('worksheets', id);
    dispatch({ type: 'DELETE_WORKSHEET', id });
  }, []);

  const saveTest = useCallback(async (t: Test) => {
    await idbPut('tests', t);
    dispatch({ type: 'SAVE_TEST', test: t });
  }, []);

  const deleteTest = useCallback(async (id: string) => {
    await idbDelete('tests', id);
    dispatch({ type: 'DELETE_TEST', id });
  }, []);

  const saveDiagnostic = useCallback(async (d: DiagnosticQuiz) => {
    await idbPut('diagnostics', d);
    dispatch({ type: 'SAVE_DIAG', diag: d });
  }, []);

  const deleteDiagnostic = useCallback(async (id: string) => {
    await idbDelete('diagnostics', id);
    dispatch({ type: 'DELETE_DIAG', id });
  }, []);

  const saveSettings = useCallback(async (s: AppSettings) => {
    await idbPut('settings', { id: 'app', ...s } as never);
    dispatch({ type: 'SET_SETTINGS', settings: s });
  }, []);

  const pdfBuffer = useCallback(async (bookId: string) => {
    return loadPdf(bookId);
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // دمج تلقائي: عند أول تشغيل بدون كتاب محمّل:
  //  1) نجلب طبقة النص (2 م.ب) — أساسية
  //  2) نحاول جلب ملف الـ PDF (15 م.ب) لعرض الصفحات الأصلية — إن تعذر،
  //     نكمل الاستخراج من طبقة النص وحدها (الدروس والتقويمات كاملة)
  const autoRan = React.useRef(false);
  useEffect(() => {
    if (state.loading || state.book || autoRan.current) return;
    autoRan.current = true;
    (async () => {
      const onProgress = (done: number, total: number, stage: string) =>
        dispatch({ type: 'AUTO_BOOK', state: { ...AUTO_BOOK_IDLE, status: 'extracting', done, total, stage } });
      const fetchWithTimeout = async (url: string, ms: number) => {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), ms);
        try {
          return await fetch(url, { cache: 'no-store', signal: ctl.signal });
        } finally {
          clearTimeout(t);
        }
      };
      try {
        dispatch({ type: 'AUTO_BOOK', state: { ...AUTO_BOOK_IDLE, status: 'fetching', stage: 'جلب طبقة النص من الخادم…' } });
        const ocrRes = await fetchWithTimeout(AUTO_BOOK_OCR_URL, 60000);
        if (!ocrRes.ok) throw new Error(`تعذر جلب طبقة النص (${ocrRes.status})`);
        const ocr = (await ocrRes.json()) as OcrLayer;

        // محاولة جلب الكتاب كاملاً (للمعاينة الأصلية للصفحات)
        let buf: ArrayBuffer | null = null;
        try {
          dispatch({ type: 'AUTO_BOOK', state: { ...AUTO_BOOK_IDLE, status: 'fetching', stage: 'جلب ملف الكتاب (15 م.ب) — قد يستغرق دقيقة…' } });
          const res = await fetchWithTimeout(AUTO_BOOK_URL, 180000);
          if (res.ok) buf = await res.arrayBuffer();
        } catch {
          /* نستمر بدون ملف PDF */
        }

        const bookId = uid('book');
        dispatch({ type: 'AUTO_BOOK', state: { ...AUTO_BOOK_IDLE, status: 'extracting', stage: 'قراءة الصفحات…' } });
        let bundle;
        if (buf) {
          await storePdf(bookId, buf.slice(0));
          bundle = await extractFromBuffer(bookId, AUTO_BOOK_FILE, buf.byteLength, buf, { title: AUTO_BOOK_TITLE, ocr, seed: ALMASAR_SEED }, onProgress);
        } else {
          bundle = await extractFromOcr(bookId, AUTO_BOOK_FILE, ocr, { title: AUTO_BOOK_TITLE, seed: ALMASAR_SEED }, onProgress);
        }
        await persistBundle(bundle);
        localStorage.setItem(AUTO_BOOK_KEY, bookId);
        dispatch({ type: 'AUTO_BOOK', state: AUTO_BOOK_IDLE });
      } catch (e) {
        dispatch({
          type: 'AUTO_BOOK',
          state: { ...AUTO_BOOK_IDLE, status: 'error', stage: '', error: e instanceof Error ? e.message : 'خطأ غير معروف' },
        });
      }
    })();
  }, [state.loading, state.book]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        hydrate,
        uploadPdf,
        loadDemo,
        deleteAll,
        saveLesson,
        saveConcept,
        saveDoc,
        saveUnit,
        saveChapter,
        saveWorksheet,
        deleteWorksheet,
        saveTest,
        deleteTest,
        saveDiagnostic,
        deleteDiagnostic,
        saveSettings,
        pdfBuffer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
