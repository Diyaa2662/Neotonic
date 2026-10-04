import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "../../contexts/useAuth";
import { useSidebar } from "../../contexts/useSidebar";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isOpen, toggle, isLargeScreen } = useSidebar();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isRtl = i18n.dir() === "rtl";

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // أيقونة الزر حسب الحالة
  const ToggleIcon = isLargeScreen
    ? isOpen
      ? isRtl
        ? PanelLeftOpen
        : PanelLeftClose
      : isRtl
        ? PanelLeftClose
        : PanelLeftOpen
    : Menu;

  return (
    <header
      className="h-16 bg-white border-b border-border flex items-center
                 justify-between px-4 sm:px-6 sticky top-0 z-30"
    >
      <div className="flex items-center gap-3">
        {/* زر فتح/إغلاق السايد بار */}
        <button
          onClick={toggle}
          className="p-2 rounded-md text-secondary-600
                     hover:text-primary hover:bg-primary-50 transition-colors"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ToggleIcon size={20} />
        </button>

        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <div className="leading-tight hidden sm:block">
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

        {/* قائمة المستخدم */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 ps-1 pe-2 py-1 rounded-md
                       hover:bg-secondary-50 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full bg-primary-50 flex items-center
                         justify-center text-primary"
            >
              <User size={16} />
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <p className="text-sm font-medium text-secondary-800 max-w-[140px] truncate">
                {user?.fullName || user?.userName}
              </p>
              <p className="text-xs text-secondary-500">
                {user?.roles?.[0] || ""}
              </p>
            </div>
            <ChevronDown size={14} className="text-secondary-400" />
          </button>

          {menuOpen && (
            <div
              className="absolute end-0 mt-2 w-56 bg-white rounded-md
                         border border-border shadow-lg py-1 z-40"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-secondary-800 truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-secondary-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm
                           text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>{t("header.logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
