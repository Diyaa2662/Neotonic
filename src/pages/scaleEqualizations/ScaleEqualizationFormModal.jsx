import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { scaleEqualizationsApi } from "../../api/scaleEqualizations";
import { scalesApi } from "../../api/scales";
import { workersApi } from "../../api/workers";

const emptyForm = {
  number: "",
  equalizationDate: null,
  scaleId: "",
  workerId: "",
  notes: "",
};

export default function ScaleEqualizationFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [scales, setScales] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب الموازين والعمال النشطين
  useEffect(() => {
    if (!visible) return;
    scalesApi
      .listAllActive()
      .then(setScales)
      .catch(() => []);
    workersApi
      .listAllActive()
      .then(setWorkers)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          number: editing.number || "",
          equalizationDate: editing.equalizationDate
            ? new Date(editing.equalizationDate)
            : null,
          scaleId: editing.scaleId ?? "",
          workerId: editing.workerId ?? "",
          notes: editing.notes || "",
        });
      } else {
        setForm(emptyForm);
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
      e.number = t("scaleEqualizations.form.errors.numberRequired");
    }
    if (!form.equalizationDate) {
      e.equalizationDate = t(
        "scaleEqualizations.form.errors.equalizationDateRequired",
      );
    }
    if (!form.scaleId) {
      e.scaleId = t("scaleEqualizations.form.errors.scaleRequired");
    }
    if (!form.workerId) {
      e.workerId = t("scaleEqualizations.form.errors.workerRequired");
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
      equalizationDate:
        form.equalizationDate instanceof Date
          ? form.equalizationDate.toISOString()
          : new Date(form.equalizationDate).toISOString(),
      scaleId: Number(form.scaleId),
      workerId: Number(form.workerId),
      // ✅ الحقول النصية تُرسل كـ "" عند الفراغ
      notes: form.notes.trim(),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await scaleEqualizationsApi.update(editing.id, payload);
      } else {
        result = await scaleEqualizationsApi.create(payload);
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
        setServerError(t("scaleEqualizations.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("scaleEqualizations.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("scaleEqualizations.form.errors.duplicate"));
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
                ? t("scaleEqualizations.form.editTitle")
                : t("scaleEqualizations.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("scaleEqualizations.form.editSubtitle")
                : t("scaleEqualizations.form.createSubtitle")}
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
          {/* الرقم + التاريخ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("scaleEqualizations.form.number")}
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setField("number", e.target.value)}
                placeholder={t("scaleEqualizations.form.numberPlaceholder")}
                className={inputClass(errors.number)}
                dir="ltr"
                autoFocus
              />
              {errors.number && (
                <p className="text-xs text-danger mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("scaleEqualizations.form.equalizationDate")}
              </label>
              <DateBox
                value={form.equalizationDate}
                onValueChanged={(e) => setField("equalizationDate", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t(
                  "scaleEqualizations.form.equalizationDatePlaceholder",
                )}
                width="100%"
                className={errors.equalizationDate ? "dx-invalid" : ""}
              />
              {errors.equalizationDate && (
                <p className="text-xs text-danger mt-1">
                  {errors.equalizationDate}
                </p>
              )}
            </div>
          </div>

          {/* الميزان + العامل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("scaleEqualizations.form.scale")}
              </label>
              <select
                value={form.scaleId}
                onChange={(e) => setField("scaleId", e.target.value)}
                className={inputClass(errors.scaleId)}
              >
                <option value="">
                  {t("scaleEqualizations.form.selectScale")}
                </option>
                {scales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.scaleNumber} — {s.nameAr || s.nameEn}
                  </option>
                ))}
              </select>
              {errors.scaleId && (
                <p className="text-xs text-danger mt-1">{errors.scaleId}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("scaleEqualizations.form.worker")}
              </label>
              <select
                value={form.workerId}
                onChange={(e) => setField("workerId", e.target.value)}
                className={inputClass(errors.workerId)}
              >
                <option value="">
                  {t("scaleEqualizations.form.selectWorker")}
                </option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nameAr || w.nameEn}
                  </option>
                ))}
              </select>
              {errors.workerId && (
                <p className="text-xs text-danger mt-1">{errors.workerId}</p>
              )}
            </div>
          </div>

          {/* الملاحظات */}
          <div>
            <label className={labelClass}>
              {t("scaleEqualizations.form.notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={t("scaleEqualizations.form.notesPlaceholder")}
              rows={3}
              className={inputClass(false) + " resize-none"}
            />
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
                  ? t("scaleEqualizations.form.saving")
                  : t("scaleEqualizations.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
