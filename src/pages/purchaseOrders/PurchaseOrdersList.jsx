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
import { ClipboardCheck, Plus } from "lucide-react";
import { purchaseOrdersApi } from "../../api/purchaseOrders";
import PurchaseOrderFormModal from "./PurchaseOrderFormModal";
import PurchaseOrderActions from "./PurchaseOrderActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DeleteConflictDialog from "../../components/common/DeleteConflictDialog";
import { PURCHASE_ORDER_STATUS } from "../../constants/purchaseOrderStatus";

export default function PurchaseOrdersList() {
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
          const data = await purchaseOrdersApi.list({ page, pageSize });
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
      await purchaseOrdersApi.remove(deleteTarget.id);
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
      await purchaseOrdersApi.setStatus(
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
    return found ? t(`purchaseOrders.statuses.${found.key}`) : `#${value}`;
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

  const getCertificateResultColor = (value) => {
    switch (value) {
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
            <ClipboardCheck size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.purchaseRequests")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.purchaseOrder")}
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
          <span>{t("purchaseOrders.addButton")}</span>
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
              caption={t("purchaseOrders.columns.number")}
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
              caption={t("purchaseOrders.columns.creationDate")}
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

            {/* تاريخ التسليم */}
            <Column
              dataField="deliveryDate"
              caption={t("purchaseOrders.columns.deliveryDate")}
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

            {/* طلب الشراء */}
            <Column
              dataField="contractReviewNumber"
              caption={t("purchaseOrders.columns.contractReview")}
              width={120}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-purple-50 text-purple-700 font-mono font-bold"
                  dir="ltr"
                >
                  {data.contractReviewNumber || `#${data.contractReviewId}`}
                </span>
              )}
            />

            {/* الشهادة */}
            <Column
              dataField="certificateNumber"
              caption={t("purchaseOrders.columns.certificate")}
              width={110}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs
                               bg-indigo-50 text-indigo-700 font-mono font-bold"
                    dir="ltr"
                  >
                    {data.certificateNumber || "-"}
                  </span>
                  {data.certificateResult && (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px]
                                  font-medium ${getCertificateResultColor(data.certificateResult)}`}
                    >
                      {data.certificateResult === 1
                        ? t("purchaseOrders.certificateResults.accepted")
                        : t("purchaseOrders.certificateResults.rejected")}
                    </span>
                  )}
                </div>
              )}
            />

            {/* المورد */}
            <Column
              dataField="supplierNameAr"
              caption={t("purchaseOrders.columns.supplier")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <span className="font-medium text-secondary-900">
                  {data.supplierNameAr || data.supplierNameEn || "-"}
                </span>
              )}
            />

            {/* المادة */}
            <Column
              dataField="materialNameAr"
              caption={t("purchaseOrders.columns.material")}
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
              caption={t("purchaseOrders.columns.quantity")}
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

            {/* الحالة */}
            <Column
              dataField="status"
              caption={t("purchaseOrders.columns.status")}
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

            {/* الملاحظات */}
            <Column
              dataField="notes"
              caption={t("purchaseOrders.columns.notes")}
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

            {/* التفعيل */}
            <Column
              dataField="isActive"
              caption={t("purchaseOrders.columns.isActive")}
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
                    ? t("purchaseOrders.activeStatus.active")
                    : t("purchaseOrders.activeStatus.inactive")}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("purchaseOrders.columns.actions")}
              width={140}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <PurchaseOrderActions
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

      <PurchaseOrderFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("purchaseOrders.deleteDialog.title")}
        message={t("purchaseOrders.deleteDialog.message", {
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
            ? t("purchaseOrders.statusDialog.deactivateTitle")
            : t("purchaseOrders.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("purchaseOrders.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("purchaseOrders.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("purchaseOrders.actions.deactivate")
            : t("purchaseOrders.actions.activate")
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
