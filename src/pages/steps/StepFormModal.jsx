import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import ColorBox from "devextreme-react/color-box";
import { AlertCircle, Save, X } from "lucide-react";
import { stepsApi } from "../../api/steps";
import { stepTypesApi } from "../../api/stepTypes";
import { pathboxApi } from "../../api/pathbox";

const emptyForm = {
  stepNumber: "",
  stepNameAr: "",
  stepNameEn: "",
  notes: "",
  boxPathId: "",
  color: "",
  stepTypeId: "",
};

export default function StepFormModal({ visible, onClose, onSaved, editing }) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepTypes, setStepTypes] = useState([]);
  const [boxPaths, setBoxPaths] = useState([]);

  // جلب أنواع المراحل ومسارات Pathbox
  useEffect(() => {
    if (!visible) return;
    stepTypesApi
      .listAllActive()
      .then(setStepTypes)
      .catch(() => []);
    pathboxApi
      .listAllActive()
      .then(setBoxPaths)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          stepNumber: editing.stepNumber ?? "",
          stepNameAr: editing.stepNameAr || "",
          stepNameEn: editing.stepNameEn || "",
          notes: editing.notes || "",
          boxPathId: editing.boxPathId ?? "",
          color: editing.color || "",
          stepTypeId: editing.stepTypeId ?? "",
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
    const ar = form.stepNameAr.trim();
    const en = form.stepNameEn.trim();

    if (!ar && !en) {
      e.stepNameAr = t("steps.form.errors.atLeastOne");
      e.stepNameEn = t("steps.form.errors.atLeastOne");
    }
    if (form.stepNumber === "" || form.stepNumber === null) {
      e.stepNumber = t("steps.form.errors.stepNumberRequired");
    } else if (isNaN(Number(form.stepNumber))) {
      e.stepNumber = t("steps.form.errors.stepNumberInvalid");
    }
    if (!form.stepTypeId) {
      e.stepTypeId = t("steps.form.errors.stepTypeRequired");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const ar = form.stepNameAr.trim();
    const en = form.stepNameEn.trim();

    const payload = {
      stepNumber: Number(form.stepNumber),
      stepNameAr: ar || en,
      stepNameEn: en || ar,
      notes: form.notes.trim(),
      boxPathId: form.boxPathId ? Number(form.boxPathId) : null,
      color: form.color || null,
      stepTypeId: Number(form.stepTypeId),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await stepsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await stepsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await stepsApi.create(payload);
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
        setServerError(t("steps.form.errors.badRequest"));
      else if (status === 404) setServerError(t("steps.form.errors.notFound"));
      else if (status === 409) setServerError(t("steps.form.errors.duplicate"));
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
      width={680}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit ? t("steps.form.editTitle") : t("steps.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("steps.form.editSubtitle")
                : t("steps.form.createSubtitle")}
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
            {t("steps.form.atLeastOneHint")}
          </p>

          {/* رقم المرحلة ونوع المرحلة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("steps.form.stepNumber")}</label>
              <input
                type="number"
                step="1"
                value={form.stepNumber}
                onChange={(e) => setField("stepNumber", e.target.value)}
                placeholder={t("steps.form.stepNumberPlaceholder")}
                className={inputClass(errors.stepNumber)}
                dir="ltr"
                autoFocus
              />
              {errors.stepNumber && (
                <p className="text-xs text-danger mt-1">{errors.stepNumber}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>{t("steps.form.stepType")}</label>
              <select
                value={form.stepTypeId}
                onChange={(e) => setField("stepTypeId", e.target.value)}
                className={inputClass(errors.stepTypeId)}
              >
                <option value="">{t("steps.form.selectStepType")}</option>
                {stepTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameAr || st.nameEn}
                  </option>
                ))}
              </select>
              {errors.stepTypeId && (
                <p className="text-xs text-danger mt-1">{errors.stepTypeId}</p>
              )}
            </div>
          </div>

          {/* الأسماء */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("steps.form.stepNameAr")}</label>
              <input
                type="text"
                value={form.stepNameAr}
                onChange={(e) => setField("stepNameAr", e.target.value)}
                placeholder={t("steps.form.stepNameArPlaceholder")}
                className={inputClass(errors.stepNameAr)}
              />
              {errors.stepNameAr && (
                <p className="text-xs text-danger mt-1">{errors.stepNameAr}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>{t("steps.form.stepNameEn")}</label>
              <input
                type="text"
                value={form.stepNameEn}
                onChange={(e) => setField("stepNameEn", e.target.value)}
                placeholder={t("steps.form.stepNameEnPlaceholder")}
                className={inputClass(errors.stepNameEn)}
                dir="ltr"
              />
              {errors.stepNameEn && (
                <p className="text-xs text-danger mt-1">{errors.stepNameEn}</p>
              )}
            </div>
          </div>

          {/* المسار + اللون */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("steps.form.boxPath")}</label>
              <select
                value={form.boxPathId}
                onChange={(e) => setField("boxPathId", e.target.value)}
                className={inputClass(false)}
              >
                <option value="">{t("steps.form.selectBoxPath")}</option>
                {boxPaths.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.code} — {bp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>{t("steps.form.color")}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ColorBox
                    value={form.color}
                    onValueChanged={(e) => setField("color", e.value || "")}
                    applyValueMode="useButtons"
                    editAlphaChannel={false}
                    format="hex"
                    width="100%"
                    placeholder={t("steps.form.selectColor")}
                  />
                </div>
                {form.color && (
                  <button
                    type="button"
                    onClick={() => setField("color", "")}
                    title={t("steps.form.clearColor")}
                    className="p-2 rounded-md border border-border
                               text-secondary-500
                               hover:text-danger hover:border-red-300
                               hover:bg-red-50 transition flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {form.color && (
                <p
                  className="text-xs text-secondary-500 mt-1.5 font-mono"
                  dir="ltr"
                >
                  {form.color}
                </p>
              )}
            </div>
          </div>

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>{t("steps.form.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("steps.form.notesPlaceholder")}
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
                  {t("steps.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("steps.form.statusActiveHint")
                    : t("steps.form.statusInactiveHint")}
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
                {loading ? t("steps.form.saving") : t("steps.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
