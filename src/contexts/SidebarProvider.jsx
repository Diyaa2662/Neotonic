import { useState, useEffect, useCallback, useMemo } from "react";
import SidebarContext from "./SidebarContext";

// نقطة الانكسار: lg = 1024px
const LG_BREAKPOINT = 1024;

export function SidebarProvider({ children }) {
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= LG_BREAKPOINT;
  });

  // على الشاشات الكبيرة: مفتوح افتراضياً
  // على الشاشات الصغيرة: مغلق افتراضياً
  const [isOpen, setIsOpen] = useState(isLargeScreen);

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);

    const handleChange = (e) => {
      setIsLargeScreen(e.matches);
      // عند الانتقال من صغير إلى كبير: افتح
      // عند الانتقال من كبير إلى صغير: أغلق
      setIsOpen(e.matches);
    };

    // تهيئة أولية
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLargeScreen(mq.matches);
    setIsOpen(mq.matches);

    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      isLargeScreen,
      toggle,
      open,
      close,
    }),
    [isOpen, isLargeScreen, toggle, open, close],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
