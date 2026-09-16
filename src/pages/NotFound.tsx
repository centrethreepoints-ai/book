import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card } from '../components/ui';

export function NotFound() {
  return (
    <Card className="max-w-md mx-auto text-center py-14">
      <Compass className="w-12 h-12 mx-auto text-manar-300" />
      <h1 className="text-xl font-extrabold text-manar-950 mt-4">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500 mt-2">الرابط الذي تحاول الوصول إليه غير متوفر في المنصة.</p>
      <Link to="/" className="inline-block mt-6 bg-manar-700 text-white text-sm font-bold rounded-xl px-6 py-3 hover:bg-manar-800 transition">
        العودة إلى لوحة التحكم
      </Link>
    </Card>
  );
}
