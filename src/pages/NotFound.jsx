import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-secondary-500">الصفحة غير موجودة</p>
      <Link
        to="/"
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
