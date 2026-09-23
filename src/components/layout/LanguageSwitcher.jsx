import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  const toggle = () => {
    i18n.changeLanguage(isAr ? "en" : "ar");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                 text-secondary-600 hover:text-primary hover:bg-primary-50
                 transition-colors border border-border"
    >
      <Languages size={16} />
      <span>{isAr ? "EN" : "عربي"}</span>
    </button>
  );
}
