import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DataGrid, {
  Column,
  Paging,
  Pager,
  LoadPanel,
} from "devextreme-react/data-grid";
import CustomStore from "devextreme/data/custom_store";
import { Package, Plus } from "lucide-react";
import { materialsApi } from "../../api/materials";
import MaterialFormModal from "./MaterialFormModal";
import MaterialActions from "./MaterialActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function MaterialsList() {
  const { t } = useTranslation();
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
          const data = await materialsApi.list({ page, pageSize });
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
      await materialsApi.remove(deleteTarget.id);
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
      await materialsApi.setStatus(statusTarget.id, !statusTarget.isActive);
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
      {/* العنوان + زر الإضافة */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.constants")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.materialsList")}
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
          <span>{t("materials.addButton")}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <DataGrid
            ref={gridRef}
            dataSource={dataSource}
            showBorders={true}
            columnAutoWidth={true}
            allowColumnResizing={true}
            columnMinWidth={80}
            height={650}
            allowColumnReordering={true}
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
            <LoadPanel enabled={true} />
            <Paging defaultPageSize={20} />
            <Pager
              visible={true}
              showPageSizeSelector={true}
              allowedPageSizes={[10, 20, 50, 100]}
              showInfo={true}
              showNavigationButtons={true}
            />

            <Column
              dataField="id"
              caption={t("materials.columns.id")}
              width={70}
              alignment="center"
              allowSorting={false}
            />

            <Column
              dataField="nameAr"
              caption={t("materials.columns.name")}
              alignment="center"
              allowSorting={false}
              cellRender={({ data }) => (
                <div className="flex flex-col">
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

            <Column
              dataField="materialNumber"
              caption={t("materials.columns.materialNumber")}
              alignment="center"
              width={130}
              allowSorting={false}
              cellRender={({ value }) => (
                <span
                  className="font-mono text-sm text-secondary-700"
                  dir="ltr"
                >
                  {value || "-"}
                </span>
              )}
            />

            <Column
              dataField="accountingCode"
              caption={t("materials.columns.accountingCode")}
              alignment="center"
              width={130}
              allowSorting={false}
              cellRender={({ value }) => (
                <span
                  className="font-mono text-sm text-secondary-700"
                  dir="ltr"
                >
                  {value || "-"}
                </span>
              )}
            />

            <Column
              dataField="categoryNameAr"
              caption={t("materials.columns.category")}
              alignment="center"
              allowSorting={false}
              cellRender={({ data }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                                 bg-blue-50 text-blue-700 font-medium"
                >
                  {data.categoryNameAr || data.categoryNameEn || "-"}
                </span>
              )}
            />

            <Column
              dataField="materialTypeNameAr"
              caption={t("materials.columns.materialType")}
              alignment="center"
              allowSorting={false}
              cellRender={({ data }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                                 bg-purple-50 text-purple-700 font-medium"
                >
                  {data.materialTypeNameAr || data.materialTypeNameEn || "-"}
                </span>
              )}
            />

            <Column
              dataField="min"
              caption={t("materials.columns.min")}
              width={100}
              alignment="center"
              allowSorting={false}
              cellRender={({ value }) => (
                <span className="text-sm text-secondary-700" dir="ltr">
                  {value}
                </span>
              )}
            />

            <Column
              dataField="max"
              caption={t("materials.columns.max")}
              width={100}
              alignment="center"
              allowSorting={false}
              cellRender={({ value }) => (
                <span className="text-sm text-secondary-700" dir="ltr">
                  {value}
                </span>
              )}
            />

            <Column
              dataField="isSerialized"
              caption={t("materials.columns.isSerialized")}
              width={100}
              alignment="center"
              allowSorting={false}
              cellRender={({ value }) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              text-xs font-medium
                              ${
                                value
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-secondary-100 text-secondary-600"
                              }`}
                >
                  {value
                    ? t("materials.serialized.yes")
                    : t("materials.serialized.no")}
                </span>
              )}
            />

            <Column
              dataField="isActive"
              caption={t("materials.columns.status")}
              width={100}
              alignment="center"
              allowSorting={false}
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
                    ? t("materials.status.active")
                    : t("materials.status.inactive")}
                </span>
              )}
            />

            <Column
              caption={t("materials.columns.actions")}
              width={140}
              alignment="center"
              allowSorting={false}
              allowFiltering={false}
              cellRender={(row) => (
                <MaterialActions
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

      <MaterialFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("materials.deleteDialog.title")}
        message={t("materials.deleteDialog.message", {
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
            ? t("materials.statusDialog.deactivateTitle")
            : t("materials.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("materials.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("materials.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("materials.actions.deactivate")
            : t("materials.actions.activate")
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
