import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X, Plus, Trash2 } from "lucide-react";
import { annualPlansApi } from "../../api/annualPlans";
import { departmentsApi } from "../../api/departments";
import { materialTypesApi } from "../../api/materialTypes";
import { materialsApi } from "../../api/materials";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

const emptyForm = {
  number: "",
  departmentId: "",
  materialTypeId: "",
  annualPlanDate: null,
  status: 0,
  notes: "",
  details: [],
};

export default function AnnualPlanFormModal({
  visible,
  onClose,
  onSaved,
  editing,
}) {
  const { t } = useTranslation();
  const isEdit = !!editing;

  const [activeTab, setActiveTab] = useState("data");
  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [errors, setErrors] = useState({});
  const [detailErrors, setDetailErrors] = useState([]);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب البيانات للقوائم المنسدلة
  useEffect(() => {
    if (!visible) return;
    departmentsApi
      .listAllActive()
      .then(setDepartments)
      .catch(() => []);
    materialTypesApi
      .listAllActive()
      .then(setMaterialTypes)
      .catch(() => []);
    materialsApi
      .listAllActive()
      .then(setMaterials)
      .catch(() => []);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          number: editing.number || "",
          departmentId: editing.departmentId ?? "",
          materialTypeId: editing.materialTypeId ?? "",
          annualPlanDate: editing.annualPlanDate
            ? new Date(editing.annualPlanDate)
            : null,
          status: editing.annualStatuses ?? 0,
          notes: editing.notes || "",
          details: [],
        });
        setIsActive(editing.isActive ?? true);
        setActiveTab("data");

        // جلب التفاصيل الكاملة
        annualPlansApi.getById(editing.id).then((details) => {
          setForm((prev) => ({
            ...prev,
            details: (details.details || []).map((d) => ({
              materialId: d.materialId,
              quantity: d.quantity,
              notes: d.notes || "",
            })),
          }));
        });
      } else {
        setForm(emptyForm);
        setIsActive(true);
        setActiveTab("data");
      }
      setErrors({});
      setDetailErrors([]);
      setServerError("");
      setLoading(false);
    }
  }, [visible, editing]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ✅ المواد المفلترة حسب نوع المادة المختار
  const filteredMaterials = useMemo(() => {
    if (!form.materialTypeId) return [];
    return materials.filter(
      (m) => String(m.materialTypeId) === String(form.materialTypeId),
    );
  }, [materials, form.materialTypeId]);

  // ✅ عند تغيير نوع المادة → مسح المواد في التفاصيل
  const handleMaterialTypeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      materialTypeId: value,
      details: prev.details.map((d) => ({ ...d, materialId: "" })),
    }));
    setDetailErrors((prev) => prev.map(() => ({})));
  };

  // ============ إدارة التفاصيل ============
  const addDetail = () => {
    setForm((prev) => ({
      ...prev,
      details: [...prev.details, { materialId: "", quantity: "", notes: "" }],
    }));
    setDetailErrors((prev) => [...prev, {}]);
  };

  const removeDetail = (index) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
    setDetailErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const setDetailField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((d, i) =>
        i === index ? { ...d, [key]: value } : d,
      ),
    }));
  };

  const validate = () => {
    const e = {};
    const dErrors = [];

    if (!form.number.trim()) {
      e.number = t("annualPlans.form.errors.numberRequired");
    }
    if (!form.departmentId) {
      e.departmentId = t("annualPlans.form.errors.departmentRequired");
    }
    if (!form.materialTypeId) {
      e.materialTypeId = t("annualPlans.form.errors.materialTypeRequired");
    }
    if (!form.annualPlanDate) {
      e.annualPlanDate = t("annualPlans.form.errors.annualPlanDateRequired");
    }
    if (isEdit && form.status === "") {
      e.status = t("annualPlans.form.errors.statusRequired");
    }

    // التحقق من كل تفصيل
    form.details.forEach((d) => {
      const de = {};
      if (!d.materialId) {
        de.materialId = t("annualPlans.form.errors.detailMaterialRequired");
      } else if (
        form.materialTypeId &&
        !filteredMaterials.some((m) => String(m.id) === String(d.materialId))
      ) {
        de.materialId = t("annualPlans.form.errors.detailMaterialWrongType");
      }
      if (d.quantity === "" || d.quantity === null) {
        de.quantity = t("annualPlans.form.errors.detailQuantityRequired");
      } else if (isNaN(Number(d.quantity))) {
        de.quantity = t("annualPlans.form.errors.detailQuantityInvalid");
      }
      dErrors.push(de);
    });

    setErrors(e);
    setDetailErrors(dErrors);

    const hasMainErrors = Object.keys(e).length > 0;
    const hasDetailErrors = dErrors.some((de) => Object.keys(de).length > 0);

    if (hasDetailErrors) {
      setActiveTab("details");
    }

    return !hasMainErrors && !hasDetailErrors;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    const payload = {
      number: form.number.trim(),
      departmentId: Number(form.departmentId),
      materialTypeId: Number(form.materialTypeId),
      annualPlanDate:
        form.annualPlanDate instanceof Date
          ? form.annualPlanDate.toISOString()
          : new Date(form.annualPlanDate).toISOString(),
      notes: form.notes.trim(),
      details: form.details.map((d) => ({
        materialId: Number(d.materialId),
        quantity: Number(d.quantity),
        notes: d.notes.trim(),
      })),
    };

    if (isEdit) {
      payload.status = Number(form.status);
    }

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await annualPlansApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await annualPlansApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await annualPlansApi.create(payload);
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
        setServerError(t("annualPlans.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("annualPlans.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("annualPlans.form.errors.duplicate"));
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
      width={900}
      height="auto"
      maxHeight="94vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("annualPlans.form.editTitle")
                : t("annualPlans.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("annualPlans.form.editSubtitle")
                : t("annualPlans.form.createSubtitle")}
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

        {/* التبويبات */}
        <div className="flex items-center gap-1 border-b border-border mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                        ${
                          activeTab === "data"
                            ? "text-primary"
                            : "text-secondary-500 hover:text-secondary-800"
                        }`}
          >
            {t("annualPlans.form.tabData")}
            {activeTab === "data" && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                        ${
                          activeTab === "details"
                            ? "text-primary"
                            : "text-secondary-500 hover:text-secondary-800"
                        }`}
          >
            {t("annualPlans.form.tabDetails", {
              count: form.details.length,
            })}
            {activeTab === "details" && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-4"
        >
          {/* ================== تبويب البيانات ================== */}
          {activeTab === "data" && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pe-1">
              {/* الرقم */}
              <div>
                <label className={labelClass}>
                  {t("annualPlans.form.number")}
                </label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => setField("number", e.target.value)}
                  placeholder={t("annualPlans.form.numberPlaceholder")}
                  className={inputClass(errors.number)}
                  dir="ltr"
                  autoFocus
                />
                {errors.number && (
                  <p className="text-xs text-danger mt-1">{errors.number}</p>
                )}
              </div>

              {/* القسم + نوع المادة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("annualPlans.form.department")}
                  </label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setField("departmentId", e.target.value)}
                    className={inputClass(errors.departmentId)}
                  >
                    <option value="">
                      {t("annualPlans.form.selectDepartment")}
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
                    {t("annualPlans.form.materialType")}
                  </label>
                  <select
                    value={form.materialTypeId}
                    onChange={(e) => handleMaterialTypeChange(e.target.value)}
                    className={inputClass(errors.materialTypeId)}
                  >
                    <option value="">
                      {t("annualPlans.form.selectMaterialType")}
                    </option>
                    {materialTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>
                        {mt.nameAr || mt.nameEn}
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

              {/* تاريخ الخطة */}
              <div>
                <label className={labelClass}>
                  {t("annualPlans.form.annualPlanDate")}
                </label>
                <DateBox
                  value={form.annualPlanDate}
                  onValueChanged={(e) => setField("annualPlanDate", e.value)}
                  type="datetime"
                  displayFormat="yyyy-MM-dd HH:mm"
                  placeholder={t("annualPlans.form.annualPlanDatePlaceholder")}
                  width="100%"
                  className={errors.annualPlanDate ? "dx-invalid" : ""}
                />
                {errors.annualPlanDate && (
                  <p className="text-xs text-danger mt-1">
                    {errors.annualPlanDate}
                  </p>
                )}
              </div>

              {/* الحالة (تعديل فقط) */}
              {isEdit && (
                <div>
                  <label className={labelClass}>
                    {t("annualPlans.form.status")}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className={inputClass(errors.status)}
                  >
                    {PURCHASE_ORDER_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {t(`annualPlans.statuses.${s.key}`)}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="text-xs text-danger mt-1">{errors.status}</p>
                  )}
                </div>
              )}

              {/* الملاحظات */}
              <div>
                <label className={labelClass}>
                  {t("annualPlans.form.notes")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder={t("annualPlans.form.notesPlaceholder")}
                  rows={3}
                  className={inputClass(false) + " resize-none"}
                />
              </div>

              {/* الحالة النشطة (تعديل فقط) */}
              {isEdit && (
                <div
                  className="flex items-center justify-between gap-4 p-3 rounded-md
                                border border-border bg-secondary-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-800">
                      {t("annualPlans.form.isActiveLabel")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {isActive
                        ? t("annualPlans.form.isActiveHint")
                        : t("annualPlans.form.isInactiveHint")}
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
            </div>
          )}

          {/* ================== تبويب التفاصيل ================== */}
          {activeTab === "details" && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pe-1">
              {/* رأس القسم + زر الإضافة */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-800">
                    {t("annualPlans.form.detailsTitle")}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {t("annualPlans.form.detailsHint", {
                      count: form.details.length,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDetail}
                  disabled={!form.materialTypeId}
                  title={
                    !form.materialTypeId
                      ? t("annualPlans.form.selectMaterialTypeFirst")
                      : ""
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md
                             bg-primary text-white text-sm font-medium
                             hover:bg-primary-700 transition
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  <span>{t("annualPlans.form.addDetail")}</span>
                </button>
              </div>

              {/* تنبيه: يجب اختيار نوع المادة أولاً */}
              {!form.materialTypeId && (
                <div
                  className="flex items-start gap-2 p-3 rounded-md
                                bg-amber-50 border border-amber-200 text-amber-800 text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{t("annualPlans.form.materialTypeRequiredHint")}</span>
                </div>
              )}

              {/* قائمة التفاصيل */}
              {form.details.length === 0 ? (
                <div
                  className="border border-dashed border-border rounded-md
                                p-8 text-center text-secondary-400 text-sm"
                >
                  {t("annualPlans.form.noDetails")}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {form.details.map((detail, index) => {
                    const de = detailErrors[index] || {};
                    return (
                      <div
                        key={index}
                        className="border border-border rounded-md p-4
                                   bg-white"
                      >
                        {/* رأس التفصيل + زر الحذف */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex-shrink-0 w-7 h-7 rounded-full
                                         bg-primary-50 text-primary text-xs font-bold
                                         inline-flex items-center justify-center"
                              dir="ltr"
                            >
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-secondary-700">
                              {t("annualPlans.form.detailMaterial")} {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="p-1.5 rounded text-secondary-400
                                       hover:text-danger hover:bg-red-50 transition"
                            title={t("common.delete")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* المادة + الكمية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-secondary-600 mb-1">
                              {t("annualPlans.form.detailMaterial")}
                            </label>
                            <select
                              value={detail.materialId}
                              onChange={(e) =>
                                setDetailField(
                                  index,
                                  "materialId",
                                  e.target.value,
                                )
                              }
                              className={inputClass(!!de.materialId)}
                              disabled={!form.materialTypeId}
                            >
                              <option value="">
                                {!form.materialTypeId
                                  ? t(
                                      "annualPlans.form.selectMaterialTypeFirst",
                                    )
                                  : "-"}
                              </option>
                              {filteredMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.materialNumber} — {m.nameAr || m.nameEn}
                                </option>
                              ))}
                            </select>
                            {de.materialId && (
                              <p className="text-xs text-danger mt-1">
                                {de.materialId}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-secondary-600 mb-1">
                              {t("annualPlans.form.detailQuantity")}
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={detail.quantity}
                              onChange={(e) =>
                                setDetailField(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              className={inputClass(!!de.quantity)}
                              dir="ltr"
                            />
                            {de.quantity && (
                              <p className="text-xs text-danger mt-1">
                                {de.quantity}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ملاحظات التفصيل */}
                        <div>
                          <label className="block text-xs font-medium text-secondary-600 mb-1">
                            {t("annualPlans.form.detailNotes")}
                          </label>
                          <input
                            type="text"
                            value={detail.notes}
                            onChange={(e) =>
                              setDetailField(index, "notes", e.target.value)
                            }
                            className={inputClass(false)}
                            placeholder={t("annualPlans.form.notesPlaceholder")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* الأزرار */}
          <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-border">
            <p className="text-xs text-secondary-400">
              {activeTab === "details" &&
                t("annualPlans.form.detailsHint", {
                  count: form.details.length,
                })}
            </p>
            <div className="flex items-center gap-2">
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
                    ? t("annualPlans.form.saving")
                    : t("annualPlans.form.save")}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Popup>
  );
}
