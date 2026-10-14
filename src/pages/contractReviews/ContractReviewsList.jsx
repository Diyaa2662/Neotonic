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
import { ShoppingCart, Plus } from "lucide-react";
import { contractReviewsApi } from "../../api/contractReviews";
import ContractReviewFormModal from "./ContractReviewFormModal";
import ContractReviewActions from "./ContractReviewActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DeleteConflictDialog from "../../components/common/DeleteConflictDialog";
import { CONNECTION_METHODS } from "../../constants/connectionMethods";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

export default function ContractReviewsList() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const gridRef = useRef(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

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
          const data = await contractReviewsApi.list({ page, pageSize });
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

  const openDelete = (row) => setDeleteTarget(row);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contractReviewsApi.remove(deleteTarget.id);
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
      await contractReviewsApi.setStatus(
        statusTarget.id,
        !statusTarget.isActive,
      );
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      const date = d.toLocaleDateString(
        i18n.language?.startsWith("ar") ? "ar-EG" : "en-GB",
        { year: "numeric", month: "2-digit", day: "2-digit" },
      );
      return date;
    } catch {
      return value;
    }
  };

  // ترجمة connectionMethod
  const getConnectionMethodLabel = (value) => {
    const found = CONNECTION_METHODS.find((cm) => cm.value === value);
    return found
      ? t(`purchaseRequests.connectionMethods.${found.key}`)
      : `#${value}`;
  };

  // ترجمة status
  const getStatusLabel = (value) => {
    const found = PURCHASE_ORDER_STATUS.find((s) => s.value === value);
    return found ? t(`purchaseRequests.statuses.${found.key}`) : `#${value}`;
  };

  // ألوان الstatus
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
            <ShoppingCart size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.purchaseRequests")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.purchaseRequest")}
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
          <span>{t("purchaseRequests.addButton")}</span>
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
            height={550}
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
              caption={t("purchaseRequests.columns.number")}
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

            {/* تاريخ الإنشاء */}
            <Column
              dataField="creationDate"
              caption={t("purchaseRequests.columns.creationDate")}
              width={120}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="text-sm text-secondary-700" dir="ltr">
                  {formatDateTime(value)}
                </span>
              )}
            />

            {/* التاريخ المتوقع */}
            <Column
              dataField="expectedDate"
              caption={t("purchaseRequests.columns.expectedDate")}
              width={120}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-blue-50 text-blue-700 font-medium"
                  dir="ltr"
                >
                  {formatDateTime(value)}
                </span>
              )}
            />

            {/* المورد */}
            <Column
              dataField="supplierNameAr"
              caption={t("purchaseRequests.columns.supplier")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium text-secondary-900">
                    {data.supplierNameAr || data.supplierNameEn || "-"}
                  </span>
                  {data.supplierNumber && (
                    <span className="text-xs text-secondary-500" dir="ltr">
                      #{data.supplierNumber}
                    </span>
                  )}
                </div>
              )}
            />

            {/* المادة */}
            <Column
              dataField="materialNameAr"
              caption={t("purchaseRequests.columns.material")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium text-secondary-900">
                    {data.materialNameAr || data.materialNameEn || "-"}
                  </span>
                  {data.materialNumber && (
                    <span
                      className="text-xs text-secondary-500 font-mono"
                      dir="ltr"
                    >
                      {data.materialNumber}
                    </span>
                  )}
                </div>
              )}
            />

            {/* الكمية */}
            <Column
              dataField="quantity"
              caption={t("purchaseRequests.columns.quantity")}
              width={90}
              alignment="center"
              allowSorting={true}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="font-bold text-secondary-900" dir="ltr">
                  {value}
                </span>
              )}
            />

            {/* المستلم */}
            <Column
              dataField="fulfilledQuantity"
              caption={t("purchaseRequests.columns.fulfilledQuantity")}
              width={90}
              alignment="center"
              allowSorting={true}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="text-sm text-green-700 font-medium" dir="ltr">
                  {value ?? 0}
                </span>
              )}
            />

            {/* المتبقي */}
            <Column
              dataField="remainingQuantity"
              caption={t("purchaseRequests.columns.remainingQuantity")}
              width={90}
              alignment="center"
              allowSorting={true}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="text-sm text-orange-700 font-medium" dir="ltr">
                  {value ?? 0}
                </span>
              )}
            />

            {/* طريقة الاتصال */}
            <Column
              dataField="connectionMethod"
              caption={t("purchaseRequests.columns.connectionMethod")}
              width={110}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-slate-100 text-slate-700 font-medium"
                >
                  {getConnectionMethodLabel(value)}
                </span>
              )}
            />

            {/* حالة الطلب (status) */}
            <Column
              dataField="status"
              caption={t("purchaseRequests.columns.status")}
              width={120}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              text-xs font-medium
                              ${getStatusColor(value)}`}
                >
                  {getStatusLabel(value)}
                </span>
              )}
            />

            {/* ملاحظات */}
            <Column
              dataField="notes"
              caption={t("purchaseRequests.columns.notes")}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="text-sm text-secondary-600 truncate block max-w-[150px] mx-auto"
                  title={value || ""}
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* التفعيل (isActive) */}
            <Column
              dataField="isActive"
              caption={t("purchaseRequests.columns.isActive")}
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
                    ? t("purchaseRequests.activeStatus.active")
                    : t("purchaseRequests.activeStatus.inactive")}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("purchaseRequests.columns.actions")}
              width={140}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <ContractReviewActions
                  row={row}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onToggleStatus={openToggleStatus}
                />
              )}
            />
          </DataGrid>
        </div>
      </div>

      <ContractReviewFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("purchaseRequests.deleteDialog.title")}
        message={t("purchaseRequests.deleteDialog.message", {
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
            ? t("purchaseRequests.statusDialog.deactivateTitle")
            : t("purchaseRequests.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("purchaseRequests.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("purchaseRequests.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("purchaseRequests.actions.deactivate")
            : t("purchaseRequests.actions.activate")
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
