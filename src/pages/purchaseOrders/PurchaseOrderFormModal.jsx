import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { purchaseOrdersApi } from "../../api/purchaseOrders";
import { contractReviewsApi } from "../../api/contractReviews";
import { certificatesOfAnalysisApi } from "../../api/certificatesOfAnalysis";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

const emptyForm = {
  number: "",
  creationDate: null,
  deliveryDate: null,
  contractReviewId: "",
  certificateOfAnalysisId: "",
  quantity: "",
  status: 0,
  notes: "",
};

export default function PurchaseOrderFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [contractReviews, setContractReviews] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب طلبات الشراء والشهادات النشطة
  useEffect(() => {
    if (!visible) return;
    contractReviewsApi
      .listAllActive()
      .then(setContractReviews)
      .catch(() => []);
    certificatesOfAnalysisApi
      .listAllActive()
      .then(setCertificates)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          number: editing.number || "",
          creationDate: editing.creationDate
            ? new Date(editing.creationDate)
            : null,
          deliveryDate: editing.deliveryDate
            ? new Date(editing.deliveryDate)
            : null,
          contractReviewId: editing.contractReviewId ?? "",
          certificateOfAnalysisId: editing.certificateOfAnalysisId ?? "",
          quantity: editing.quantity ?? "",
          status: editing.status ?? 0,
          notes: editing.notes || "",
        });
        setIsActive(editing.isActive ?? true);
      } else {
        setForm(emptyForm);
        setIsActive(true);
      }
      setErrors({});
      setServerError("");
      setLoading(false);
    }
  }, [visible, editing]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e = {};

    if (!form.number.trim()) {
      e.number = t("purchaseOrders.form.errors.numberRequired");
    }
    if (!form.creationDate) {
      e.creationDate = t("purchaseOrders.form.errors.creationDateRequired");
    }
    if (!form.deliveryDate) {
      e.deliveryDate = t("purchaseOrders.form.errors.deliveryDateRequired");
    }
    if (!form.contractReviewId) {
      e.contractReviewId = t(
        "purchaseOrders.form.errors.contractReviewRequired",
      );
    }
    if (!form.certificateOfAnalysisId) {
      e.certificateOfAnalysisId = t(
        "purchaseOrders.form.errors.certificateRequired",
      );
    }
    if (form.quantity === "" || form.quantity === null) {
      e.quantity = t("purchaseOrders.form.errors.quantityRequired");
    } else if (isNaN(Number(form.quantity))) {
      e.quantity = t("purchaseOrders.form.errors.quantityInvalid");
    }
    if (isEdit && form.status === "") {
      e.status = t("purchaseOrders.form.errors.statusRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      number: form.number.trim(),
      creationDate:
        form.creationDate instanceof Date
          ? form.creationDate.toISOString()
          : new Date(form.creationDate).toISOString(),
      deliveryDate:
        form.deliveryDate instanceof Date
          ? form.deliveryDate.toISOString()
          : new Date(form.deliveryDate).toISOString(),
      contractReviewId: Number(form.contractReviewId),
      certificateOfAnalysisId: Number(form.certificateOfAnalysisId),
      quantity: Number(form.quantity),
      notes: form.notes.trim(),
    };

    // status يُرسل في التعديل فقط
    if (isEdit) {
      payload.status = Number(form.status);
    }

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await purchaseOrdersApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await purchaseOrdersApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await purchaseOrdersApi.create(payload);
      }

      onSaved?.(result);
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error;
      if (msg) setServerError(msg);
      else if (status === 400)
        setServerError(t("purchaseOrders.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("purchaseOrders.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("purchaseOrders.form.errors.duplicate"));
      else if (!err.response) setServerError(t("login.errors.networkError"));
      else setServerError(t("login.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 rounded-md border text-sm transition
     focus:outline-none focus:ring-2
     ${
       hasError
         ? "border-red-300 focus:ring-red-200 focus:border-red-400"
         : "border-border focus:ring-primary/30 focus:border-primary"
     }`;

  const labelClass = "block text-sm font-medium text-secondary-700 mb-1.5";

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={820}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("purchaseOrders.form.editTitle")
                : t("purchaseOrders.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("purchaseOrders.form.editSubtitle")
                : t("purchaseOrders.form.createSubtitle")}
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

        {serverError && (
          <div
            className="mb-4 flex items-start gap-2 p-3 rounded-md
                          bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pe-1"
        >
          {/* الرقم */}
          <div>
            <label className={labelClass}>
              {t("purchaseOrders.form.number")}
            </label>
            <input
              type="text"
              value={form.number}
              onChange={(e) => setField("number", e.target.value)}
              placeholder={t("purchaseOrders.form.numberPlaceholder")}
              className={inputClass(errors.number)}
              dir="ltr"
              autoFocus
            />
            {errors.number && (
              <p className="text-xs text-danger mt-1">{errors.number}</p>
            )}
          </div>

          {/* تاريخ الإنشاء + تاريخ التسليم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("purchaseOrders.form.creationDate")}
              </label>
              <DateBox
                value={form.creationDate}
                onValueChanged={(e) => setField("creationDate", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t("purchaseOrders.form.creationDatePlaceholder")}
                width="100%"
                className={errors.creationDate ? "dx-invalid" : ""}
              />
              {errors.creationDate && (
                <p className="text-xs text-danger mt-1">
                  {errors.creationDate}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("purchaseOrders.form.deliveryDate")}
              </label>
              <DateBox
                value={form.deliveryDate}
                onValueChanged={(e) => setField("deliveryDate", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t("purchaseOrders.form.deliveryDatePlaceholder")}
                width="100%"
                className={errors.deliveryDate ? "dx-invalid" : ""}
              />
              {errors.deliveryDate && (
                <p className="text-xs text-danger mt-1">
                  {errors.deliveryDate}
                </p>
              )}
            </div>
          </div>

          {/* طلب الشراء + شهادة التحليل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("purchaseOrders.form.contractReview")}
              </label>
              <select
                value={form.contractReviewId}
                onChange={(e) => setField("contractReviewId", e.target.value)}
                className={inputClass(errors.contractReviewId)}
              >
                <option value="">
                  {t("purchaseOrders.form.selectContractReview")}
                </option>
                {contractReviews.map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.number} —{" "}
                    {cr.supplierNameAr ||
                      cr.supplierNameEn ||
                      cr.materialNameAr ||
                      cr.materialNameEn ||
                      `#${cr.id}`}
                  </option>
                ))}
              </select>
              {errors.contractReviewId && (
                <p className="text-xs text-danger mt-1">
                  {errors.contractReviewId}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("purchaseOrders.form.certificate")}
              </label>
              <select
                value={form.certificateOfAnalysisId}
                onChange={(e) =>
                  setField("certificateOfAnalysisId", e.target.value)
                }
                className={inputClass(errors.certificateOfAnalysisId)}
              >
                <option value="">
                  {t("purchaseOrders.form.selectCertificate")}
                </option>
                {certificates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number} —{" "}
                    {c.supplierNameAr ||
                      c.supplierNameEn ||
                      c.materialNameAr ||
                      c.materialNameEn ||
                      `#${c.id}`}
                  </option>
                ))}
              </select>
              {errors.certificateOfAnalysisId && (
                <p className="text-xs text-danger mt-1">
                  {errors.certificateOfAnalysisId}
                </p>
              )}
            </div>
          </div>

          {/* الكمية */}
          <div>
            <label className={labelClass}>
              {t("purchaseOrders.form.quantity")}
            </label>
            <input
              type="number"
              step="any"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              placeholder={t("purchaseOrders.form.quantityPlaceholder")}
              className={inputClass(errors.quantity)}
              dir="ltr"
            />
            {errors.quantity && (
              <p className="text-xs text-danger mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* الحالة (تعديل فقط) */}
          {isEdit && (
            <div>
              <label className={labelClass}>
                {t("purchaseOrders.form.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className={inputClass(errors.status)}
              >
                {PURCHASE_ORDER_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(`purchaseOrders.statuses.${s.key}`)}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-xs text-danger mt-1">{errors.status}</p>
              )}
            </div>
          )}

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>
              {t("purchaseOrders.form.notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("purchaseOrders.form.notesPlaceholder")}
              rows={3}
              className={inputClass(false) + " resize-none"}
            />
          </div>

          {/* الحالة النشطة (تعديل فقط) */}
          {isEdit && (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("purchaseOrders.form.isActiveLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("purchaseOrders.form.isActiveHint")
                    : t("purchaseOrders.form.isInactiveHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                role="switch"
                aria-checked={isActive}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
                            transition-colors duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-primary/30
                            ${isActive ? "bg-primary" : "bg-secondary-300"}`}
              >
                <span
                  className={`inline-block h-5 w-5 mt-0.5 ms-0.5 rounded-full bg-white
                              shadow transform transition-transform duration-200 ease-in-out
                              ${
                                isActive
                                  ? "translate-x-5 rtl:-translate-x-5"
                                  : "translate-x-0"
                              }`}
                />
              </button>
            </div>
          )}

          {/* الأزرار */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-md text-sm font-medium
                         text-secondary-700 bg-white border border-border
                         hover:bg-secondary-50 transition disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md
                         bg-primary text-white text-sm font-semibold
                         hover:bg-primary-700 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>
                {loading
                  ? t("purchaseOrders.form.saving")
                  : t("purchaseOrders.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
