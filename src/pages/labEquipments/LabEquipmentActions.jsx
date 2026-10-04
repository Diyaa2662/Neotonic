import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Power, PowerOff } from "lucide-react";

export default function LabEquipmentActions({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const { t } = useTranslation();
  const isActive = row.data.isActive;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onEdit(row.data)}
        title={t("common.edit")}
        className="p-1.5 rounded-md text-secondary-500
                   hover:text-primary hover:bg-primary-50 transition"
      >
        <Pencil size={16} />
      </button>

      <button
        onClick={() => onToggleStatus(row.data)}
        title={
          isActive
            ? t("labEquipments.actions.deactivate")
            : t("labEquipments.actions.activate")
        }
        className={`p-1.5 rounded-md transition
                    ${
                      isActive
                        ? "text-secondary-500 hover:text-warning hover:bg-amber-50"
                        : "text-secondary-500 hover:text-success hover:bg-green-50"
                    }`}
      >
        {isActive ? <PowerOff size={16} /> : <Power size={16} />}
      </button>

      <button
        onClick={() => onDelete(row.data)}
        title={t("common.delete")}
        className="p-1.5 rounded-md text-secondary-500
                   hover:text-danger hover:bg-red-50 transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
