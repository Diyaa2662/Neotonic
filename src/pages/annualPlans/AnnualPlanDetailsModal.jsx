import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { X, Package, Loader2, AlertCircle } from "lucide-react";
import { annualPlansApi } from "../../api/annualPlans";

export default function AnnualPlanDetailsModal({ visible, plan, onClose }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !plan?.id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    annualPlansApi
      .getById(plan.id)
      .then((data) => {
        if (cancelled) return;
        setDetails(data.details || []);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("annualPlans.detailsView.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, plan?.id, t]);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      return d.toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={800}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        {/* الرأس */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-secondary-900">
                {t("annualPlans.detailsView.title")}
              </h3>
              <p className="text-sm text-secondary-500 mt-0.5">
                {t("annualPlans.form.number")}:{" "}
                <span className="font-mono font-medium text-secondary-700">
                  {plan?.number || "-"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-secondary-400
                       hover:text-secondary-700 hover:bg-secondary-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* معلومات الخطة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-secondary-50 rounded-md p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t("annualPlans.columns.department")}
            </p>
            <p className="text-sm font-medium text-secondary-900 truncate">
              {plan?.departmentNameAr || plan?.departmentNameEn || "-"}
            </p>
          </div>
          <div className="bg-secondary-50 rounded-md p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t("annualPlans.columns.materialType")}
            </p>
            <p className="text-sm font-medium text-secondary-900 truncate">
              {plan?.materialTypeNameAr || plan?.materialTypeNameEn || "-"}
            </p>
          </div>
          <div className="bg-secondary-50 rounded-md p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t("annualPlans.columns.annualPlanDate")}
            </p>
            <p
              className="text-sm font-medium text-secondary-900 font-mono"
              dir="ltr"
            >
              {formatDate(plan?.annualPlanDate)}
            </p>
          </div>
          <div className="bg-secondary-50 rounded-md p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t("annualPlans.columns.detailCount")}
            </p>
            <p className="text-sm font-medium text-secondary-900" dir="ltr">
              {details.length}
            </p>
          </div>
        </div>

        {/* الملاحظات (إن وُجدت) */}
        {plan?.notes && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs font-medium text-amber-800 mb-1">
              {t("annualPlans.form.notes")}
            </p>
            <p className="text-sm text-amber-900">{plan.notes}</p>
          </div>
        )}

        {/* التفاصيل */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-secondary-800">
              {t("annualPlans.detailsView.title")}
            </h4>
            {!loading && !error && (
              <span className="text-xs text-secondary-500">
                ({details.length})
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-secondary-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">{t("common.loading")}</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-8 text-danger">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          ) : details.length === 0 ? (
            <div className="py-8 text-center text-sm text-secondary-400">
              {t("annualPlans.detailsView.noDetails")}
            </div>
          ) : (
            <div className="bg-white rounded-md border border-border overflow-hidden max-h-[40vh] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-secondary-100/80 backdrop-blur">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-xs font-semibold text-secondary-700 text-center w-14">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-secondary-700 text-start">
                      {t("annualPlans.detailsView.material")}
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-secondary-700 text-center w-28">
                      {t("annualPlans.detailsView.quantity")}
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-secondary-700 text-start">
                      {t("annualPlans.detailsView.notes")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr
                      key={detail.id || index}
                      className="border-b border-border last:border-b-0 hover:bg-secondary-50/50 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7
                                     rounded-full bg-primary-50 text-primary
                                     text-xs font-bold"
                          dir="ltr"
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-secondary-900">
                            {detail.materialNameAr ||
                              detail.materialNameEn ||
                              "-"}
                          </span>
                          {detail.materialNumber && (
                            <span
                              className="text-xs text-secondary-500 font-mono"
                              dir="ltr"
                            >
                              {detail.materialNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className="inline-block px-2.5 py-1 rounded text-xs
                                     bg-blue-50 text-blue-700 font-bold"
                          dir="ltr"
                        >
                          {detail.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="text-sm text-secondary-600 truncate block max-w-[240px]"
                          title={detail.notes || ""}
                        >
                          {detail.notes || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* زر الإغلاق */}
        <div className="flex items-center justify-end mt-5 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md text-sm font-medium
                       bg-primary text-white hover:bg-primary-700 transition"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Popup>
  );
}
