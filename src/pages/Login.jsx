import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Lock, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username: username.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError(t("login.errors.invalidCredentials"));
      } else if (status === 400) {
        setError(t("login.errors.badRequest"));
      } else if (!err.response) {
        setError(t("login.errors.networkError"));
      } else {
        setError(t("login.errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* الجهة اليمنى: نموذج الدخول */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* الشعار */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-xl text-secondary-900">
                {t("app.name")}
              </h1>
              <p className="text-xs text-secondary-500">{t("app.tagline")}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-secondary-900 mb-1">
            {t("login.title")}
          </h2>
          <p className="text-sm text-secondary-500 mb-6">
            {t("login.subtitle")}
          </p>

          {/* رسالة الخطأ */}
          {error && (
            <div
              className="mb-4 flex items-start gap-2 p-3 rounded-md
                            bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* اسم المستخدم */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                {t("login.username")}
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full ps-10 pe-3 py-2.5 rounded-md border border-border
                             bg-white text-secondary-900 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30
                             focus:border-primary transition"
                  placeholder={t("login.usernamePlaceholder")}
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                {t("login.password")}
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full ps-10 pe-3 py-2.5 rounded-md border border-border
                             bg-white text-secondary-900 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30
                             focus:border-primary transition"
                  placeholder={t("login.passwordPlaceholder")}
                />
              </div>
            </div>

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-md
                         bg-primary text-white text-sm font-semibold
                         hover:bg-primary-700 transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              <span>{loading ? t("login.submitting") : t("login.submit")}</span>
            </button>
          </form>
        </div>
      </div>

      {/* الجهة اليسرى: لوحة تسويقية (تختفي على الجوال) */}
      {/* الجهة اليسرى: لوحة تسويقية */}
      <div
        className="hidden lg:flex w-1/2 bg-primary text-white
                      items-center justify-center p-12 relative overflow-hidden"
      >
        <div className="absolute top-6 end-6 z-20">
          <LanguageSwitcher variant="light" />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4">{t("login.heroTitle")}</h2>
          <p className="text-primary-100 leading-relaxed">
            {t("login.heroText")}
          </p>
        </div>
        {/* زخرفة خفيفة - pointer-events-none حتى لا تحجب النقرات */}
        <div className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -top-32 -end-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      </div>
    </div>
  );
}
