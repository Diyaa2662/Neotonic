import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { navigationGroups } from "../../data/navigation";

function GroupSection({ group, isOpen, onToggle, isActiveGroup }) {
  const { t } = useTranslation();
  const { Icon } = group;

  return (
    <div className="mb-1">
      {/* رأس المجموعة */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md
                    text-sm font-semibold transition-colors
                    ${
                      isActiveGroup
                        ? "text-primary bg-primary-50/50"
                        : "text-secondary-700 hover:bg-secondary-50"
                    }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} strokeWidth={2} />
          <span>{t(`nav.groups.${group.key}`)}</span>
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* العناصر الفرعية */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out
                    ${isOpen ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}
      >
        <div className="flex flex-col gap-0.5 ps-4 pt-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-2 ps-3 pe-3 py-2 rounded-md text-sm
                 transition-colors
                 ${
                   isActive
                     ? "bg-primary-50 text-primary font-medium"
                     : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute start-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full
                                ${isActive ? "bg-primary" : "bg-transparent"}`}
                  />
                  <span className="truncate">{t(`nav.items.${item.key}`)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  // ✨ الإصلاح 1: حالة "المجموعة المفتوحة يدوياً" فقط
  // المجموعة النشطة تُحسب أثناء الـ render، لا تُخزَّن في state
  const [manuallyToggled, setManuallyToggled] = useState({});

  // المجموعة التي تحتوي المسار الحالي (تُحسب أثناء الـ render)
  const activeGroupKey = navigationGroups.find((group) =>
    group.items.some((item) => item.path === location.pathname),
  )?.key;

  // هل المجموعة مفتوحة؟ إذا لُمس زرها يدوياً نأخذ قرار المستخدم، وإلا نفتحها تلقائياً إن كانت نشطة
  const isGroupOpen = (key) => {
    if (key in manuallyToggled) return manuallyToggled[key];
    return key === activeGroupKey;
  };

  const toggleGroup = (key) => {
    setManuallyToggled((prev) => ({
      ...prev,
      [key]: !isGroupOpen(key),
    }));
  };

  return (
    <aside
      className="w-72 bg-white border-e border-border h-[calc(100vh-4rem)]
                      sticky top-16 overflow-y-auto"
    >
      <nav className="flex flex-col py-4 px-3">
        {/* لوحة التحكم */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold
             mb-3 transition-colors
             ${
               isActive
                 ? "bg-primary-50 text-primary border-s-2 border-primary"
                 : "text-secondary-700 hover:bg-secondary-50"
             }`
          }
        >
          <LayoutDashboard size={18} strokeWidth={2} />
          <span>{t("nav.dashboard")}</span>
        </NavLink>

        {/* فاصل */}
        <div className="border-t border-border mb-3" />

        {/* المجموعات */}
        {navigationGroups.map((group) => (
          <GroupSection
            key={group.key}
            group={group}
            isOpen={isGroupOpen(group.key)}
            onToggle={() => toggleGroup(group.key)}
            isActiveGroup={group.key === activeGroupKey}
          />
        ))}
      </nav>
    </aside>
  );
}
