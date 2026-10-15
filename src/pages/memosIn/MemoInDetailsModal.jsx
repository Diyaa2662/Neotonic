import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import {
  X,
  Package,
  Loader2,
  AlertCircle,
  Boxes,
  Hash,
  Factory,
  Globe,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { memosInApi } from "../../api/memosIn";

export default function MemoInDetailsModal({ visible, memo, onClose }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUOMs, setExpandedUOMs] = useState({});

  useEffect(() => {
    if (!visible || !memo?.id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setExpandedUOMs({});

    memosInApi
      .getById(memo.id)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("memosIn.detailsView.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, memo?.id, t]);

  const formatDate = (value, withTime = false) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      return d.toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      });
    } catch {
      return value;
    }
  };

  const toggleUOMs = (key) => {
    setExpandedUOMs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={1000}
      height="auto"
      maxHeight="95vh"
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
                {t("memosIn.detailsView.title")}
              </h3>
              <p className="text-sm text-secondary-500 mt-0.5">
                {t("memosIn.form.number")}:{" "}
                <span className="font-mono font-medium text-secondary-700">
                  {data?.number ?? memo?.number ?? "-"}
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

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-secondary-500">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">{t("common.loading")}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-danger">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <>
            {/* معلومات المذكرة */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
                {t("memosIn.detailsView.infoSection")}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-xs text-secondary-500 mb-1">
                    {t("memosIn.form.memoDate")}
                  </p>
                  <p
                    className="text-sm font-medium text-secondary-900 font-mono"
                    dir="ltr"
                  >
                    {formatDate(data?.memoDate, true)}
                  </p>
                </div>

                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-xs text-secondary-500 mb-1">
                    {t("memosIn.form.invoiceNumber")}
                  </p>
                  <p
                    className="text-sm font-medium text-secondary-900 font-mono"
                    dir="ltr"
                  >
                    {data?.invoiceNumber || "-"}
                  </p>
                </div>

                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-xs text-secondary-500 mb-1">
                    {t("memosIn.form.invoiceDate")}
                  </p>
                  <p
                    className="text-sm font-medium text-secondary-900 font-mono"
                    dir="ltr"
                  >
                    {formatDate(data?.invoiceDate, true)}
                  </p>
                </div>

                <div className="bg-secondary-50 rounded-md p-3">
                  <p className="text-xs text-secondary-500 mb-1">
                    {t("memosIn.form.supplier")}
                  </p>
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {data?.supplierNameAr || data?.supplierNameEn || "-"}
                  </p>
                </div>
              </div>

              {/* ملخص الأرقام */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 mb-1">
                    {t("memosIn.detailsView.totalDetails")}
                  </p>
                  <p className="text-lg font-bold text-blue-800" dir="ltr">
                    {data?.totalDetailCount ?? 0}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-xs text-green-700 mb-1">
                    {t("memosIn.detailsView.totalQuantity")}
                  </p>
                  <p className="text-lg font-bold text-green-800" dir="ltr">
                    {data?.totalQuantity ?? 0}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                  <p className="text-xs text-purple-700 mb-1">
                    {t("memosIn.detailsView.totalUOMCount")}
                  </p>
                  <p className="text-lg font-bold text-purple-800" dir="ltr">
                    {data?.totalUOMCount ?? 0}
                  </p>
                </div>
              </div>

              {data?.notes && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    {t("memosIn.form.notes")}
                  </p>
                  <p className="text-sm text-amber-900">{data.notes}</p>
                </div>
              )}
            </div>

            {/* التفاصيل */}
            <div>
              <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
                {t("memosIn.detailsView.detailsSection")}
              </h4>

              {!data?.details || data.details.length === 0 ? (
                <div className="py-8 text-center text-sm text-secondary-400">
                  {t("memosIn.detailsView.noDetails")}
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pe-2 pb-2">
                  {data.details.map((detail, index) => {
                    const uoms = Array.isArray(detail.uoMs) ? detail.uoMs : [];
                    const uomsCount = uoms.length;
                    const isExpanded = !!expandedUOMs[index];

                    return (
                      <div
                        key={detail.id || index}
                        className="border border-border rounded-md bg-white"
                      >
                        {/* رأس التفصيل */}
                        <div className="bg-secondary-50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center justify-center w-7 h-7
                                         rounded-full bg-primary-50 text-primary
                                         text-xs font-bold"
                              dir="ltr"
                            >
                              {index + 1}
                            </span>
                            <span className="text-sm font-semibold text-secondary-800">
                              {detail.materialNameAr ||
                                detail.materialNameEn ||
                                "-"}
                            </span>
                            {detail.materialNumber && (
                              <span
                                className="text-xs text-secondary-500 font-mono"
                                dir="ltr"
                              >
                                ({detail.materialNumber})
                              </span>
                            )}
                          </div>
                          <span
                            className="inline-block px-2.5 py-1 rounded text-xs
                                       bg-blue-50 text-blue-700 font-bold"
                            dir="ltr"
                          >
                            {detail.quantity}
                          </span>
                        </div>

                        {/* معلومات التفصيل */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Boxes
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.splitQuantity")}
                                </p>
                              </div>
                              <p
                                className="text-sm font-medium text-secondary-800"
                                dir="ltr"
                              >
                                {detail.splitQuantity}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Hash
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.lot")}
                                </p>
                              </div>
                              <p
                                className="text-sm font-medium text-secondary-800 font-mono"
                                dir="ltr"
                              >
                                {detail.lot || "-"}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Factory
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.factory")}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-secondary-800">
                                {detail.factoryName || "-"}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Globe
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.country")}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-secondary-800">
                                {detail.countryOrigin || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.productionDate")}
                                </p>
                              </div>
                              <p
                                className="text-sm font-medium text-secondary-800 font-mono"
                                dir="ltr"
                              >
                                {formatDate(detail.productionDate)}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Calendar
                                  size={12}
                                  className="text-secondary-400"
                                />
                                <p className="text-xs text-secondary-500">
                                  {t("memosIn.detailsView.expiryDate")}
                                </p>
                              </div>
                              <p
                                className="text-sm font-medium text-secondary-800 font-mono"
                                dir="ltr"
                              >
                                {formatDate(detail.expiryDate)}
                              </p>
                            </div>

                            {detail.notes && (
                              <div>
                                <p className="text-xs text-secondary-500 mb-1">
                                  {t("memosIn.detailsView.notes")}
                                </p>
                                <p className="text-sm text-secondary-700 truncate">
                                  {detail.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* UOMs - قسم منفصل */}
                          <div className="border-t border-border pt-3 mt-3">
                            <button
                              type="button"
                              onClick={() => toggleUOMs(index)}
                              className={`w-full flex items-center justify-between gap-2
                                          px-3 py-2 rounded-md transition
                                          ${
                                            isExpanded
                                              ? "bg-primary-50 text-primary"
                                              : "bg-secondary-50 text-secondary-700 hover:bg-primary-50 hover:text-primary"
                                          }`}
                            >
                              <div className="flex items-center gap-2">
                                <Boxes size={16} />
                                <span className="text-sm font-medium">
                                  {t("memosIn.detailsView.uoms")} ({uomsCount})
                                </span>
                              </div>
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-200
                                            ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>

                            {isExpanded && (
                              <div className="mt-2 bg-secondary-50 rounded-md overflow-hidden border border-border">
                                {uomsCount === 0 ? (
                                  <p className="p-3 text-xs text-secondary-400 text-center">
                                    {t("memosIn.detailsView.noUOMs")}
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-secondary-100/60 border-b border-border">
                                          <th className="px-3 py-2 text-xs font-semibold text-secondary-700 text-center w-12">
                                            #
                                          </th>
                                          <th className="px-3 py-2 text-xs font-semibold text-secondary-700 text-center">
                                            {t(
                                              "memosIn.detailsView.uomBarcode",
                                            )}
                                          </th>
                                          <th className="px-3 py-2 text-xs font-semibold text-secondary-700 text-center">
                                            {t("memosIn.detailsView.uomBox")}
                                          </th>
                                          <th className="px-3 py-2 text-xs font-semibold text-secondary-700 text-center">
                                            {t(
                                              "memosIn.detailsView.uomQuantity",
                                            )}
                                          </th>
                                          <th className="px-3 py-2 text-xs font-semibold text-secondary-700 text-center">
                                            {t(
                                              "memosIn.detailsView.uomPrintCount",
                                            )}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {uoms.map((uom, i) => (
                                          <tr
                                            key={uom.id || i}
                                            className="border-b border-border last:border-b-0 hover:bg-white transition-colors"
                                          >
                                            <td className="px-3 py-2 text-center text-xs text-secondary-500">
                                              {i + 1}
                                            </td>
                                            <td
                                              className="px-3 py-2 text-center font-mono text-xs text-secondary-700"
                                              dir="ltr"
                                            >
                                              {uom.barcode}
                                            </td>
                                            <td
                                              className="px-3 py-2 text-center text-xs text-secondary-700"
                                              dir="ltr"
                                            >
                                              {uom.boxNumber}
                                            </td>
                                            <td
                                              className="px-3 py-2 text-center text-xs text-secondary-700 font-medium"
                                              dir="ltr"
                                            >
                                              {uom.quantity}
                                            </td>
                                            <td
                                              className="px-3 py-2 text-center text-xs text-secondary-700"
                                              dir="ltr"
                                            >
                                              {uom.printCount}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

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
