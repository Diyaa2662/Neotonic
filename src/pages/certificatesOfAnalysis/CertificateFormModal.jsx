import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { certificatesOfAnalysisApi } from "../../api/certificatesOfAnalysis";
import { supplierSamplesApi } from "../../api/supplierSamples";
import { ANALYSIS_RESULTS } from "../../constants/analysisResults";

const emptyForm = {
  number: "",
  analysisDate: null,
  supplierSampleId: "",
  physicalAppearance: "",
  moisturePercentage: "",
  bacterialTest: "",
  fungalTest: "",
  microscopicAppearance: "",
  color: "",
  odor: "",
  result: 1, // الافتراضي "مقبول"
  rejectionReason: "",
  notes: "",
};

export default function CertificateFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [supplierSamples, setSupplierSamples] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب عينات الموردين النشطة
  useEffect(() => {
    if (!visible) return;
    supplierSamplesApi
      .listAllActive()
      .then(setSupplierSamples)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          number: editing.number || "",
          analysisDate: editing.analysisDate
            ? new Date(editing.analysisDate)
            : null,
          supplierSampleId: editing.supplierSampleId ?? "",
          physicalAppearance: editing.physicalAppearance || "",
          moisturePercentage: editing.moisturePercentage ?? "",
          bacterialTest: editing.bacterialTest || "",
          fungalTest: editing.fungalTest || "",
          microscopicAppearance: editing.microscopicAppearance || "",
          color: editing.color || "",
          odor: editing.odor || "",
          result: editing.result ?? 1,
          rejectionReason: editing.rejectionReason || "",
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

  // عند تغيير النتيجة: نمسح rejectionReason إذا كانت "مقبول"
  const handleResultChange = (value) => {
    const numValue = Number(value);
    setForm((prev) => ({
      ...prev,
      result: numValue,
      rejectionReason: numValue === 1 ? "" : prev.rejectionReason,
    }));
  };

  const validate = () => {
    const e = {};

    if (!form.number.trim()) {
      e.number = t("certificatesOfAnalysis.form.errors.numberRequired");
    }
    if (!form.analysisDate) {
      e.analysisDate = t(
        "certificatesOfAnalysis.form.errors.analysisDateRequired",
      );
    }
    if (!form.supplierSampleId) {
      e.supplierSampleId = t(
        "certificatesOfAnalysis.form.errors.supplierSampleRequired",
      );
    }
    if (!form.result) {
      e.result = t("certificatesOfAnalysis.form.errors.resultRequired");
    }
    // إذا كانت النتيجة "مرفوض" → سبب الرفض إجباري
    if (Number(form.result) === 2 && !form.rejectionReason.trim()) {
      e.rejectionReason = t(
        "certificatesOfAnalysis.form.errors.rejectionReasonRequired",
      );
    }
    // التحقق من رقم الرطوبة إذا كان مُدخلاً
    if (
      form.moisturePercentage !== "" &&
      form.moisturePercentage !== null &&
      isNaN(Number(form.moisturePercentage))
    ) {
      e.moisturePercentage = t(
        "certificatesOfAnalysis.form.errors.moisturePercentageInvalid",
      );
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
      analysisDate:
        form.analysisDate instanceof Date
          ? form.analysisDate.toISOString()
          : new Date(form.analysisDate).toISOString(),
      supplierSampleId: Number(form.supplierSampleId),
      physicalAppearance: form.physicalAppearance.trim(),
      moisturePercentage:
        form.moisturePercentage === "" ? 0 : Number(form.moisturePercentage),
      bacterialTest: form.bacterialTest.trim(),
      fungalTest: form.fungalTest.trim(),
      microscopicAppearance: form.microscopicAppearance.trim(),
      color: form.color.trim(),
      odor: form.odor.trim(),
      result: Number(form.result),
      // ✅ إذا كانت النتيجة "مقبول" → نرسل string فارغ
      rejectionReason:
        Number(form.result) === 1 ? "" : form.rejectionReason.trim(),
      notes: form.notes.trim(),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await certificatesOfAnalysisApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await certificatesOfAnalysisApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await certificatesOfAnalysisApi.create(payload);
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
        setServerError(t("certificatesOfAnalysis.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("certificatesOfAnalysis.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("certificatesOfAnalysis.form.errors.duplicate"));
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

  const isAccepted = Number(form.result) === 1;

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={820}
      height="auto"
      maxHeight="94vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("certificatesOfAnalysis.form.editTitle")
                : t("certificatesOfAnalysis.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("certificatesOfAnalysis.form.editSubtitle")
                : t("certificatesOfAnalysis.form.createSubtitle")}
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
          className="flex flex-col gap-5 max-h-[74vh] overflow-y-auto pe-1"
        >
          {/* ============ القسم 1: المعلومات الأساسية ============ */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
              {t("certificatesOfAnalysis.form.sectionBasicInfo")}
            </h4>

            <div className="flex flex-col gap-4">
              {/* الرقم + التاريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("certificatesOfAnalysis.form.number")}
                  </label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setField("number", e.target.value)}
                    placeholder={t(
                      "certificatesOfAnalysis.form.numberPlaceholder",
                    )}
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
                    {t("certificatesOfAnalysis.form.analysisDate")}
                  </label>
                  <DateBox
                    value={form.analysisDate}
                    onValueChanged={(e) => setField("analysisDate", e.value)}
                    type="datetime"
                    displayFormat="yyyy-MM-dd HH:mm"
                    placeholder={t(
                      "certificatesOfAnalysis.form.analysisDatePlaceholder",
                    )}
                    width="100%"
                    className={errors.analysisDate ? "dx-invalid" : ""}
                  />
                  {errors.analysisDate && (
                    <p className="text-xs text-danger mt-1">
                      {errors.analysisDate}
                    </p>
                  )}
                </div>
              </div>

              {/* العينة */}
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.supplierSample")}
                </label>
                <select
                  value={form.supplierSampleId}
                  onChange={(e) => setField("supplierSampleId", e.target.value)}
                  className={inputClass(errors.supplierSampleId)}
                >
                  <option value="">
                    {t("certificatesOfAnalysis.form.selectSupplierSample")}
                  </option>
                  {supplierSamples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.number} —{" "}
                      {s.supplierNameAr ||
                        s.supplierNameEn ||
                        s.materialNameAr ||
                        s.materialNameEn ||
                        `#${s.id}`}
                    </option>
                  ))}
                </select>
                {errors.supplierSampleId && (
                  <p className="text-xs text-danger mt-1">
                    {errors.supplierSampleId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ============ القسم 2: الفحوصات الفيزيائية ============ */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
              {t("certificatesOfAnalysis.form.sectionPhysical")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.physicalAppearance")}
                </label>
                <input
                  type="text"
                  value={form.physicalAppearance}
                  onChange={(e) =>
                    setField("physicalAppearance", e.target.value)
                  }
                  placeholder={t(
                    "certificatesOfAnalysis.form.physicalAppearancePlaceholder",
                  )}
                  className={inputClass(false)}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.moisturePercentage")}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.moisturePercentage}
                  onChange={(e) =>
                    setField("moisturePercentage", e.target.value)
                  }
                  placeholder={t(
                    "certificatesOfAnalysis.form.moisturePercentagePlaceholder",
                  )}
                  className={inputClass(errors.moisturePercentage)}
                  dir="ltr"
                />
                {errors.moisturePercentage && (
                  <p className="text-xs text-danger mt-1">
                    {errors.moisturePercentage}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.color")}
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                  placeholder={t(
                    "certificatesOfAnalysis.form.colorPlaceholder",
                  )}
                  className={inputClass(false)}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.odor")}
                </label>
                <input
                  type="text"
                  value={form.odor}
                  onChange={(e) => setField("odor", e.target.value)}
                  placeholder={t("certificatesOfAnalysis.form.odorPlaceholder")}
                  className={inputClass(false)}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.microscopicAppearance")}
                </label>
                <input
                  type="text"
                  value={form.microscopicAppearance}
                  onChange={(e) =>
                    setField("microscopicAppearance", e.target.value)
                  }
                  placeholder={t(
                    "certificatesOfAnalysis.form.microscopicAppearancePlaceholder",
                  )}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>

          {/* ============ القسم 3: الفحوصات الميكروبية ============ */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
              {t("certificatesOfAnalysis.form.sectionMicrobiological")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.bacterialTest")}
                </label>
                <input
                  type="text"
                  value={form.bacterialTest}
                  onChange={(e) => setField("bacterialTest", e.target.value)}
                  placeholder={t(
                    "certificatesOfAnalysis.form.bacterialTestPlaceholder",
                  )}
                  className={inputClass(false)}
                  dir="ltr"
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.fungalTest")}
                </label>
                <input
                  type="text"
                  value={form.fungalTest}
                  onChange={(e) => setField("fungalTest", e.target.value)}
                  placeholder={t(
                    "certificatesOfAnalysis.form.fungalTestPlaceholder",
                  )}
                  className={inputClass(false)}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* ============ القسم 4: النتيجة والملاحظات ============ */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-800 mb-3 pb-2 border-b border-border">
              {t("certificatesOfAnalysis.form.sectionResult")}
            </h4>

            <div className="flex flex-col gap-4">
              {/* النتيجة */}
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.result")}
                </label>
                <select
                  value={form.result}
                  onChange={(e) => handleResultChange(e.target.value)}
                  className={inputClass(errors.result)}
                >
                  {ANALYSIS_RESULTS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(`certificatesOfAnalysis.results.${r.key}`)}
                    </option>
                  ))}
                </select>
                {errors.result && (
                  <p className="text-xs text-danger mt-1">{errors.result}</p>
                )}
              </div>

              {/* سبب الرفض (معطّل إذا كانت النتيجة مقبول) */}
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.rejectionReason")}
                </label>
                <textarea
                  value={form.rejectionReason}
                  onChange={(e) => setField("rejectionReason", e.target.value)}
                  placeholder={
                    isAccepted
                      ? t(
                          "certificatesOfAnalysis.form.rejectionReasonDisabledHint",
                        )
                      : t(
                          "certificatesOfAnalysis.form.rejectionReasonPlaceholder",
                        )
                  }
                  rows={2}
                  disabled={isAccepted}
                  className={
                    inputClass(errors.rejectionReason) +
                    " resize-none disabled:bg-secondary-50 disabled:text-secondary-400 disabled:cursor-not-allowed"
                  }
                />
                {errors.rejectionReason && (
                  <p className="text-xs text-danger mt-1">
                    {errors.rejectionReason}
                  </p>
                )}
              </div>

              {/* الملاحظات */}
              <div>
                <label className={labelClass}>
                  {t("certificatesOfAnalysis.form.notes")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder={t(
                    "certificatesOfAnalysis.form.notesPlaceholder",
                  )}
                  rows={2}
                  className={inputClass(false) + " resize-none"}
                />
              </div>
            </div>
          </div>

          {/* الحالة (تعديل فقط) */}
          {isEdit && (
            <div
              className="flex items-center justify-between gap-4 p-3 rounded-md
                            border border-border bg-secondary-50/50"
            >
              <div>
                <p className="text-sm font-medium text-secondary-800">
                  {t("certificatesOfAnalysis.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("certificatesOfAnalysis.form.statusActiveHint")
                    : t("certificatesOfAnalysis.form.statusInactiveHint")}
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
          <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-border">
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
                  ? t("certificatesOfAnalysis.form.saving")
                  : t("certificatesOfAnalysis.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
