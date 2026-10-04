import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertCircle, Save, X } from "lucide-react";
import { departmentsApi } from "../../api/departments";

export default function DepartmentFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [departmentNumber, setDepartmentNumber] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDepartmentNumber(editing?.departmentNumber || "");
      setNameAr(editing?.nameAr || "");
      setNameEn(editing?.nameEn || "");
      setIsActive(editing?.isActive ?? true);
      setErrors({});
      setServerError("");
      setLoading(false);
    }
  }, [visible, editing]);

  const validate = () => {
    const e = {};
    const ar = nameAr.trim();
    const en = nameEn.trim();

    if (!departmentNumber.trim()) {
      e.departmentNumber = t(
        "departments.form.errors.departmentNumberRequired",
      );
    }
    if (!ar && !en) {
      e.nameAr = t("departments.form.errors.atLeastOne");
      e.nameEn = t("departments.form.errors.atLeastOne");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const ar = nameAr.trim();
    const en = nameEn.trim();
    const payload = {
      departmentNumber: departmentNumber.trim(),
      nameAr: ar || en,
      nameEn: en || ar,
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await departmentsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await departmentsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await departmentsApi.create(payload);
      }

      onSaved?.(result);
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error;

      if (serverMessage) setServerError(serverMessage);
      else if (status === 400)
        setServerError(t("departments.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("departments.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("departments.form.errors.duplicate"));
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

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={520}
      height="auto"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("departments.form.editTitle")
                : t("departments.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("departments.form.editSubtitle")
                : t("departments.form.createSubtitle")}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-secondary-500 -mb-1">
            {t("departments.form.atLeastOneHint")}
          </p>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("departments.form.departmentNumber")}
            </label>
            <input
              type="text"
              value={departmentNumber}
              onChange={(e) => setDepartmentNumber(e.target.value)}
              placeholder={t("departments.form.departmentNumberPlaceholder")}
              className={inputClass(errors.departmentNumber)}
              dir="ltr"
              autoFocus
            />
            {errors.departmentNumber && (
              <p className="text-xs text-danger mt-1">
                {errors.departmentNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("departments.form.nameAr")}
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t("departments.form.nameArPlaceholder")}
              className={inputClass(errors.nameAr)}
            />
            {errors.nameAr && (
              <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("departments.form.nameEn")}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t("departments.form.nameEnPlaceholder")}
              className={inputClass(errors.nameEn)}
              dir="ltr"
            />
            {errors.nameEn && (
              <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
            )}
          </div>

          {isEdit && (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("departments.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("departments.form.statusActiveHint")
                    : t("departments.form.statusInactiveHint")}
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
                  ? t("departments.form.saving")
                  : t("departments.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
