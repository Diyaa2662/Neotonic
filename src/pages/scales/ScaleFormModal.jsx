import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertCircle, Save, X } from "lucide-react";
import { scalesApi } from "../../api/scales";
import { departmentsApi } from "../../api/departments";

const emptyForm = {
  scaleNumber: "",
  nameAr: "",
  nameEn: "",
  notes: "",
  departmentId: "",
};

export default function ScaleFormModal({ visible, onClose, onSaved, editing }) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب الأقسام النشطة
  useEffect(() => {
    if (!visible) return;
    departmentsApi
      .listAllActive()
      .then(setDepartments)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          scaleNumber: editing.scaleNumber || "",
          nameAr: editing.nameAr || "",
          nameEn: editing.nameEn || "",
          notes: editing.notes || "",
          departmentId: editing.departmentId ?? "",
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
    const ar = form.nameAr.trim();
    const en = form.nameEn.trim();

    if (!form.scaleNumber.trim()) {
      e.scaleNumber = t("scales.form.errors.scaleNumberRequired");
    }
    if (!ar && !en) {
      e.nameAr = t("scales.form.errors.atLeastOne");
      e.nameEn = t("scales.form.errors.atLeastOne");
    }
    if (!form.departmentId) {
      e.departmentId = t("scales.form.errors.departmentRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const ar = form.nameAr.trim();
    const en = form.nameEn.trim();
    const payload = {
      scaleNumber: form.scaleNumber.trim(),
      nameAr: ar || en,
      nameEn: en || ar,
      notes: form.notes.trim(),
      departmentId: Number(form.departmentId),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await scalesApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await scalesApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await scalesApi.create(payload);
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
        setServerError(t("scales.form.errors.badRequest"));
      else if (status === 404) setServerError(t("scales.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("scales.form.errors.duplicate"));
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
      width={640}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("scales.form.editTitle")
                : t("scales.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("scales.form.editSubtitle")
                : t("scales.form.createSubtitle")}
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
          {/* رقم الميزان + القسم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("scales.form.scaleNumber")}
              </label>
              <input
                type="text"
                value={form.scaleNumber}
                onChange={(e) => setField("scaleNumber", e.target.value)}
                placeholder={t("scales.form.scaleNumberPlaceholder")}
                className={inputClass(errors.scaleNumber)}
                dir="ltr"
                autoFocus
              />
              {errors.scaleNumber && (
                <p className="text-xs text-danger mt-1">{errors.scaleNumber}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("scales.form.department")}
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setField("departmentId", e.target.value)}
                className={inputClass(errors.departmentId)}
              >
                <option value="">{t("scales.form.selectDepartment")}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameAr || d.nameEn}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-xs text-danger mt-1">
                  {errors.departmentId}
                </p>
              )}
            </div>
          </div>

          {/* الأسماء */}
          <div>
            <p className="text-xs text-secondary-500 mb-2">
              {t("scales.form.atLeastOneHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("scales.form.nameAr")}</label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  placeholder={t("scales.form.nameArPlaceholder")}
                  className={inputClass(errors.nameAr)}
                />
                {errors.nameAr && (
                  <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>{t("scales.form.nameEn")}</label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  placeholder={t("scales.form.nameEnPlaceholder")}
                  className={inputClass(errors.nameEn)}
                  dir="ltr"
                />
                {errors.nameEn && (
                  <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
                )}
              </div>
            </div>
          </div>

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>{t("scales.form.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("scales.form.notesPlaceholder")}
              rows={3}
              className={inputClass(false) + " resize-none"}
            />
          </div>

          {/* الحالة (تعديل فقط) */}
          {isEdit && (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("scales.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("scales.form.statusActiveHint")
                    : t("scales.form.statusInactiveHint")}
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
                {loading ? t("scales.form.saving") : t("scales.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
