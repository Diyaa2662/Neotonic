import { useTranslation } from "react-i18next";
import { Construction } from "lucide-react";

export default function Placeholder({ titleKey, groupKey }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium text-secondary-500 mb-1">
          {t(`nav.groups.${groupKey}`)}
        </p>
        <h2 className="text-2xl font-bold text-secondary-900">
          {t(`nav.items.${titleKey}`)}
        </h2>
      </div>

      <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
          <Construction size={28} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-secondary-800 mb-1">
            هذه الصفحة قيد التطوير
          </h3>
          <p className="text-sm text-secondary-500 max-w-md">
            سيتم تصميم هذه الصفحة في خطوة لاحقة. حالياً هذه صفحة مؤقتة للتحقق من
            المسارات.
          </p>
        </div>
      </div>
    </div>
  );
}
