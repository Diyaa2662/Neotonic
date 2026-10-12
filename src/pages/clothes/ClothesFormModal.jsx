import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertCircle, Save, X } from "lucide-react";
import { clothesApi } from "../../api/clothes";

export default function ClothesFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameAr(editing?.nameAr || "");
      setNameEn(editing?.nameEn || "");
      setNotes(editing?.notes || "");
      setIsActive(editing?.isActive ?? true);
      setErrors({});
      setServerError("");
      setLoading(false);
    }
  }, [visible, editing]);

  const validate = () => {
    const ar = nameAr.trim();
    const en = nameEn.trim();

    if (!ar && !en) {
      setErrors({
        nameAr: t("clothes.form.errors.atLeastOne"),
        nameEn: t("clothes.form.errors.atLeastOne"),
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    const ar = nameAr.trim();
    const en = nameEn.trim();

    // ✅ الحقول النصية تُرسل كـ "" عند الفراغ (لتمكين المسح في PUT)
    const payload = {
      nameAr: ar || en,
      nameEn: en || ar,
      notes: notes.trim(),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await clothesApi.update(editing.id, payload);

        if (isActive !== editing.isActive) {
          await clothesApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await clothesApi.create(payload);
      }

      onSaved?.(result);
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error;

      if (serverMessage) {
        setServerError(serverMessage);
      } else if (status === 400) {
        setServerError(t("clothes.form.errors.badRequest"));
      } else if (status === 404) {
        setServerError(t("clothes.form.errors.notFound"));
      } else if (status === 409) {
        setServerError(t("clothes.form.errors.duplicate"));
      } else if (!err.response) {
        setServerError(t("login.errors.networkError"));
      } else {
        setServerError(t("login.errors.generic"));
      }
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
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("clothes.form.editTitle")
                : t("clothes.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("clothes.form.editSubtitle")
                : t("clothes.form.createSubtitle")}
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
          <p className="text-xs text-secondary-500 -mb-1">
            {t("clothes.form.atLeastOneHint")}
          </p>

          {/* الاسم بالعربي */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("clothes.form.nameAr")}
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t("clothes.form.nameArPlaceholder")}
              className={inputClass(errors.nameAr)}
              autoFocus
            />
            {errors.nameAr && (
              <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
            )}
          </div>

          {/* الاسم بالإنكليزي */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("clothes.form.nameEn")}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t("clothes.form.nameEnPlaceholder")}
              className={inputClass(errors.nameEn)}
              dir="ltr"
            />
            {errors.nameEn && (
              <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
            )}
          </div>

          {/* الملاحظات */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              {t("clothes.form.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("clothes.form.notesPlaceholder")}
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
                  {t("clothes.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("clothes.form.statusActiveHint")
                    : t("clothes.form.statusInactiveHint")}
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
                {loading ? t("clothes.form.saving") : t("clothes.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
