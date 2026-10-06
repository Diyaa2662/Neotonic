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
import { Box, Plus } from "lucide-react";
import { pathboxApi } from "../../api/pathbox";
import PathboxFormModal from "./PathboxFormModal";
import PathboxActions from "./PathboxActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DeleteConflictDialog from "../../components/common/DeleteConflictDialog";

export default function PathboxList() {
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
          const data = await pathboxApi.list({ page, pageSize });
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
      await pathboxApi.remove(deleteTarget.id);
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
      await pathboxApi.setStatus(statusTarget.id, !statusTarget.isActive);
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

  const displayName = (row) => row.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Box size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.constants")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.pathbox")}
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
          <span>{t("pathbox.addButton")}</span>
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

            {/* الرمز */}
            <Column
              dataField="code"
              caption={t("pathbox.columns.code")}
              width={140}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="inline-block px-2 py-1 rounded text-xs
                             bg-amber-50 text-amber-700 font-mono font-bold"
                  dir="ltr"
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* الاسم */}
            <Column
              dataField="name"
              caption={t("pathbox.columns.name")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span className="font-medium text-secondary-900">{value}</span>
              )}
            />

            {/* الحالة */}
            <Column
              dataField="isActive"
              caption={t("pathbox.columns.status")}
              width={140}
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
                    ? t("pathbox.status.active")
                    : t("pathbox.status.inactive")}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("pathbox.columns.actions")}
              width={140}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <PathboxActions
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

      <PathboxFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("pathbox.deleteDialog.title")}
        message={t("pathbox.deleteDialog.message", {
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
            ? t("pathbox.statusDialog.deactivateTitle")
            : t("pathbox.statusDialog.activateTitle")
        }
        message={
          statusError
            ? statusError
            : statusTarget?.isActive
              ? t("pathbox.statusDialog.deactivateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
              : t("pathbox.statusDialog.activateMessage", {
                  name: statusTarget ? displayName(statusTarget) : "",
                })
        }
        confirmText={
          statusTarget?.isActive
            ? t("pathbox.actions.deactivate")
            : t("pathbox.actions.activate")
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
