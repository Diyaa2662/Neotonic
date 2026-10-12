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
import { Scale as ScaleIcon, Plus } from "lucide-react";
import { scaleEqualizationsApi } from "../../api/scaleEqualizations";
import ScaleEqualizationFormModal from "./ScaleEqualizationFormModal";
import ScaleEqualizationActions from "./ScaleEqualizationActions";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DeleteConflictDialog from "../../components/common/DeleteConflictDialog";

export default function ScaleEqualizationsList() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const gridRef = useRef(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConflict, setDeleteConflict] = useState(null);

  const dataSource = useMemo(
    () =>
      new CustomStore({
        key: "id",
        load: async (loadOptions) => {
          const pageSize = loadOptions.take || 20;
          const page = Math.floor((loadOptions.skip || 0) / pageSize) + 1;
          const data = await scaleEqualizationsApi.list({ page, pageSize });
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
      await scaleEqualizationsApi.remove(deleteTarget.id);
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

  const displayName = (row) => row.number || `#${row.id}`;

  // تنسيق التاريخ للعرض
  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      const date = d.toLocaleDateString(
        i18n.language?.startsWith("ar") ? "ar-EG" : "en-GB",
        { year: "numeric", month: "2-digit", day: "2-digit" },
      );
      const time = d.toLocaleTimeString(
        i18n.language?.startsWith("ar") ? "ar-EG" : "en-GB",
        { hour: "2-digit", minute: "2-digit" },
      );
      return `${date} ${time}`;
    } catch {
      return value;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <ScaleIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary-500 mb-0.5">
              {t("nav.groups.periodicWork")}
            </p>
            <h2 className="text-2xl font-bold text-secondary-900">
              {t("nav.items.scaleCalibration")}
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
          <span>{t("scaleEqualizations.addButton")}</span>
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
              caption={t("scaleEqualizations.columns.number")}
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

            {/* تاريخ المعايرة */}
            <Column
              dataField="equalizationDate"
              caption={t("scaleEqualizations.columns.equalizationDate")}
              width={180}
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

            {/* الميزان */}
            <Column
              dataField="scaleNameAr"
              caption={t("scaleEqualizations.columns.scale")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs
                               bg-green-50 text-green-700 font-mono font-bold"
                    dir="ltr"
                  >
                    {data.scaleNumber || "-"}
                  </span>
                  {data.scaleNameAr && (
                    <span className="text-xs text-secondary-500">
                      {data.scaleNameAr}
                    </span>
                  )}
                </div>
              )}
            />

            {/* العامل */}
            <Column
              dataField="workerNameAr"
              caption={t("scaleEqualizations.columns.worker")}
              alignment="center"
              allowSorting={true}
              allowGrouping={true}
              allowFiltering={true}
              cellRender={({ data }) => (
                <div className="flex flex-col items-center">
                  <span className="font-medium text-secondary-900">
                    {data.workerNameAr || data.workerNameEn || "-"}
                  </span>
                  {data.workerNumber && (
                    <span className="text-xs text-secondary-500" dir="ltr">
                      #{data.workerNumber}
                    </span>
                  )}
                </div>
              )}
            />

            {/* الملاحظات */}
            <Column
              dataField="notes"
              caption={t("scaleEqualizations.columns.notes")}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={true}
              cellRender={({ value }) => (
                <span
                  className="text-sm text-secondary-600 truncate block max-w-[200px] mx-auto"
                  title={value || ""}
                >
                  {value || "-"}
                </span>
              )}
            />

            {/* الإجراءات */}
            <Column
              caption={t("scaleEqualizations.columns.actions")}
              width={120}
              alignment="center"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(row) => (
                <ScaleEqualizationActions
                  row={row}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              )}
            />
          </DataGrid>
        </div>
      </div>

      <ScaleEqualizationFormModal
        visible={formVisible}
        editing={editing}
        onClose={closeForm}
        onSaved={refreshGrid}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        variant="danger"
        title={t("scaleEqualizations.deleteDialog.title")}
        message={t("scaleEqualizations.deleteDialog.message", {
          name: deleteTarget ? displayName(deleteTarget) : "",
        })}
        confirmText={t("common.delete")}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConflictDialog
        visible={!!deleteConflict}
        conflict={deleteConflict}
        onClose={() => setDeleteConflict(null)}
      />
    </div>
  );
}
