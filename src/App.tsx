import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { BookIndex } from './pages/BookIndex';
import { LessonsList } from './pages/LessonsList';
import { LessonPage } from './pages/LessonPage';
import { Worksheets } from './pages/Worksheets';
import { Tests } from './pages/Tests';
import { Exercises } from './pages/Exercises';
import { Documents } from './pages/Documents';
import { Visuals } from './pages/Visuals';
import { Concepts } from './pages/Concepts';
import { Evaluation } from './pages/Evaluation';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/book" element={<BookIndex />} />
        <Route path="/lessons" element={<LessonsList />} />
        <Route path="/lessons/:id" element={<LessonPage />} />
        <Route path="/worksheets" element={<Worksheets />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/tests/:id" element={<Tests />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/maps" element={<Visuals kind="map" />} />
        <Route path="/tables" element={<Visuals kind="table+chart" />} />
        <Route path="/concepts" element={<Concepts />} />
        <Route path="/evaluation" element={<Evaluation />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
