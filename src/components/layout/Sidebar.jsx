import { useState, useMemo, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, LayoutDashboard, Search, X } from "lucide-react";
import { navigationGroups } from "../../data/navigation";
import { useSidebar } from "../../contexts/useSidebar";

function GroupSection({ group, isOpen, onToggle, isActiveGroup, searchQuery }) {
  const { t } = useTranslation();
  const { Icon } = group;

  const visibleItems = useMemo(() => {
    if (!searchQuery.trim()) return group.items;
    const q = searchQuery.trim().toLowerCase();
    return group.items.filter((item) => {
      const labelAr = t(`nav.items.${item.key}`, { lng: "ar" }).toLowerCase();
      const labelEn = t(`nav.items.${item.key}`, { lng: "en" }).toLowerCase();
      return labelAr.includes(q) || labelEn.includes(q);
    });
  }, [group.items, searchQuery, t]);

  if (searchQuery.trim() && visibleItems.length === 0) return null;

  return (
    <div className="mb-1">
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
          {searchQuery.trim() && (
            <span className="text-xs font-normal text-secondary-400">
              ({visibleItems.length})
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out
                    ${isOpen ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}
      >
        <div className="flex flex-col gap-0.5 ps-4 pt-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={() => {
                // على الشاشات الصغيرة: أغلق السايد بار بعد اختيار الصفحة
                if (window.innerWidth < 1024) {
                  // سنستدعي close من context بعد قليل
                }
              }}
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
  const { isOpen, isLargeScreen, close } = useSidebar();

  const [manuallyToggled, setManuallyToggled] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const activeGroupKey = navigationGroups.find((group) =>
    group.items.some((item) => item.path === location.pathname),
  )?.key;

  const isSearching = searchQuery.trim().length > 0;

  const isGroupOpen = (key) => {
    if (isSearching) return true;
    if (key in manuallyToggled) return manuallyToggled[key];
    return key === activeGroupKey;
  };

  const toggleGroup = (key) => {
    setManuallyToggled((prev) => ({
      ...prev,
      [key]: !isGroupOpen(key),
    }));
  };

  // عند تغيير الصفحة على الشاشات الصغيرة: أغلق السايد بار
  useEffect(() => {
    if (!isLargeScreen) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // اختصار Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ================= العرض =================

  const sidebarContent = (
    <nav className="flex flex-col py-4 px-3 h-full">
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

      {/* حقل البحث */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("nav.searchPlaceholder")}
          className="w-full ps-9 pe-8 py-2 rounded-md border border-border
                     bg-secondary-50/50 text-sm text-secondary-800
                     placeholder:text-secondary-400
                     focus:outline-none focus:ring-2 focus:ring-primary/30
                     focus:border-primary focus:bg-white transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              searchInputRef.current?.focus();
            }}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1
                       rounded text-secondary-400
                       hover:text-secondary-700 hover:bg-secondary-100 transition"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="border-t border-border mb-3" />

      {navigationGroups.map((group) => (
        <GroupSection
          key={group.key}
          group={group}
          isOpen={isGroupOpen(group.key)}
          onToggle={() => toggleGroup(group.key)}
          isActiveGroup={group.key === activeGroupKey}
          searchQuery={searchQuery}
        />
      ))}

      {isSearching &&
        navigationGroups.every((group) => {
          const q = searchQuery.trim().toLowerCase();
          return !group.items.some((item) => {
            const labelAr = t(`nav.items.${item.key}`, {
              lng: "ar",
            }).toLowerCase();
            const labelEn = t(`nav.items.${item.key}`, {
              lng: "en",
            }).toLowerCase();
            return labelAr.includes(q) || labelEn.includes(q);
          });
        }) && (
          <div className="text-center py-6 px-3">
            <Search size={24} className="mx-auto text-secondary-300 mb-2" />
            <p className="text-xs text-secondary-500">
              {t("nav.noSearchResults")}
            </p>
          </div>
        )}
    </nav>
  );

  // ================= شاشات كبيرة =================
  if (isLargeScreen) {
    return (
      <aside
        className={`bg-white border-e border-border h-[calc(100vh-4rem)]
                    sticky top-16 overflow-y-auto flex-shrink-0
                    transition-all duration-300 ease-in-out
                    ${isOpen ? "w-72" : "w-0 overflow-hidden border-e-0"}`}
      >
        <div className="w-72">{sidebarContent}</div>
      </aside>
    );
  }

  // ================= شاشات صغيرة: Overlay =================
  return (
    <>
      {/* خلفية معتمة */}
      <div
        onClick={close}
        className={`fixed inset-0 bg-secondary-900/40 backdrop-blur-sm
                    transition-opacity duration-300 z-40
                    ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* السايد بار كطبقة منزلقة */}
      <aside
        className={`fixed top-16 bottom-0 start-0 w-72 bg-white
                    border-e border-border overflow-y-auto z-50
                    transition-transform duration-300 ease-in-out
                    ${
                      isOpen
                        ? "translate-x-0"
                        : "ltr:-translate-x-full rtl:translate-x-full"
                    }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
