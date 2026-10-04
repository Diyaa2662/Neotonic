import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import TreeList, { Column, Scrolling } from "devextreme-react/tree-list";
import {
  AlertCircle,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Search,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { protocolsApi } from "../../api/protocols";
import { stepTypesApi } from "../../api/stepTypes";
import { stepsApi } from "../../api/steps";

const emptyForm = {
  protocolNumber: "",
  nameAr: "",
  nameEn: "",
  stepTypeId: "",
};

export default function ProtocolFormModal({
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
  const [steps, setSteps] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const [stepTypes, setStepTypes] = useState([]);
  const [allSteps, setAllSteps] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);

  // ===================== جلب البيانات =====================
  useEffect(() => {
    if (!visible) return;

    stepTypesApi
      .listAllActive()
      .then(setStepTypes)
      .catch(() => []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTreeLoading(true);
    stepsApi
      .list({ page: 1, pageSize: 1000 })
      .then((data) => {
        const active = (data.items || []).filter((s) => s.isActive);
        setAllSteps(active);
      })
      .catch(() => setAllSteps([]))
      .finally(() => setTreeLoading(false));
  }, [visible]);

  // تحميل بيانات البروتوكول عند الفتح
  useEffect(() => {
    if (visible && editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        protocolNumber: editing.protocolNumber || "",
        nameAr: editing.nameAr || "",
        nameEn: editing.nameEn || "",
        stepTypeId: editing.stepTypeId ?? "",
      });
      setIsActive(editing.isActive ?? true);
      setActiveTab("data");
      setErrors({});
      setServerError("");
      setLoading(false);
      setLoadingStep("");
      setTreeSearch("");

      protocolsApi.getById(editing.id).then((details) => {
        setSteps(details.steps || []);
      });
    } else if (visible) {
      setForm(emptyForm);
      setIsActive(true);
      setSteps([]);
      setActiveTab("data");
      setErrors({});
      setServerError("");
      setLoading(false);
      setLoadingStep("");
      setTreeSearch("");
      setExpandedKeys([]);
    }
  }, [visible, editing]);

  // ===================== TreeList Data =====================
  const treeData = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();

    const filteredSteps = q
      ? allSteps.filter((s) => {
          return (
            (s.stepNameAr || "").toLowerCase().includes(q) ||
            (s.stepNameEn || "").toLowerCase().includes(q) ||
            String(s.stepNumber).includes(q)
          );
        })
      : allSteps;

    const nodes = [];

    stepTypes.forEach((type) => {
      const typeSteps = filteredSteps.filter((s) => s.stepTypeId === type.id);

      // في وضع البحث: لا نعرض الأنواع الفارغة
      if (q && typeSteps.length === 0) return;

      nodes.push({
        id: `type-${type.id}`,
        parentId: 0,
        name: type.nameAr || type.nameEn,
        nameEn: type.nameEn,
        isType: true,
        typeId: type.id,
        stepCount: typeSteps.length,
      });

      typeSteps.forEach((step) => {
        nodes.push({
          id: `step-${step.id}`,
          parentId: `type-${type.id}`,
          name: step.stepNameAr || step.stepNameEn,
          nameEn: step.stepNameEn,
          stepNumber: step.stepNumber,
          stepId: step.id,
          isType: false,
          typeId: type.id,
          boxPath: step.boxPath,
        });
      });
    });

    return nodes;
  }, [stepTypes, allSteps, treeSearch]);

  // في وضع البحث: نوسّع كل الأنواع
  useEffect(() => {
    if (treeSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedKeys(treeData.filter((n) => n.isType).map((n) => n.id));
    }
  }, [treeSearch, treeData]);

  const selectedStepIds = useMemo(() => steps.map((s) => s.stepId), [steps]);

  // ===================== Helpers =====================
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
    if (!form.stepTypeId) {
      e.stepTypeId = t("protocols.form.errors.stepTypeRequired");
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
      stepTypeId: Number(form.stepTypeId),
    };

    setLoading(true);
    try {
      let result;

      if (isEdit) {
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
        setLoadingStep("protocol");
        const created = await protocolsApi.create(payload);

        if (steps.length > 0) {
          setLoadingStep("steps");
          try {
            await protocolsApi.updateSteps(
              created.id,
              steps.map((s) => s.stepId),
            );
          } catch {
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

  // ===================== إدارة المراحل =====================
  const addStep = (stepId) => {
    if (selectedStepIds.includes(stepId)) return;
    const step = allSteps.find((s) => s.id === stepId);
    if (!step) return;

    setSteps((prev) => [
      ...prev,
      {
        stepId: step.id,
        stepNumber: step.stepNumber,
        stepNameAr: step.stepNameAr,
        stepNameEn: step.stepNameEn,
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const addManySteps = (stepsToAdd) => {
    setSteps((prev) => {
      const existing = new Set(prev.map((s) => s.stepId));
      const toAdd = stepsToAdd
        .filter((s) => !existing.has(s.id))
        .map((s) => ({
          stepId: s.id,
          stepNumber: s.stepNumber,
          stepNameAr: s.stepNameAr,
          stepNameEn: s.stepNameEn,
          orderIndex: 0,
        }));
      const merged = [...prev, ...toAdd];
      return merged.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
  };

  const removeStep = (stepId) => {
    setSteps((prev) => prev.filter((s) => s.stepId !== stepId));
  };

  const removeManySteps = (stepIds) => {
    const idsSet = new Set(stepIds);
    setSteps((prev) =>
      prev
        .filter((s) => !idsSet.has(s.stepId))
        .map((s, i) => ({ ...s, orderIndex: i + 1 })),
    );
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

  // ===================== TreeList: onRowClick =====================
  const onTreeRowClick = (e) => {
    // نتجاهل عقد الأنواع
    if (e.data.isType) return;

    // إذا كان النقر على زر "إضافة الكل/إزالة الكل" نتجاهله هنا
    if (e.event?.target?.closest("[data-action-button]")) return;

    const stepId = e.data.stepId;
    if (selectedStepIds.includes(stepId)) {
      removeStep(stepId);
    } else {
      addStep(stepId);
    }
  };

  // ===================== Styles =====================
  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 rounded-md border text-sm transition
     focus:outline-none focus:ring-2
     ${
       hasError
         ? "border-red-300 focus:ring-red-200 focus:border-red-400"
         : "border-border focus:ring-primary/30 focus:border-primary"
     }`;

  const labelClass = "block text-sm font-medium text-secondary-700 mb-1.5";

  const submitLabel = () => {
    if (!loading) return t("protocols.form.save");
    if (loadingStep === "steps") return t("protocols.form.savingSteps");
    if (loadingStep === "status") return t("protocols.form.savingStatus");
    return t("protocols.form.saving");
  };

  // حساب حالة النوع (كل المراحل مضافة؟)
  const getTypeState = (typeId) => {
    const typeSteps = allSteps.filter((s) => s.stepTypeId === typeId);
    if (typeSteps.length === 0) return "empty";
    const linkedCount = typeSteps.filter((s) =>
      selectedStepIds.includes(s.id),
    ).length;
    if (linkedCount === 0) return "none";
    if (linkedCount === typeSteps.length) return "all";
    return "partial";
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={860}
      height="auto"
      maxHeight="92vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
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
            {t("protocols.form.tabData")}
            {activeTab === "data" && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("steps")}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                        ${
                          activeTab === "steps"
                            ? "text-primary"
                            : "text-secondary-500 hover:text-secondary-800"
                        }`}
          >
            {t("protocols.form.tabSteps", { count: steps.length })}
            {activeTab === "steps" && (
              <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ================== تبويب البيانات ================== */}
          {activeTab === "data" && (
            <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pe-1">
              <p className="text-xs text-secondary-500 -mb-1">
                {t("protocols.form.atLeastOneHint")}
              </p>

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
                    {t("protocols.form.stepType")}
                  </label>
                  <select
                    value={form.stepTypeId}
                    onChange={(e) => setField("stepTypeId", e.target.value)}
                    className={inputClass(errors.stepTypeId)}
                  >
                    <option value="">
                      {t("protocols.form.selectStepType")}
                    </option>
                    {stepTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.nameAr || st.nameEn}
                      </option>
                    ))}
                  </select>
                  {errors.stepTypeId && (
                    <p className="text-xs text-danger mt-1">
                      {errors.stepTypeId}
                    </p>
                  )}
                </div>
              </div>

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
            </div>
          )}

          {/* ================== تبويب المراحل ================== */}
          {activeTab === "steps" && (
            <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pe-1">
              {/* القسم الأول: المراحل المرتبطة */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary-800">
                      {t("protocols.form.linkedSteps")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {t("protocols.form.linkedStepsHint", {
                        count: steps.length,
                      })}
                    </p>
                  </div>
                </div>

                {steps.length === 0 ? (
                  <div
                    className="border border-dashed border-border rounded-md
                                  p-6 text-center text-secondary-400 text-sm"
                  >
                    {t("protocols.form.noLinkedSteps")}
                  </div>
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
                          {step.stepNameAr || step.stepNameEn}
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

              {/* القسم الثاني: TreeList للاختيار */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary-800">
                      {t("protocols.form.availableSteps")}
                    </p>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {t("protocols.form.availableStepsHint")}
                    </p>
                  </div>
                  <div className="relative w-64">
                    <Search
                      size={16}
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary-400"
                    />
                    <input
                      type="text"
                      value={treeSearch}
                      onChange={(e) => setTreeSearch(e.target.value)}
                      placeholder={t("protocols.form.searchSteps")}
                      className="w-full ps-9 pe-3 py-2 rounded-md border border-border
                                 text-sm focus:outline-none focus:ring-2
                                 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-md overflow-hidden">
                  <TreeList
                    dataSource={treeData}
                    keyExpr="id"
                    parentIdExpr="parentId"
                    rootValue={0}
                    showBorders={false}
                    showRowLines={true}
                    columnAutoWidth={true}
                    wordWrapEnabled={true}
                    height={340}
                    expandedRowKeys={expandedKeys}
                    onExpandedRowKeysChange={setExpandedKeys}
                    onRowClick={onTreeRowClick}
                    noDataText={
                      treeLoading
                        ? t("common.loading")
                        : t("protocols.form.noAvailableSteps")
                    }
                    rowAlternationEnabled={false}
                  >
                    <Scrolling mode="virtual" />

                    <Column
                      caption={t("protocols.form.columnName")}
                      cellRender={({ data }) => {
                        if (data.isType) {
                          const state = getTypeState(data.typeId);
                          const typeSteps = allSteps.filter(
                            (s) => s.stepTypeId === data.typeId,
                          );

                          return (
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-secondary-800">
                                  {data.name}
                                </span>
                                <span className="text-xs text-secondary-400">
                                  ({data.stepCount})
                                </span>
                              </div>

                              {typeSteps.length > 0 && (
                                <button
                                  type="button"
                                  data-action-button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (state === "all") {
                                      removeManySteps(
                                        typeSteps.map((s) => s.id),
                                      );
                                    } else {
                                      addManySteps(typeSteps);
                                    }
                                  }}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md
                                              text-xs font-medium transition-colors
                                              ${
                                                state === "all"
                                                  ? "text-danger bg-red-50 hover:bg-red-100"
                                                  : "text-primary bg-primary-50 hover:bg-primary-100"
                                              }`}
                                >
                                  {state === "all" ? (
                                    <>
                                      <Minus size={12} />
                                      <span>
                                        {t("protocols.form.removeAll")}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={12} />
                                      <span>
                                        {state === "partial"
                                          ? t("protocols.form.addRest")
                                          : t("protocols.form.addAll")}
                                      </span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        }

                        const isLinked = selectedStepIds.includes(data.stepId);

                        return (
                          <div
                            className={`flex items-center gap-2 cursor-pointer
                                        ${isLinked ? "text-primary font-medium" : "text-secondary-800"}`}
                          >
                            {/* Checkbox مرئي */}
                            <span
                              className={`flex-shrink-0 w-4 h-4 rounded border-2
                                          flex items-center justify-center transition
                                          ${
                                            isLinked
                                              ? "bg-primary border-primary"
                                              : "border-secondary-300 bg-white"
                                          }`}
                            >
                              {isLinked && (
                                <Check
                                  size={11}
                                  className="text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </span>

                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full
                                         bg-secondary-100 text-secondary-600 text-xs font-bold
                                         inline-flex items-center justify-center"
                              dir="ltr"
                            >
                              {data.stepNumber}
                            </span>

                            <span>{data.name}</span>
                          </div>
                        );
                      }}
                    />

                    <Column
                      dataField="boxPath"
                      caption={t("protocols.form.columnBoxPath")}
                      width={120}
                      alignment="center"
                      cellRender={({ value, data }) => {
                        if (data.isType || !value) return null;
                        return (
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs
                                       bg-amber-50 text-amber-700 font-mono"
                            dir="ltr"
                          >
                            {value}
                          </span>
                        );
                      }}
                    />
                  </TreeList>
                </div>
              </div>
            </div>
          )}

          {/* الأزرار */}
          <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-border">
            <p className="text-xs text-secondary-400">
              {activeTab === "steps" &&
                t("protocols.form.stepsFooterHint", { count: steps.length })}
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
          </div>
        </form>
      </div>
    </Popup>
  );
}
