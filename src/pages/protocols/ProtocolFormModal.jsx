import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import {
  AlertCircle,
  Save,
  X,
  ListPlus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { protocolsApi } from "../../api/protocols";
import StepsPickerModal from "./StepsPickerModal";

const emptyForm = {
  protocolNumber: "",
  nameAr: "",
  nameEn: "",
  protocolTypeId: "",
};

export default function ProtocolFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState([]);
  const [stepsPickerVisible, setStepsPickerVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const [protocolTypes, setProtocolTypes] = useState([]);

  // جلب أنواع البروتوكولات النشطة
  useEffect(() => {
    if (!visible) return;
    import("../../api/protocolTypes").then(({ protocolTypesApi }) => {
      protocolTypesApi
        .listAllActive()
        .then(setProtocolTypes)
        .catch(() => []);
    });
  }, [visible]);

  // تحميل البيانات عند الفتح
  useEffect(() => {
    if (visible && editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        protocolNumber: editing.protocolNumber || "",
        nameAr: editing.nameAr || "",
        nameEn: editing.nameEn || "",
        protocolTypeId: editing.protocolTypeId ?? "",
      });
      setIsActive(editing.isActive ?? true);
      setErrors({});
      setServerError("");
      setLoading(false);
      setLoadingStep("");

      protocolsApi.getById(editing.id).then((details) => {
        setSteps(details.steps || []);
      });
    } else if (visible) {
      setForm(emptyForm);
      setIsActive(true);
      setSteps([]);
      setErrors({});
      setServerError("");
      setLoading(false);
      setLoadingStep("");
    }
  }, [visible, editing]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e = {};
    const ar = form.nameAr.trim();
    const en = form.nameEn.trim();

    if (!form.protocolNumber.trim()) {
      e.protocolNumber = t("protocols.form.errors.protocolNumberRequired");
    }
    if (!ar && !en) {
      e.nameAr = t("protocols.form.errors.atLeastOne");
      e.nameEn = t("protocols.form.errors.atLeastOne");
    }
    if (!form.protocolTypeId) {
      e.protocolTypeId = t("protocols.form.errors.protocolTypeRequired");
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
      protocolNumber: form.protocolNumber.trim(),
      nameAr: ar || en,
      nameEn: en || ar,
      protocolTypeId: Number(form.protocolTypeId),
    };

    setLoading(true);
    try {
      let result;

      if (isEdit) {
        // ====== مسار التعديل ======
        setLoadingStep("protocol");
        result = await protocolsApi.update(editing.id, payload);

        setLoadingStep("steps");
        await protocolsApi.updateSteps(
          editing.id,
          steps.map((s) => s.stepId),
        );

        if (isActive !== editing.isActive) {
          setLoadingStep("status");
          await protocolsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        // ====== مسار الإنشاء ======
        setLoadingStep("protocol");
        const created = await protocolsApi.create(payload);

        // بعد الحصول على id، نرسل المراحل
        if (steps.length > 0) {
          setLoadingStep("steps");
          try {
            await protocolsApi.updateSteps(
              created.id,
              steps.map((s) => s.stepId),
            );
            // eslint-disable-next-line no-unused-vars
          } catch (stepsErr) {
            // البروتوكول أُنشئ، لكن المراحل فشلت
            setServerError(
              t("protocols.form.errors.stepsFailedAfterCreate", {
                number: created.protocolNumber,
              }),
            );
            onSaved?.(created);
            setLoading(false);
            setLoadingStep("");
            return;
          }
        }

        result = created;
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
        setServerError(t("protocols.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("protocols.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("protocols.form.errors.duplicate"));
      else if (!err.response) setServerError(t("login.errors.networkError"));
      else setServerError(t("login.errors.generic"));
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleStepsConfirm = (pickedIds) => {
    const newSteps = pickedIds.map((id, index) => {
      const existing = steps.find((s) => s.stepId === id);
      return (
        existing || {
          stepId: id,
          stepNumber: "",
          stepNameAr: "",
          stepNameEn: "",
          orderIndex: index + 1,
        }
      );
    });
    setSteps(newSteps);
  };

  const removeStep = (stepId) => {
    setSteps((prev) => prev.filter((s) => s.stepId !== stepId));
  };

  const moveStep = (index, direction) => {
    setSteps((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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

  // نص زر الحفظ حسب المرحلة
  const submitLabel = () => {
    if (!loading) return t("protocols.form.save");
    if (loadingStep === "steps") return t("protocols.form.savingSteps");
    if (loadingStep === "status") return t("protocols.form.savingStatus");
    return t("protocols.form.saving");
  };

  return (
    <>
      <Popup
        visible={visible}
        onHiding={onClose}
        dragEnabled={false}
        showCloseButton={false}
        showTitle={false}
        width={700}
        height="auto"
        maxHeight="90vh"
        wrapperAttr={{ class: "category-form-popup" }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-secondary-900">
                {isEdit
                  ? t("protocols.form.editTitle")
                  : t("protocols.form.createTitle")}
              </h3>
              <p className="text-sm text-secondary-500 mt-0.5">
                {isEdit
                  ? t("protocols.form.editSubtitle")
                  : t("protocols.form.createSubtitle")}
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
            className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pe-1"
          >
            <p className="text-xs text-secondary-500 -mb-1">
              {t("protocols.form.atLeastOneHint")}
            </p>

            {/* رقم البروتوكول + نوع البروتوكول */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("protocols.form.protocolNumber")}
                </label>
                <input
                  type="text"
                  value={form.protocolNumber}
                  onChange={(e) => setField("protocolNumber", e.target.value)}
                  placeholder={t("protocols.form.protocolNumberPlaceholder")}
                  className={inputClass(errors.protocolNumber)}
                  dir="ltr"
                  autoFocus
                />
                {errors.protocolNumber && (
                  <p className="text-xs text-danger mt-1">
                    {errors.protocolNumber}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("protocols.form.protocolType")}
                </label>
                <select
                  value={form.protocolTypeId}
                  onChange={(e) => setField("protocolTypeId", e.target.value)}
                  className={inputClass(errors.protocolTypeId)}
                >
                  <option value="">
                    {t("protocols.form.selectProtocolType")}
                  </option>
                  {protocolTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.nameAr || pt.nameEn}
                    </option>
                  ))}
                </select>
                {errors.protocolTypeId && (
                  <p className="text-xs text-danger mt-1">
                    {errors.protocolTypeId}
                  </p>
                )}
              </div>
            </div>

            {/* الأسماء */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t("protocols.form.nameAr")}
                </label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setField("nameAr", e.target.value)}
                  placeholder={t("protocols.form.nameArPlaceholder")}
                  className={inputClass(errors.nameAr)}
                />
                {errors.nameAr && (
                  <p className="text-xs text-danger mt-1">{errors.nameAr}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {t("protocols.form.nameEn")}
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  placeholder={t("protocols.form.nameEnPlaceholder")}
                  className={inputClass(errors.nameEn)}
                  dir="ltr"
                />
                {errors.nameEn && (
                  <p className="text-xs text-danger mt-1">{errors.nameEn}</p>
                )}
              </div>
            </div>

            {/* إدارة المراحل - في الوضعين */}
            <div className="border border-border rounded-md p-4 bg-secondary-50/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-secondary-800">
                    {t("protocols.form.stepsTitle")}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {t("protocols.form.stepsHint", { count: steps.length })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStepsPickerVisible(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md
                             bg-white border border-border text-sm font-medium
                             text-secondary-700 hover:bg-secondary-50 transition"
                >
                  <ListPlus size={16} />
                  <span>{t("protocols.form.manageSteps")}</span>
                </button>
              </div>

              {steps.length === 0 ? (
                <p className="text-xs text-secondary-400 text-center py-4">
                  {t("protocols.form.noSteps")}
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {steps.map((step, index) => (
                    <li
                      key={step.stepId}
                      className="flex items-center gap-2 px-3 py-2
                                 bg-white border border-border rounded-md
                                 hover:border-primary-200 transition-colors"
                    >
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full
                                   bg-primary-50 text-primary text-xs font-bold
                                   inline-flex items-center justify-center"
                        dir="ltr"
                      >
                        {index + 1}
                      </span>

                      <span className="flex-1 min-w-0 text-sm text-secondary-800 truncate">
                        {step.stepNameAr ||
                          step.stepNameEn ||
                          `${t("protocols.form.step")} #${step.stepId}`}
                      </span>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          title={t("protocols.form.moveUp")}
                          className="p-1 rounded text-secondary-500
                                     hover:text-primary hover:bg-primary-50 transition
                                     disabled:opacity-30 disabled:cursor-not-allowed
                                     disabled:hover:text-secondary-500 disabled:hover:bg-transparent"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 1)}
                          disabled={index === steps.length - 1}
                          title={t("protocols.form.moveDown")}
                          className="p-1 rounded text-secondary-500
                                     hover:text-primary hover:bg-primary-50 transition
                                     disabled:opacity-30 disabled:cursor-not-allowed
                                     disabled:hover:text-secondary-500 disabled:hover:bg-transparent"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStep(step.stepId)}
                        className="flex-shrink-0 p-1 rounded text-secondary-400
                                   hover:text-danger hover:bg-red-50 transition"
                        title={t("common.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* الحالة (تعديل فقط) */}
            {isEdit && (
              <div
                className="flex items-center justify-between gap-4 p-3 rounded-md
                              border border-border bg-secondary-50/50"
              >
                <div>
                  <p className="text-sm font-medium text-secondary-800">
                    {t("protocols.form.statusLabel")}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {isActive
                      ? t("protocols.form.statusActiveHint")
                      : t("protocols.form.statusInactiveHint")}
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
                           disabled:opacity-60 disabled:cursor-not-allowed
                           min-w-[140px] justify-center"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{submitLabel()}</span>
              </button>
            </div>
          </form>
        </div>
      </Popup>

      {/* نافذة اختيار المراحل */}
      <StepsPickerModal
        visible={stepsPickerVisible}
        onClose={() => setStepsPickerVisible(false)}
        onConfirm={handleStepsConfirm}
        selectedIds={steps.map((s) => s.stepId)}
      />
    </>
  );
}
