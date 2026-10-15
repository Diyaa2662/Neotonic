import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DataGrid, {
  Column,
  Paging,
  Pager,
  LoadPanel,
  HeaderFilter,
  SearchPanel,
  GroupPanel,
} from "devextreme-react/data-grid";
import CustomStore from "devextreme/data/custom_store";
import { Calendar, Plus } from "lucide-react";
import { annualPlansApi } from "../../api/annualPlans";
import AnnualPlanFormModal from "./AnnualPlanFormModal";
import AnnualPlanActions from "./AnnualPlanActions";
import AnnualPlanDetailsModal from "./AnnualPlanDetailsModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DeleteConflictDialog from "../../components/common/DeleteConflictDialog";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

export default function AnnualPlansList() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const gridRef = useRef(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConflict, setDeleteConflict] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const dataSource = useMemo(
    () =>
      new CustomStore({
        key: "id",
        load: async (loadOptions) => {
          const pageSize = loadOptions.take || 20;
          const page = Math.floor((loadOptions.skip || 0) / pageSize) + 1;
          const data = await annualPlansApi.list({ page, pageSize });
          return {
            data: data.items || [],
            totalCount: data.totalCount || 0,
          };
        },
      }),
    [],
  );

  const refreshGrid = () => gridRef.current?.instance?.refresh();

  const openCreate = () => {
    setEditing(null);
    setFormVisible(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setFormVisible(true);
  };
  const closeForm = () => {
    setFormVisible(false);
    setEditing(null);
  };

  const openView = (row) => setViewing(row);
  const closeView = () => setViewing(null);

  const openDelete = (row) => setDeleteTarget(row);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await annualPlansApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      refreshGrid();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflicts && Array.isArray(data.conflicts)) {
        setDeleteTarget(null);
        setDeleteConflict(data);
      } else {
        alert(data?.message || t("login.errors.generic"));
      }
    } finally {
      setDeleting(false);
    }
  };

  const openToggleStatus = (row) => {
    setStatusTarget(row);
    setStatusError("");
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);
    setStatusError("");
    try {
      await annualPlansApi.setStatus(statusTarget.id, !statusTarget.isActive);
      setStatusTarget(null);
      refreshGrid();
    } catch (err) {
      setStatusError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          t("login.errors.generic"),
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const displayName = (row) => row.number || `#${row.id}`;

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      return d.toLocaleDateString(
        i18n.language?.startsWith("ar") ? "ar-EG" : "en-GB",
        { year: "numeric", month: "2-digit", day: "2-digit" },
      );
    } catch {
      return value;
    }
  };

  const getStatusLabel = (value) => {
    const found = PURCHASE_ORDER_STATUS.find((s) => s.value === value);
    return found ? t(`annualPlans.statuses.${found.key}`) : `#${value}`;
  };

  const getStatusColor = (value) => {
    switch (value) {
      case 0:
        return "bg-amber-50 text-amber-700";
      case 1:
        return "bg-green-50 text-green-700";
      case 2:
        return "bg-red-50 text-red-700";
      default:
        return "bg-secondary-100 text-secondary-600";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Calendar size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.purchaseRequests")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.annualPlans")}
            </h2>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md
                     bg-primary text-white text-sm font-semibold
                     hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          <span>{t("annualPlans.addButton")}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <DataGrid
            ref={gridRef}
            dataSource={dataSource}
            rtlEnabled={isRtl}
            showBorders={true}
            columnAutoWidth={true}
            allowColumnResizing={true}
            columnMinWidth={100}
            height={500}
            allowColumnReordering={true}
            wordWrapEnabled={true}
            rowAlternationEnabled={true}
            showColumnLines={true}
            showRowLines={true}
            remoteOperations={{ paging: true }}
            rowClass={({ rowType, data }) => {
              if (rowType !== "data") return "";
              if (!data.isActive) return "inactive-row";
              return "";
            }}
          >
            <HeaderFilter visible={true} />
            <SearchPanel
              visible={true}
              width={240}
              placeholder={t("common.searchPlaceholder")}
            />
            <GroupPanel
              visible={true}
              emptyPanelText={t("common.dragColumnToGroup")}
            />

            <LoadPanel enabled={true} />
            <Paging defaultPageSize={20} />
            <Pager
              visible={true}
              showPageSizeSelector={true}
              allowedPageSizes={[10, 20, 50, 100]}
              showInfo={true}
              showNavigationButtons={true}
            />

            {/* الرقم */}
            <Column
              dataField="number"
              caption={t("annualPlans.columns.number")}
              width={100}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-amber-50 text-amber-700 font-mono font-medium"
                  dir="ltr"
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* القسم */}
            <Column
              dataField="departmentNameAr"
              caption={t("annualPlans.columns.department")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-blue-50 text-blue-700 font-medium"
                >
                  {data.departmentNameAr || data.departmentNameEn || "-"}
                </span>
              )}
            />

            {/* نوع المادة */}
            <Column
              dataField="materialTypeNameAr"
              caption={t("annualPlans.columns.materialType")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-purple-50 text-purple-700 font-medium"
                >
                  {data.materialTypeNameAr || data.materialTypeNameEn || "-"}
                </span>
              )}
            />

            {/* تاريخ الخطة */}
            <Column
              dataField="annualPlanDate"
              caption={t("annualPlans.columns.annualPlanDate")}
              width={140}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-indigo-50 text-indigo-700 font-medium"
                  dir="ltr"
                >
                  {formatDate(value)}
                </span>
              )}
            />

            {/* الحالة */}
            <Column
              dataField="annualStatuses"
              caption={t("annualPlans.columns.status")}
              width={120}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              text-xs font-medium ${getStatusColor(value)}`}
                >
                  {getStatusLabel(value)}
                </span>
              )}
            />

            {/* عدد التفاصيل */}
            <Column
              dataField="detailCount"
              caption={t("annualPlans.columns.detailCount")}
              width={110}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-flex items-center justify-center min-w-[28px] h-7 px-2
                             rounded-full bg-blue-50 text-blue-700 text-xs font-bold"
                  dir="ltr"
                >
                  {value ?? 0}
                </span>
              )}
            />

            {/* التفعيل */}
            <Column
              dataField="isActive"
              caption={t("annualPlans.columns.isActive")}
              width={100}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              text-xs font-medium
                              ${
                                value
                                  ? "bg-green-50 text-green-700"
                                  : "bg-secondary-100 text-secondary-600"
                              }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full
                                ${value ? "bg-green-500" : "bg-secondary-400"}`}
                  />
                  {value
                    ? t("annualPlans.activeStatus.active")
                    : t("annualPlans.activeStatus.inactive")}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("annualPlans.columns.actions")}
              width={180}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <AnnualPlanActions
                  row={row}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onToggleStatus={openToggleStatus}
                />
              )}
            />
          </DataGrid>
        </div>
      </div>

      <AnnualPlanFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <AnnualPlanDetailsModal
        visible={!!viewing}
        plan={viewing}
        onClose={closeView}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("annualPlans.deleteDialog.title")}
        message={t("annualPlans.deleteDialog.message", {
          name: deleteTarget ? displayName(deleteTarget) : "",
        })}
        confirmText={t("common.delete")}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        visible={!!statusTarget}
        variant={statusTarget?.isActive ? "danger" : "default"}
        title={
          statusTarget?.isActive
            ? t("annualPlans.statusDialog.deactivateTitle")
            : t("annualPlans.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("annualPlans.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("annualPlans.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("annualPlans.actions.deactivate")
            : t("annualPlans.actions.activate")
        }
        loading={statusLoading}
        onConfirm={confirmToggleStatus}
        onCancel={() => {
          setStatusTarget(null);
          setStatusError("");
        }}
      />

      <DeleteConflictDialog
        visible={!!deleteConflict}
        conflict={deleteConflict}
        onClose={() => setDeleteConflict(null)}
      />
    </div>
  );
}
