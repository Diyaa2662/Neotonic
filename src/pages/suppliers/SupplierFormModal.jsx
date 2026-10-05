import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertCircle, Save, X } from "lucide-react";
import { suppliersApi } from "../../api/suppliers";

const emptyForm = {
  supplierNumber: "",
  nameAr: "",
  nameEn: "",
  contact: "",
  phoneNumber: "",
  email: "",
  notes: "",
};

// تحقق بسيط من صيغة البريد
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupplierFormModal({
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
          supplierNumber: editing.supplierNumber || "",
          nameAr: editing.nameAr || "",
          nameEn: editing.nameEn || "",
          contact: editing.contact || "",
          phoneNumber: editing.phoneNumber || "",
          email: editing.email || "",
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
    const ar = form.nameAr.trim();
    const en = form.nameEn.trim();

    if (!form.supplierNumber.trim()) {
      e.supplierNumber = t("suppliers.form.errors.supplierNumberRequired");
    }
    if (!ar && !en) {
      e.nameAr = t("suppliers.form.errors.atLeastOne");
      e.nameEn = t("suppliers.form.errors.atLeastOne");
    }
    // تحقق البريد فقط إذا كان مُدخلاً
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      e.email = t("suppliers.form.errors.emailInvalid");
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
      supplierNumber: form.supplierNumber.trim(),
      nameAr: ar || en,
      nameEn: en || ar,
      contact: form.contact.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await suppliersApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await suppliersApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await suppliersApi.create(payload);
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
        setServerError(t("suppliers.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("suppliers.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("suppliers.form.errors.duplicate"));
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
                ? t("suppliers.form.editTitle")
                : t("suppliers.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("suppliers.form.editSubtitle")
                : t("suppliers.form.createSubtitle")}
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
          autoComplete="off"
          className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pe-1"
        >
          {/* رقم المورد */}
          <div>
            <label className={labelClass}>
              {t("suppliers.form.supplierNumber")}
            </label>
            <input
              type="text"
              value={form.supplierNumber}
              onChange={(e) => setField("supplierNumber", e.target.value)}
              placeholder={t("suppliers.form.supplierNumberPlaceholder")}
              className={inputClass(errors.supplierNumber)}
              dir="ltr"
              autoFocus
            />
            {errors.supplierNumber && (
              <p className="text-xs text-danger mt-1">
                {errors.supplierNumber}
              </p>
            )}
          </div>

          {/* الأسماء */}
          <div>
            <p className="text-xs text-secondary-500 mb-2">
              {t("suppliers.form.atLeastOneHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("suppliers.form.nameAr")}
                </label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  placeholder={t("suppliers.form.nameArPlaceholder")}
                  className={inputClass(errors.nameAr)}
                />
                {errors.nameAr && (
                  <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("suppliers.form.nameEn")}
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  placeholder={t("suppliers.form.nameEnPlaceholder")}
                  className={inputClass(errors.nameEn)}
                  dir="ltr"
                />
                {errors.nameEn && (
                  <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
                )}
              </div>
            </div>
          </div>

          {/* جهة الاتصال + الهاتف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("suppliers.form.contact")}
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setField("contact", e.target.value)}
                placeholder={t("suppliers.form.contactPlaceholder")}
                className={inputClass(false)}
                autoComplete="off"
                name="supplier-contact"
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("suppliers.form.phoneNumber")}
              </label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                placeholder={t("suppliers.form.phoneNumberPlaceholder")}
                className={inputClass(false)}
                dir="ltr"
                autoComplete="off"
                name="supplier-phone"
              />
            </div>
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className={labelClass}>{t("suppliers.form.email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder={t("suppliers.form.emailPlaceholder")}
              className={inputClass(errors.email)}
              dir="ltr"
              autoComplete="off"
              name="supplier-email"
            />
            {errors.email && (
              <p className="text-xs text-danger mt-1">{errors.email}</p>
            )}
          </div>

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>{t("suppliers.form.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("suppliers.form.notesPlaceholder")}
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
                  {t("suppliers.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("suppliers.form.statusActiveHint")
                    : t("suppliers.form.statusInactiveHint")}
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
                {loading
                  ? t("suppliers.form.saving")
                  : t("suppliers.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
