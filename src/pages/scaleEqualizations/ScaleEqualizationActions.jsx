import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";

export default function ScaleEqualizationActions({ row, onEdit, onDelete }) {
  const { t } = useTranslation();

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
