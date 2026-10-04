import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { labEquipmentsApi } from "../../api/labEquipments";

const emptyForm = {
  nameAr: "",
  nameEn: "",
  jobAr: "",
  jobEn: "",
  manufacturer: "",
  model: "",
  equalizingDate: null,
};

export default function LabEquipmentFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          nameAr: editing.nameAr || "",
          nameEn: editing.nameEn || "",
          jobAr: editing.jobAr || "",
          jobEn: editing.jobEn || "",
          manufacturer: editing.manufacturer || "",
          model: editing.model || "",
          equalizingDate: editing.equalizingDate
            ? new Date(editing.equalizingDate)
            : null,
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
    const nameAr = form.nameAr.trim();
    const nameEn = form.nameEn.trim();
    const jobAr = form.jobAr.trim();
    const jobEn = form.jobEn.trim();

    if (!nameAr && !nameEn) {
      e.nameAr = t("labEquipments.form.errors.atLeastOneName");
      e.nameEn = t("labEquipments.form.errors.atLeastOneName");
    }
    if (!jobAr && !jobEn) {
      e.jobAr = t("labEquipments.form.errors.atLeastOneJob");
      e.jobEn = t("labEquipments.form.errors.atLeastOneJob");
    }
    if (!form.manufacturer.trim()) {
      e.manufacturer = t("labEquipments.form.errors.manufacturerRequired");
    }
    if (!form.model.trim()) {
      e.model = t("labEquipments.form.errors.modelRequired");
    }
    if (!form.equalizingDate) {
      e.equalizingDate = t("labEquipments.form.errors.equalizingDateRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const nameAr = form.nameAr.trim();
    const nameEn = form.nameEn.trim();
    const jobAr = form.jobAr.trim();
    const jobEn = form.jobEn.trim();

    const payload = {
      nameAr: nameAr || nameEn,
      nameEn: nameEn || nameAr,
      jobAr: jobAr || jobEn,
      jobEn: jobEn || jobAr,
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      // نحوّل التاريخ إلى ISO 8601 مع UTC
      equalizingDate:
        form.equalizingDate instanceof Date
          ? form.equalizingDate.toISOString()
          : new Date(form.equalizingDate).toISOString(),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await labEquipmentsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await labEquipmentsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await labEquipmentsApi.create(payload);
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
        setServerError(t("labEquipments.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("labEquipments.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("labEquipments.form.errors.duplicate"));
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
      width={720}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("labEquipments.form.editTitle")
                : t("labEquipments.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("labEquipments.form.editSubtitle")
                : t("labEquipments.form.createSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-secondary-400
                       hover:text-secondary-700 hover:bg-secondary-100 transition"
            aria-label="Close"
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
          className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pe-1"
        >
          {/* ===== الأسماء ===== */}
          <div>
            <p className="text-xs text-secondary-500 mb-2">
              {t("labEquipments.form.atLeastOneNameHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("labEquipments.form.nameAr")}
                </label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  placeholder={t("labEquipments.form.nameArPlaceholder")}
                  className={inputClass(errors.nameAr)}
                  autoFocus
                />
                {errors.nameAr && (
                  <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("labEquipments.form.nameEn")}
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  placeholder={t("labEquipments.form.nameEnPlaceholder")}
                  className={inputClass(errors.nameEn)}
                  dir="ltr"
                />
                {errors.nameEn && (
                  <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== الوظائف ===== */}
          <div>
            <p className="text-xs text-secondary-500 mb-2">
              {t("labEquipments.form.atLeastOneJobHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("labEquipments.form.jobAr")}
                </label>
                <input
                  type="text"
                  value={form.jobAr}
                  onChange={(e) => setField("jobAr", e.target.value)}
                  placeholder={t("labEquipments.form.jobArPlaceholder")}
                  className={inputClass(errors.jobAr)}
                />
                {errors.jobAr && (
                  <p className="text-xs text-danger mt-1">{errors.jobAr}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("labEquipments.form.jobEn")}
                </label>
                <input
                  type="text"
                  value={form.jobEn}
                  onChange={(e) => setField("jobEn", e.target.value)}
                  placeholder={t("labEquipments.form.jobEnPlaceholder")}
                  className={inputClass(errors.jobEn)}
                  dir="ltr"
                />
                {errors.jobEn && (
                  <p className="text-xs text-danger mt-1">{errors.jobEn}</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== المُصنّع والموديل ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("labEquipments.form.manufacturer")}
              </label>
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => setField("manufacturer", e.target.value)}
                placeholder={t("labEquipments.form.manufacturerPlaceholder")}
                className={inputClass(errors.manufacturer)}
                dir="ltr"
              />
              {errors.manufacturer && (
                <p className="text-xs text-danger mt-1">
                  {errors.manufacturer}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("labEquipments.form.model")}
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
                placeholder={t("labEquipments.form.modelPlaceholder")}
                className={inputClass(errors.model)}
                dir="ltr"
              />
              {errors.model && (
                <p className="text-xs text-danger mt-1">{errors.model}</p>
              )}
            </div>
          </div>

          {/* ===== تاريخ المعايرة ===== */}
          <div>
            <label className={labelClass}>
              {t("labEquipments.form.equalizingDate")}
            </label>
            <DateBox
              value={form.equalizingDate}
              onValueChanged={(e) => setField("equalizingDate", e.value)}
              type="date"
              displayFormat="yyyy-MM-dd"
              placeholder={t("labEquipments.form.equalizingDatePlaceholder")}
              width="100%"
              className={errors.equalizingDate ? "dx-invalid" : ""}
            />
            {errors.equalizingDate && (
              <p className="text-xs text-danger mt-1">
                {errors.equalizingDate}
              </p>
            )}
          </div>

          {/* ===== الحالة (تعديل فقط) ===== */}
          {isEdit && (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("labEquipments.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("labEquipments.form.statusActiveHint")
                    : t("labEquipments.form.statusInactiveHint")}
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

          {/* ===== الأزرار ===== */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-md text-sm font-medium
                         text-secondary-700 bg-white border border-border
                         hover:bg-secondary-50 transition
                         disabled:opacity-50"
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
                  ? t("labEquipments.form.saving")
                  : t("labEquipments.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
