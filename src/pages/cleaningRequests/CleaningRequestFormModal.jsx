import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X } from "lucide-react";
import { cleaningRequestsApi } from "../../api/cleaningRequests";
import { departmentsApi } from "../../api/departments";
import { protocolsApi } from "../../api/protocols";
import { scalesApi } from "../../api/scales";
import { machinesApi } from "../../api/machines";
import { clothesApi } from "../../api/clothes";
import { CLEANING_TYPES } from "../../constants/cleaningTypes";

const emptyForm = {
  number: "",
  cleaningDateTime: null,
  departmentId: "",
  protocolId: "",
  cleaningType: "",
  relatedId: "",
};

export default function CleaningRequestFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [relatedOptions, setRelatedOptions] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب الأقسام والبروتوكولات
  useEffect(() => {
    if (!visible) return;
    departmentsApi
      .listAllActive()
      .then(setDepartments)
      .catch(() => []);
    protocolsApi
      .listAllActive()
      .then(setProtocols)
      .catch(() => []);
  }, [visible]);

  // جلب قائمة الـ relatedId حسب cleaningType
  useEffect(() => {
    if (!visible || !form.cleaningType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelatedOptions([]);
      return;
    }

    let cancelled = false;
    setLoadingRelated(true);
    setRelatedOptions([]);

    const fetchRelated = async () => {
      try {
        let items = [];
        switch (Number(form.cleaningType)) {
          case 1: // قسم
            items = await departmentsApi.listAllActive();
            break;
          case 2: // ميزان
            items = await scalesApi.listAllActive();
            break;
          case 3: // آلة
            items = await machinesApi.listAllActive();
            break;
          case 4: // ملابس
            items = await clothesApi.listAllActive();
            break;
          default:
            items = [];
        }
        if (!cancelled) setRelatedOptions(items);
      } catch {
        if (!cancelled) setRelatedOptions([]);
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    };

    fetchRelated();

    return () => {
      cancelled = true;
    };
  }, [visible, form.cleaningType]);

  // تحميل بيانات التعديل
  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          number: editing.number || "",
          cleaningDateTime: editing.cleaningDateTime
            ? new Date(editing.cleaningDateTime)
            : null,
          departmentId: editing.departmentId ?? "",
          protocolId: editing.protocolId ?? "",
          cleaningType: editing.cleaningType ?? "",
          relatedId: editing.relatedId ?? "",
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

  // عند تغيير cleaningType: نمسح relatedId
  const handleCleaningTypeChange = (value) => {
    setForm((prev) => ({ ...prev, cleaningType: value, relatedId: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.number.trim()) {
      e.number = t("cleaningRequests.form.errors.numberRequired");
    }
    if (!form.cleaningDateTime) {
      e.cleaningDateTime = t(
        "cleaningRequests.form.errors.cleaningDateTimeRequired",
      );
    }
    if (!form.departmentId) {
      e.departmentId = t("cleaningRequests.form.errors.departmentRequired");
    }
    if (!form.protocolId) {
      e.protocolId = t("cleaningRequests.form.errors.protocolRequired");
    }
    if (!form.cleaningType) {
      e.cleaningType = t("cleaningRequests.form.errors.cleaningTypeRequired");
    }
    if (!form.relatedId) {
      e.relatedId = t("cleaningRequests.form.errors.relatedRequired");
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
      cleaningDateTime:
        form.cleaningDateTime instanceof Date
          ? form.cleaningDateTime.toISOString()
          : new Date(form.cleaningDateTime).toISOString(),
      departmentId: Number(form.departmentId),
      protocolId: Number(form.protocolId),
      cleaningType: Number(form.cleaningType),
      relatedId: Number(form.relatedId),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await cleaningRequestsApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await cleaningRequestsApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await cleaningRequestsApi.create(payload);
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
        setServerError(t("cleaningRequests.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("cleaningRequests.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("cleaningRequests.form.errors.duplicate"));
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

  // الحصول على اسم الحقل المناسب لكل related option
  const getRelatedLabel = (item) => {
    // الأقسام والآلات والموازين والملابس لها نفس البنية تقريباً
    const num =
      item.departmentNumber || item.scaleNumber || item.machineNumber || "";
    const name = item.nameAr || item.nameEn;
    return num ? `${num} — ${name}` : name;
  };

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
                ? t("cleaningRequests.form.editTitle")
                : t("cleaningRequests.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("cleaningRequests.form.editSubtitle")
                : t("cleaningRequests.form.createSubtitle")}
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
                {t("cleaningRequests.form.number")}
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setField("number", e.target.value)}
                placeholder={t("cleaningRequests.form.numberPlaceholder")}
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
                {t("cleaningRequests.form.cleaningDateTime")}
              </label>
              <DateBox
                value={form.cleaningDateTime}
                onValueChanged={(e) => setField("cleaningDateTime", e.value)}
                type="datetime"
                displayFormat="yyyy-MM-dd HH:mm"
                placeholder={t(
                  "cleaningRequests.form.cleaningDateTimePlaceholder",
                )}
                width="100%"
                className={errors.cleaningDateTime ? "dx-invalid" : ""}
              />
              {errors.cleaningDateTime && (
                <p className="text-xs text-danger mt-1">
                  {errors.cleaningDateTime}
                </p>
              )}
            </div>
          </div>

          {/* القسم + البروتوكول */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("cleaningRequests.form.department")}
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setField("departmentId", e.target.value)}
                className={inputClass(errors.departmentId)}
              >
                <option value="">
                  {t("cleaningRequests.form.selectDepartment")}
                </option>
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

            <div>
              <label className={labelClass}>
                {t("cleaningRequests.form.protocol")}
              </label>
              <select
                value={form.protocolId}
                onChange={(e) => setField("protocolId", e.target.value)}
                className={inputClass(errors.protocolId)}
              >
                <option value="">
                  {t("cleaningRequests.form.selectProtocol")}
                </option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.protocolNumber} — {p.nameAr || p.nameEn}
                  </option>
                ))}
              </select>
              {errors.protocolId && (
                <p className="text-xs text-danger mt-1">{errors.protocolId}</p>
              )}
            </div>
          </div>

          {/* نوع التنظيف + الهدف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {t("cleaningRequests.form.cleaningType")}
              </label>
              <select
                value={form.cleaningType}
                onChange={(e) => handleCleaningTypeChange(e.target.value)}
                className={inputClass(errors.cleaningType)}
              >
                <option value="">
                  {t("cleaningRequests.form.selectCleaningType")}
                </option>
                {CLEANING_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {t(`cleaningRequests.cleaningTypes.${ct.key}`)}
                  </option>
                ))}
              </select>
              {errors.cleaningType && (
                <p className="text-xs text-danger mt-1">
                  {errors.cleaningType}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("cleaningRequests.form.related")}
              </label>
              <select
                value={form.relatedId}
                onChange={(e) => setField("relatedId", e.target.value)}
                className={inputClass(errors.relatedId)}
                disabled={!form.cleaningType || loadingRelated}
              >
                <option value="">
                  {!form.cleaningType
                    ? t("cleaningRequests.form.relatedPlaceholder")
                    : loadingRelated
                      ? t("common.loading")
                      : t("cleaningRequests.form.selectRelated")}
                </option>
                {relatedOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getRelatedLabel(item)}
                  </option>
                ))}
              </select>
              {errors.relatedId && (
                <p className="text-xs text-danger mt-1">{errors.relatedId}</p>
              )}
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
                  {t("cleaningRequests.form.statusLabel")}
                </p>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {isActive
                    ? t("cleaningRequests.form.statusActiveHint")
                    : t("cleaningRequests.form.statusInactiveHint")}
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
                {loading
                  ? t("cleaningRequests.form.saving")
                  : t("cleaningRequests.form.save")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
}
