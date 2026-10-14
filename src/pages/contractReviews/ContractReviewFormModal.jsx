import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { contractReviewsApi } from "../../api/contractReviews";
import { suppliersApi } from "../../api/suppliers";
import { materialsApi } from "../../api/materials";
import { CONNECTION_METHODS } from "../../constants/connectionMethods";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

const emptyForm = {
  number: "",
  creationDate: null,
  expectedDate: null,
  supplierId: "",
  connectionMethod: "",
  materialId: "",
  quantity: "",
  status: 0, // الافتراضي Pending
  notes: "",
};

export default function ContractReviewFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب الموردين والمواد النشطة
  useEffect(() => {
    if (!visible) return;
    suppliersApi
      .listAllActive()
      .then(setSuppliers)
      .catch(() => []);
    materialsApi
      .listAllActive()
      .then(setMaterials)
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
          expectedDate: editing.expectedDate
            ? new Date(editing.expectedDate)
            : null,
          supplierId: editing.supplierId ?? "",
          connectionMethod: editing.connectionMethod ?? "",
          materialId: editing.materialId ?? "",
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
      e.number = t("purchaseRequests.form.errors.numberRequired");
    }
    if (!form.creationDate) {
      e.creationDate = t("purchaseRequests.form.errors.creationDateRequired");
    }
    if (!form.expectedDate) {
      e.expectedDate = t("purchaseRequests.form.errors.expectedDateRequired");
    }
    if (!form.supplierId) {
      e.supplierId = t("purchaseRequests.form.errors.supplierRequired");
    }
    if (!form.connectionMethod) {
      e.connectionMethod = t(
        "purchaseRequests.form.errors.connectionMethodRequired",
      );
    }
    if (!form.materialId) {
      e.materialId = t("purchaseRequests.form.errors.materialRequired");
    }
    if (form.quantity === "" || form.quantity === null) {
      e.quantity = t("purchaseRequests.form.errors.quantityRequired");
    } else if (isNaN(Number(form.quantity))) {
      e.quantity = t("purchaseRequests.form.errors.quantityInvalid");
    }
    if (isEdit && form.status === "") {
      e.status = t("purchaseRequests.form.errors.statusRequired");
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
      expectedDate:
        form.expectedDate instanceof Date
          ? form.expectedDate.toISOString()
          : new Date(form.expectedDate).toISOString(),
      supplierId: Number(form.supplierId),
      connectionMethod: Number(form.connectionMethod),
      materialId: Number(form.materialId),
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
        result = await contractReviewsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await contractReviewsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await contractReviewsApi.create(payload);
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
        setServerError(t("purchaseRequests.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("purchaseRequests.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("purchaseRequests.form.errors.duplicate"));
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
                ? t("purchaseRequests.form.editTitle")
                : t("purchaseRequests.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("purchaseRequests.form.editSubtitle")
                : t("purchaseRequests.form.createSubtitle")}
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
              {t("purchaseRequests.form.number")}
            </label>
            <input
              type="text"
              value={form.number}
              onChange={(e) => setField("number", e.target.value)}
              placeholder={t("purchaseRequests.form.numberPlaceholder")}
              className={inputClass(errors.number)}
              dir="ltr"
              autoFocus
            />
            {errors.number && (
              <p className="text-xs text-danger mt-1">{errors.number}</p>
            )}
          </div>

          {/* تاريخ الإنشاء + التاريخ المتوقع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.creationDate")}
              </label>
              <DateBox
                value={form.creationDate}
                onValueChanged={(e) => setField("creationDate", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t("purchaseRequests.form.creationDatePlaceholder")}
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
                {t("purchaseRequests.form.expectedDate")}
              </label>
              <DateBox
                value={form.expectedDate}
                onValueChanged={(e) => setField("expectedDate", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t("purchaseRequests.form.expectedDatePlaceholder")}
                width="100%"
                className={errors.expectedDate ? "dx-invalid" : ""}
              />
              {errors.expectedDate && (
                <p className="text-xs text-danger mt-1">
                  {errors.expectedDate}
                </p>
              )}
            </div>
          </div>

          {/* المورد + طريقة الاتصال */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.supplier")}
              </label>
              <select
                value={form.supplierId}
                onChange={(e) => setField("supplierId", e.target.value)}
                className={inputClass(errors.supplierId)}
              >
                <option value="">
                  {t("purchaseRequests.form.selectSupplier")}
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr || s.nameEn}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-danger mt-1">{errors.supplierId}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.connectionMethod")}
              </label>
              <select
                value={form.connectionMethod}
                onChange={(e) => setField("connectionMethod", e.target.value)}
                className={inputClass(errors.connectionMethod)}
              >
                <option value="">
                  {t("purchaseRequests.form.selectConnectionMethod")}
                </option>
                {CONNECTION_METHODS.map((cm) => (
                  <option key={cm.value} value={cm.value}>
                    {t(`purchaseRequests.connectionMethods.${cm.key}`)}
                  </option>
                ))}
              </select>
              {errors.connectionMethod && (
                <p className="text-xs text-danger mt-1">
                  {errors.connectionMethod}
                </p>
              )}
            </div>
          </div>

          {/* المادة + الكمية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.material")}
              </label>
              <select
                value={form.materialId}
                onChange={(e) => setField("materialId", e.target.value)}
                className={inputClass(errors.materialId)}
              >
                <option value="">
                  {t("purchaseRequests.form.selectMaterial")}
                </option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.materialNumber} — {m.nameAr || m.nameEn}
                  </option>
                ))}
              </select>
              {errors.materialId && (
                <p className="text-xs text-danger mt-1">{errors.materialId}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.quantity")}
              </label>
              <input
                type="number"
                step="any"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                placeholder={t("purchaseRequests.form.quantityPlaceholder")}
                className={inputClass(errors.quantity)}
                dir="ltr"
              />
              {errors.quantity && (
                <p className="text-xs text-danger mt-1">{errors.quantity}</p>
              )}
            </div>
          </div>

          {/* الحالة (تعديل فقط) */}
          {isEdit && (
            <div>
              <label className={labelClass}>
                {t("purchaseRequests.form.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className={inputClass(errors.status)}
              >
                {PURCHASE_ORDER_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(`purchaseRequests.statuses.${s.key}`)}
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
              {t("purchaseRequests.form.notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("purchaseRequests.form.notesPlaceholder")}
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
                  {t("purchaseRequests.form.isActiveLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("purchaseRequests.form.isActiveHint")
                    : t("purchaseRequests.form.isInactiveHint")}
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
                  ? t("purchaseRequests.form.saving")
                  : t("purchaseRequests.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
