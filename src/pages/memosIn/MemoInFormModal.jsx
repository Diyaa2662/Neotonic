// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import DateBox from "devextreme-react/date-box";
import { AlertCircle, Save, X, Plus, Trash2, Package } from "lucide-react";
import { memosInApi } from "../../api/memosIn";
import { suppliersApi } from "../../api/suppliers";
import { materialsApi } from "../../api/materials";

const emptyDetail = {
  materialId: "",
  quantity: "",
  splitQuantity: "",
  lot: "",
  factoryName: "",
  countryOrigin: "",
  productionDate: null,
  expiryDate: null,
  notes: "",
};

const emptyForm = {
  number: "",
  memoDate: null,
  invoiceNumber: "",
  invoiceDate: null,
  supplierId: "",
  notes: "",
  details: [],
};

export default function MemoInFormModal({
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
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [errors, setErrors] = useState({});
  const [detailErrors, setDetailErrors] = useState([]);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // جلب الموردين والمواد
  useEffect(() => {
    if (!visible) return;
    suppliersApi
      .listAllActive()
      .then(setSuppliers)
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
          number: editing.number ?? "",
          memoDate: editing.memoDate ? new Date(editing.memoDate) : null,
          invoiceNumber: editing.invoiceNumber || "",
          invoiceDate: editing.invoiceDate
            ? new Date(editing.invoiceDate)
            : null,
          supplierId: editing.supplierId ?? "",
          notes: editing.notes || "",
          details: [],
        });
        setIsActive(editing.isActive ?? true);
        setActiveTab("data");

        // جلب التفاصيل الكاملة
        memosInApi.getById(editing.id).then((data) => {
          setForm((prev) => ({
            ...prev,
            details: (data.details || []).map((d) => ({
              id: d.id,
              materialId: d.materialId,
              quantity: d.quantity,
              splitQuantity: d.splitQuantity,
              lot: d.lot || "",
              factoryName: d.factoryName || "",
              countryOrigin: d.countryOrigin || "",
              productionDate: d.productionDate
                ? new Date(d.productionDate)
                : null,
              expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
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

  // ============ إدارة التفاصيل ============
  const addDetail = () => {
    setForm((prev) => ({
      ...prev,
      details: [...prev.details, { ...emptyDetail }],
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

  // حساب عدد UOMs لكل تفصيل (للعرض فقط)
  const getUOMCount = (detail) => {
    const q = Number(detail.quantity);
    const s = Number(detail.splitQuantity);
    if (!q || !s || s <= 0) return 0;
    return Math.ceil(q / s);
  };

  const validate = () => {
    const e = {};
    const dErrors = [];

    if (form.number === "" || form.number === null) {
      e.number = t("memosIn.form.errors.numberRequired");
    }
    if (!form.memoDate) {
      e.memoDate = t("memosIn.form.errors.memoDateRequired");
    }
    if (!form.invoiceNumber.trim()) {
      e.invoiceNumber = t("memosIn.form.errors.invoiceNumberRequired");
    }
    if (!form.invoiceDate) {
      e.invoiceDate = t("memosIn.form.errors.invoiceDateRequired");
    }
    if (!form.supplierId) {
      e.supplierId = t("memosIn.form.errors.supplierRequired");
    }
    if (form.details.length === 0) {
      e.details = t("memosIn.form.errors.detailsRequired");
    }

    form.details.forEach((d) => {
      const de = {};
      if (!d.materialId) {
        de.materialId = t("memosIn.form.errors.detailMaterialRequired");
      }
      if (d.quantity === "" || d.quantity === null) {
        de.quantity = t("memosIn.form.errors.detailQuantityRequired");
      } else if (isNaN(Number(d.quantity)) || Number(d.quantity) <= 0) {
        de.quantity = t("memosIn.form.errors.detailQuantityInvalid");
      }
      if (d.splitQuantity === "" || d.splitQuantity === null) {
        de.splitQuantity = t("memosIn.form.errors.detailSplitQuantityRequired");
      } else if (
        isNaN(Number(d.splitQuantity)) ||
        Number(d.splitQuantity) <= 0
      ) {
        de.splitQuantity = t("memosIn.form.errors.detailSplitQuantityInvalid");
      }
      if (!d.lot.trim()) {
        de.lot = t("memosIn.form.errors.detailLotRequired");
      }
      if (!d.factoryName.trim()) {
        de.factoryName = t("memosIn.form.errors.detailFactoryNameRequired");
      }
      if (!d.countryOrigin.trim()) {
        de.countryOrigin = t("memosIn.form.errors.detailCountryOriginRequired");
      }
      if (!d.productionDate) {
        de.productionDate = t(
          "memosIn.form.errors.detailProductionDateRequired",
        );
      }
      if (!d.expiryDate) {
        de.expiryDate = t("memosIn.form.errors.detailExpiryDateRequired");
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
      number: Number(form.number),
      memoDate:
        form.memoDate instanceof Date
          ? form.memoDate.toISOString()
          : new Date(form.memoDate).toISOString(),
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate:
        form.invoiceDate instanceof Date
          ? form.invoiceDate.toISOString()
          : new Date(form.invoiceDate).toISOString(),
      supplierId: Number(form.supplierId),
      workOrderId: null,
      notes: form.notes.trim(),
      details: form.details.map((d) => ({
        ...(d.id ? { id: d.id } : {}),
        materialId: Number(d.materialId),
        quantity: Number(d.quantity),
        splitQuantity: Number(d.splitQuantity),
        lot: d.lot.trim(),
        factoryName: d.factoryName.trim(),
        countryOrigin: d.countryOrigin.trim(),
        productionDate:
          d.productionDate instanceof Date
            ? d.productionDate.toISOString()
            : new Date(d.productionDate).toISOString(),
        expiryDate:
          d.expiryDate instanceof Date
            ? d.expiryDate.toISOString()
            : new Date(d.expiryDate).toISOString(),
        unitId: null,
        notes: d.notes.trim(),
      })),
    };

    setLoading(true);
    try {
      let result;
      if (isEdit) {
        result = await memosInApi.update(editing.id, payload);
        if (isActive !== editing.isActive) {
          await memosInApi.setStatus(editing.id, isActive);
          result = { ...result, isActive };
        }
      } else {
        result = await memosInApi.create(payload);
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
        setServerError(t("memosIn.form.errors.badRequest"));
      else if (status === 404)
        setServerError(t("memosIn.form.errors.notFound"));
      else if (status === 409)
        setServerError(t("memosIn.form.errors.duplicate"));
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
  const smallLabelClass = "block text-xs font-medium text-secondary-600 mb-1";

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={960}
      height="auto"
      maxHeight="95vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-secondary-900">
              {isEdit
                ? t("memosIn.form.editTitle")
                : t("memosIn.form.createTitle")}
            </h3>
            <p className="text-sm text-secondary-500 mt-0.5">
              {isEdit
                ? t("memosIn.form.editSubtitle")
                : t("memosIn.form.createSubtitle")}
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
            {t("memosIn.form.tabData")}
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
            {t("memosIn.form.tabDetails", {
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
          {/* ============ تبويب البيانات ============ */}
          {activeTab === "data" && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pe-1">
              {/* الرقم + تاريخ المذكرة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("memosIn.form.number")}
                  </label>
                  <input
                    type="number"
                    value={form.number}
                    onChange={(e) => setField("number", e.target.value)}
                    placeholder={t("memosIn.form.numberPlaceholder")}
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
                    {t("memosIn.form.memoDate")}
                  </label>
                  <DateBox
                    value={form.memoDate}
                    onValueChanged={(e) => setField("memoDate", e.value)}
                    type="datetime"
                    displayFormat="yyyy-MM-dd HH:mm"
                    placeholder={t("memosIn.form.memoDatePlaceholder")}
                    width="100%"
                    className={errors.memoDate ? "dx-invalid" : ""}
                  />
                  {errors.memoDate && (
                    <p className="text-xs text-danger mt-1">
                      {errors.memoDate}
                    </p>
                  )}
                </div>
              </div>

              {/* رقم الفاتورة + تاريخها */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("memosIn.form.invoiceNumber")}
                  </label>
                  <input
                    type="text"
                    value={form.invoiceNumber}
                    onChange={(e) => setField("invoiceNumber", e.target.value)}
                    placeholder={t("memosIn.form.invoiceNumberPlaceholder")}
                    className={inputClass(errors.invoiceNumber)}
                    dir="ltr"
                  />
                  {errors.invoiceNumber && (
                    <p className="text-xs text-danger mt-1">
                      {errors.invoiceNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    {t("memosIn.form.invoiceDate")}
                  </label>
                  <DateBox
                    value={form.invoiceDate}
                    onValueChanged={(e) => setField("invoiceDate", e.value)}
                    type="datetime"
                    displayFormat="yyyy-MM-dd HH:mm"
                    placeholder={t("memosIn.form.invoiceDatePlaceholder")}
                    width="100%"
                    className={errors.invoiceDate ? "dx-invalid" : ""}
                  />
                  {errors.invoiceDate && (
                    <p className="text-xs text-danger mt-1">
                      {errors.invoiceDate}
                    </p>
                  )}
                </div>
              </div>

              {/* المورد */}
              <div>
                <label className={labelClass}>
                  {t("memosIn.form.supplier")}
                </label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setField("supplierId", e.target.value)}
                  className={inputClass(errors.supplierId)}
                >
                  <option value="">{t("memosIn.form.selectSupplier")}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierNumber} — {s.nameAr || s.nameEn}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-xs text-danger mt-1">
                    {errors.supplierId}
                  </p>
                )}
              </div>

              {/* الملاحظات */}
              <div>
                <label className={labelClass}>{t("memosIn.form.notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder={t("memosIn.form.notesPlaceholder")}
                  rows={3}
                  className={inputClass(false) + " resize-none"}
                />
              </div>

              {/* الحالة النشطة */}
              {isEdit && (
                <div
                  className="flex items-center justify-between gap-4 p-3 rounded-md
                                border border-border bg-secondary-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-secondary-800">
                      {t("memosIn.form.isActiveLabel")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {isActive
                        ? t("memosIn.form.isActiveHint")
                        : t("memosIn.form.isInactiveHint")}
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

          {/* ============ تبويب التفاصيل ============ */}
          {activeTab === "details" && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pe-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-800">
                    {t("memosIn.form.detailsTitle")}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {t("memosIn.form.detailsHint", {
                      count: form.details.length,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDetail}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md
                             bg-primary text-white text-sm font-medium
                             hover:bg-primary-700 transition"
                >
                  <Plus size={16} />
                  <span>{t("memosIn.form.addDetail")}</span>
                </button>
              </div>

              {errors.details && (
                <p className="text-xs text-danger">{errors.details}</p>
              )}

              {form.details.length === 0 ? (
                <div
                  className="border border-dashed border-border rounded-md
                                p-8 text-center text-secondary-400 text-sm"
                >
                  {t("memosIn.form.noDetails")}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {form.details.map((detail, index) => {
                    const de = detailErrors[index] || {};
                    const uomCount = getUOMCount(detail);
                    return (
                      <div
                        key={index}
                        className="border border-border rounded-md p-4 bg-white"
                      >
                        {/* رأس التفصيل */}
                        <div className="flex items-center justify-between mb-4">
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
                              {t("memosIn.form.detailSection", {
                                index: index + 1,
                              })}
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

                        {/* المادة + الكمية + كمية التقسيم */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailMaterial")}
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
                            >
                              <option value="">-</option>
                              {materials.map((m) => (
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
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailQuantity")}
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

                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailSplitQuantity")}
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={detail.splitQuantity}
                              onChange={(e) =>
                                setDetailField(
                                  index,
                                  "splitQuantity",
                                  e.target.value,
                                )
                              }
                              className={inputClass(!!de.splitQuantity)}
                              dir="ltr"
                            />
                            {de.splitQuantity && (
                              <p className="text-xs text-danger mt-1">
                                {de.splitQuantity}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Lot + المصنع + البلد */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailLot")}
                            </label>
                            <input
                              type="text"
                              value={detail.lot}
                              onChange={(e) =>
                                setDetailField(index, "lot", e.target.value)
                              }
                              className={inputClass(!!de.lot)}
                              dir="ltr"
                            />
                            {de.lot && (
                              <p className="text-xs text-danger mt-1">
                                {de.lot}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailFactoryName")}
                            </label>
                            <input
                              type="text"
                              value={detail.factoryName}
                              onChange={(e) =>
                                setDetailField(
                                  index,
                                  "factoryName",
                                  e.target.value,
                                )
                              }
                              className={inputClass(!!de.factoryName)}
                            />
                            {de.factoryName && (
                              <p className="text-xs text-danger mt-1">
                                {de.factoryName}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailCountryOrigin")}
                            </label>
                            <input
                              type="text"
                              value={detail.countryOrigin}
                              onChange={(e) =>
                                setDetailField(
                                  index,
                                  "countryOrigin",
                                  e.target.value,
                                )
                              }
                              className={inputClass(!!de.countryOrigin)}
                            />
                            {de.countryOrigin && (
                              <p className="text-xs text-danger mt-1">
                                {de.countryOrigin}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* تاريخ الإنتاج + الانتهاء */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailProductionDate")}
                            </label>
                            <DateBox
                              value={detail.productionDate}
                              onValueChanged={(e) =>
                                setDetailField(index, "productionDate", e.value)
                              }
                              type="datetime"
                              displayFormat="yyyy-MM-dd"
                              width="100%"
                              className={de.productionDate ? "dx-invalid" : ""}
                            />
                            {de.productionDate && (
                              <p className="text-xs text-danger mt-1">
                                {de.productionDate}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className={smallLabelClass}>
                              {t("memosIn.form.detailExpiryDate")}
                            </label>
                            <DateBox
                              value={detail.expiryDate}
                              onValueChanged={(e) =>
                                setDetailField(index, "expiryDate", e.value)
                              }
                              type="datetime"
                              displayFormat="yyyy-MM-dd"
                              width="100%"
                              className={de.expiryDate ? "dx-invalid" : ""}
                            />
                            {de.expiryDate && (
                              <p className="text-xs text-danger mt-1">
                                {de.expiryDate}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ملاحظات التفصيل */}
                        <div className="mb-3">
                          <label className={smallLabelClass}>
                            {t("memosIn.form.detailNotes")}
                          </label>
                          <input
                            type="text"
                            value={detail.notes}
                            onChange={(e) =>
                              setDetailField(index, "notes", e.target.value)
                            }
                            className={inputClass(false)}
                          />
                        </div>

                        {/* معلومات UOMs (للعرض فقط) */}
                        {uomCount > 0 && (
                          <div
                            className="flex items-center gap-2 p-2 rounded-md
                                          bg-blue-50 border border-blue-200"
                          >
                            <Package size={14} className="text-blue-600" />
                            <p className="text-xs text-blue-800">
                              {t("memosIn.form.detailUOMHint", {
                                count: uomCount,
                              })}
                            </p>
                          </div>
                        )}
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
                t("memosIn.form.detailsHint", {
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
                  {loading ? t("memosIn.form.saving") : t("memosIn.form.save")}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Popup>
  );
}
