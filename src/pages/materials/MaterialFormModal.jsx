import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertCircle, Save, X } from "lucide-react";
import { materialsApi } from "../../api/materials";
import { useActiveOptions } from "../../hooks/useActiveOptions";

const emptyForm = {
  nameAr: "",
  nameEn: "",
  materialNumber: "",
  accountingCode: "",
  min: "",
  max: "",
  notes: "",
  categoryId: "",
  materialTypeId: "",
  isSerialized: true,
};

export default function MaterialFormModal({
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

  const { categories, materialTypes } = useActiveOptions();

  // إعادة تعيين عند الفتح
  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          nameAr: editing.nameAr || "",
          nameEn: editing.nameEn || "",
          materialNumber: editing.materialNumber || "",
          accountingCode: editing.accountingCode || "",
          min: editing.min ?? "",
          max: editing.max ?? "",
          notes: editing.notes || "",
          categoryId: editing.categoryId ?? "",
          materialTypeId: editing.materialTypeId ?? "",
          isSerialized: !!editing.isSerialized,
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

    if (!ar && !en) {
      e.nameAr = t("materials.form.errors.atLeastOne");
      e.nameEn = t("materials.form.errors.atLeastOne");
    }
    if (!form.materialNumber.trim()) {
      e.materialNumber = t("materials.form.errors.materialNumberRequired");
    }
    if (!form.accountingCode.trim()) {
      e.accountingCode = t("materials.form.errors.accountingCodeRequired");
    }
    if (form.min === "" || form.min === null) {
      e.min = t("materials.form.errors.minRequired");
    } else if (isNaN(Number(form.min))) {
      e.min = t("materials.form.errors.minInvalid");
    }
    if (form.max === "" || form.max === null) {
      e.max = t("materials.form.errors.maxRequired");
    } else if (isNaN(Number(form.max))) {
      e.max = t("materials.form.errors.maxInvalid");
    }
    if (!form.categoryId) {
      e.categoryId = t("materials.form.errors.categoryRequired");
    }
    if (!form.materialTypeId) {
      e.materialTypeId = t("materials.form.errors.materialTypeRequired");
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
      nameAr: ar || en,
      nameEn: en || ar,
      materialNumber: form.materialNumber.trim(),
      accountingCode: form.accountingCode.trim(),
      min: Number(form.min),
      max: Number(form.max),
      notes: form.notes.trim() || null,
      categoryId: Number(form.categoryId),
      materialTypeId: Number(form.materialTypeId),
      isSerialized: form.isSerialized,
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await materialsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await materialsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await materialsApi.create(payload);
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
        setServerError(t("materials.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("materials.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("materials.form.errors.duplicate"));
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
      maxHeight="90vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        {/* العنوان */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("materials.form.editTitle")
                : t("materials.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("materials.form.editSubtitle")
                : t("materials.form.createSubtitle")}
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
          className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pe-1"
        >
          <p className="text-xs text-secondary-500 -mb-1">
            {t("materials.form.atLeastOneHint")}
          </p>

          {/* الأسماء */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("materials.form.nameAr")}</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setField("nameAr", e.target.value)}
                placeholder={t("materials.form.nameArPlaceholder")}
                className={inputClass(errors.nameAr)}
                autoFocus
              />
              {errors.nameAr && (
                <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>{t("materials.form.nameEn")}</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setField("nameEn", e.target.value)}
                placeholder={t("materials.form.nameEnPlaceholder")}
                className={inputClass(errors.nameEn)}
                dir="ltr"
              />
              {errors.nameEn && (
                <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
              )}
            </div>
          </div>

          {/* رقم المادة والكود المحاسبي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("materials.form.materialNumber")}
              </label>
              <input
                type="text"
                value={form.materialNumber}
                onChange={(e) => setField("materialNumber", e.target.value)}
                placeholder={t("materials.form.materialNumberPlaceholder")}
                className={inputClass(errors.materialNumber)}
                dir="ltr"
              />
              {errors.materialNumber && (
                <p className="text-xs text-danger mt-1">
                  {errors.materialNumber}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("materials.form.accountingCode")}
              </label>
              <input
                type="text"
                value={form.accountingCode}
                onChange={(e) => setField("accountingCode", e.target.value)}
                placeholder={t("materials.form.accountingCodePlaceholder")}
                className={inputClass(errors.accountingCode)}
                dir="ltr"
              />
              {errors.accountingCode && (
                <p className="text-xs text-danger mt-1">
                  {errors.accountingCode}
                </p>
              )}
            </div>
          </div>

          {/* الحد الأدنى والأعلى */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("materials.form.min")}</label>
              <input
                type="number"
                step="any"
                value={form.min}
                onChange={(e) => setField("min", e.target.value)}
                placeholder={t("materials.form.minPlaceholder")}
                className={inputClass(errors.min)}
                dir="ltr"
              />
              {errors.min && (
                <p className="text-xs text-danger mt-1">{errors.min}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>{t("materials.form.max")}</label>
              <input
                type="number"
                step="any"
                value={form.max}
                onChange={(e) => setField("max", e.target.value)}
                placeholder={t("materials.form.maxPlaceholder")}
                className={inputClass(errors.max)}
                dir="ltr"
              />
              {errors.max && (
                <p className="text-xs text-danger mt-1">{errors.max}</p>
              )}
            </div>
          </div>

          {/* الفئة ونوع المادة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("materials.form.category")}
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                className={inputClass(errors.categoryId)}
              >
                <option value="">{t("materials.form.selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr || c.nameEn}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-danger mt-1">{errors.categoryId}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("materials.form.materialType")}
              </label>
              <select
                value={form.materialTypeId}
                onChange={(e) => setField("materialTypeId", e.target.value)}
                className={inputClass(errors.materialTypeId)}
              >
                <option value="">
                  {t("materials.form.selectMaterialType")}
                </option>
                {materialTypes.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.nameAr || tItem.nameEn}
                  </option>
                ))}
              </select>
              {errors.materialTypeId && (
                <p className="text-xs text-danger mt-1">
                  {errors.materialTypeId}
                </p>
              )}
            </div>
          </div>

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>{t("materials.form.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("materials.form.notesPlaceholder")}
              rows={3}
              className={inputClass(false) + " resize-none"}
            />
          </div>

          {/* المتسلسل + الحالة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("materials.form.isSerialized")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {form.isSerialized
                    ? t("materials.form.isSerializedHint")
                    : t("materials.form.notSerializedHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setField("isSerialized", !form.isSerialized)}
                role="switch"
                aria-checked={form.isSerialized}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
                            transition-colors duration-200
                            ${form.isSerialized ? "bg-primary" : "bg-secondary-300"}`}
              >
                <span
                  className={`inline-block h-5 w-5 mt-0.5 ms-0.5 rounded-full bg-white
                              shadow transform transition-transform duration-200
                              ${
                                form.isSerialized
                                  ? "translate-x-5 rtl:-translate-x-5"
                                  : "translate-x-0"
                              }`}
                />
              </button>
            </div>

            {isEdit && (
              <div
                className="flex items-center justify-between gap-4 p-3 rounded-md
                              border border-border bg-secondary-50/50"
              >
                <div>
                  <p className="text-sm font-medium text-secondary-800">
                    {t("materials.form.statusLabel")}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {isActive
                      ? t("materials.form.statusActiveHint")
                      : t("materials.form.statusInactiveHint")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  role="switch"
                  aria-checked={isActive}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
                              transition-colors duration-200
                              ${isActive ? "bg-primary" : "bg-secondary-300"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 ms-0.5 rounded-full bg-white
                                shadow transform transition-transform duration-200
                                ${
                                  isActive
                                    ? "translate-x-5 rtl:-translate-x-5"
                                    : "translate-x-0"
                                }`}
                  />
                </button>
              </div>
            )}
          </div>

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
                  ? t("materials.form.saving")
                  : t("materials.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
