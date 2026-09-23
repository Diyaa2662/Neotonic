import { useTranslation } from "react-i18next";
import { Bell, User } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header
      className="h-16 bg-white border-b border-border flex items-center
                       justify-between px-6 sticky top-0 z-30"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <div className="leading-tight">
          <h1 className="font-bold text-secondary-900">{t("app.name")}</h1>
          <p className="text-xs text-secondary-500">{t("app.tagline")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <button
          className="relative p-2 rounded-md text-secondary-600
                     hover:text-primary hover:bg-primary-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-danger" />
        </button>

        <button
          className="p-2 rounded-md text-secondary-600
                     hover:text-primary hover:bg-primary-50 transition-colors"
          aria-label={t("header.profile")}
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
