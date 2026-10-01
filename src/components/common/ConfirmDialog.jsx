import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  loading = false,
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  const confirmBtnClass =
    variant === "danger"
      ? "bg-danger hover:bg-red-700"
      : "bg-primary hover:bg-primary-700";

  return (
    <Popup
      visible={visible}
      onHiding={onCancel}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={420}
      height="auto"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                        ${variant === "danger" ? "bg-red-50" : "bg-primary-50"}`}
          >
            <AlertTriangle
              size={22}
              className={variant === "danger" ? "text-danger" : "text-primary"}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-secondary-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-secondary-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-md text-sm font-medium
                       text-secondary-700 bg-white border border-border
                       hover:bg-secondary-50 transition
                       disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md
                        text-white text-sm font-semibold transition
                        disabled:opacity-60 disabled:cursor-not-allowed
                        ${confirmBtnClass}`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            <span>{confirmText || t("common.confirm")}</span>
          </button>
        </div>
      </div>
    </Popup>
  );
}
