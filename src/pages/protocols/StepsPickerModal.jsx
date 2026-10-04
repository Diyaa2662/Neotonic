import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { Check, X, Search } from "lucide-react";
import { stepsApi } from "../../api/steps";

export default function StepsPickerModal({
  visible,
  onClose,
  onConfirm,
  selectedIds = [],
}) {
  const { t } = useTranslation();
  const [allSteps, setAllSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState([]);

  // جلب كل المراحل النشطة
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSearch("");
    setPicked(selectedIds);

    stepsApi
      .list({ page: 1, pageSize: 1000 })
      .then((data) => {
        if (cancelled) return;
        const active = (data.items || []).filter((s) => s.isActive);
        setAllSteps(active);
      })
      .catch(() => setAllSteps([]))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, selectedIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allSteps;
    const q = search.trim().toLowerCase();
    return allSteps.filter(
      (s) =>
        (s.stepNameAr || "").toLowerCase().includes(q) ||
        (s.stepNameEn || "").toLowerCase().includes(q) ||
        String(s.stepNumber).includes(q) ||
        (s.stepTypeNameAr || "").toLowerCase().includes(q) ||
        (s.stepTypeNameEn || "").toLowerCase().includes(q),
    );
  }, [allSteps, search]);

  const toggleStep = (id) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(picked);
    onClose();
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={640}
      height="auto"
      maxHeight="85vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {t("protocols.stepsPicker.title")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {t("protocols.stepsPicker.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-secondary-400
                       hover:text-secondary-700 hover:bg-secondary-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* حقل البحث */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("protocols.stepsPicker.searchPlaceholder")}
            className="w-full ps-9 pe-3 py-2.5 rounded-md border border-border
                       text-sm focus:outline-none focus:ring-2
                       focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* قائمة المراحل */}
        <div className="border border-border rounded-md max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary-500 text-sm">
              {t("common.loading")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-secondary-400 text-sm">
              {t("protocols.stepsPicker.noResults")}
            </div>
          ) : (
            filtered.map((step) => {
              const isPicked = picked.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3
                              border-b border-border last:border-b-0 text-start
                              transition-colors
                              ${isPicked ? "bg-primary-50" : "hover:bg-secondary-50"}`}
                >
                  {/* مربع الاختيار */}
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded border-2
                                flex items-center justify-center transition
                                ${
                                  isPicked
                                    ? "bg-primary border-primary"
                                    : "border-secondary-300"
                                }`}
                  >
                    {isPicked && (
                      <Check size={14} className="text-white" strokeWidth={3} />
                    )}
                  </span>

                  {/* رقم المرحلة */}
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100
                               text-secondary-700 font-bold text-xs
                               inline-flex items-center justify-center"
                    dir="ltr"
                  >
                    {step.stepNumber}
                  </span>

                  {/* الاسم */}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-secondary-900 truncate">
                      {step.stepNameAr || step.stepNameEn}
                    </span>
                    {step.stepTypeNameAr && (
                      <span className="block text-xs text-secondary-500 truncate">
                        {step.stepTypeNameAr}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* العدّاد */}
        <p className="text-xs text-secondary-500 mt-3">
          {t("protocols.stepsPicker.selectedCount", { count: picked.length })}
        </p>

        {/* الأزرار */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium
                       text-secondary-700 bg-white border border-border
                       hover:bg-secondary-50 transition"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md
                       bg-primary text-white text-sm font-semibold
                       hover:bg-primary-700 transition"
          >
            <Check size={16} />
            <span>{t("protocols.stepsPicker.confirm")}</span>
          </button>
        </div>
      </div>
    </Popup>
  );
}
