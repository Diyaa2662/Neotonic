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
import { Truck, Plus } from "lucide-react";
import { suppliersApi } from "../../api/suppliers";
import SupplierFormModal from "./SupplierFormModal";
import SupplierActions from "./SupplierActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function SuppliersList() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const gridRef = useRef(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
          const data = await suppliersApi.list({ page, pageSize });
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
      await suppliersApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      refreshGrid();
    } catch (err) {
      alert(err.response?.data?.message || t("login.errors.generic"));
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
      await suppliersApi.setStatus(statusTarget.id, !statusTarget.isActive);
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

  const displayName = (row) => row.nameAr || row.nameEn;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Truck size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.constants")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.suppliers")}
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
          <span>{t("suppliers.addButton")}</span>
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

            {/* رقم المورد */}
            <Column
              dataField="supplierNumber"
              caption={t("suppliers.columns.supplierNumber")}
              width={130}
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

            {/* الاسم */}
            <Column
              dataField="nameAr"
              caption={t("suppliers.columns.name")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center">
                  <span className="font-medium text-secondary-900">
                    {data.nameAr || data.nameEn}
                  </span>
                  {data.nameAr && data.nameEn && (
                    <span className="text-xs text-secondary-500" dir="ltr">
                      {data.nameEn}
                    </span>
                  )}
                </div>
              )}
            />

            {/* جهة الاتصال */}
            <Column
              dataField="contact"
              caption={t("suppliers.columns.contact")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="text-sm text-secondary-700">
                  {value || "-"}
                </span>
              )}
            />

            {/* الهاتف */}
            <Column
              dataField="phoneNumber"
              caption={t("suppliers.columns.phoneNumber")}
              width={150}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="font-mono text-sm text-secondary-700"
                  dir="ltr"
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* البريد الإلكتروني */}
            <Column
              dataField="email"
              caption={t("suppliers.columns.email")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="text-sm text-blue-600 truncate block max-w-[200px] mx-auto"
                  dir="ltr"
                  title={value || ""}
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* الملاحظات */}
            <Column
              dataField="notes"
              caption={t("suppliers.columns.notes")}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="text-sm text-secondary-600 truncate block max-w-[180px] mx-auto"
                  title={value || ""}
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* الحالة */}
            <Column
              dataField="isActive"
              caption={t("suppliers.columns.status")}
              width={130}
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
                    ? t("suppliers.status.active")
                    : t("suppliers.status.inactive")}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("suppliers.columns.actions")}
              width={140}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <SupplierActions
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

      <SupplierFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("suppliers.deleteDialog.title")}
        message={t("suppliers.deleteDialog.message", {
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
            ? t("suppliers.statusDialog.deactivateTitle")
            : t("suppliers.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("suppliers.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("suppliers.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("suppliers.actions.deactivate")
            : t("suppliers.actions.activate")
        }
        loading={statusLoading}
        onConfirm={confirmToggleStatus}
        onCancel={() => {
          setStatusTarget(null);
          setStatusError("");
        }}
      />
    </div>
  );
}
