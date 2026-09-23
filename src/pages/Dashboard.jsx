import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-900 mb-1">
        {t("nav.dashboard")}
      </h2>
      <p className="text-secondary-500 mb-6">{t("app.tagline")}</p>

      <div className="card p-8 text-center text-secondary-400">
        هذه الصفحة فارغة مؤقتاً — في انتظار تصميم لوحة التحكم
      </div>
    </div>
  );
}
