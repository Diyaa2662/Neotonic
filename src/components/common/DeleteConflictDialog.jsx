import { useTranslation } from "react-i18next";
import Popup from "devextreme-react/popup";
import { AlertTriangle, Table, ArrowLeft } from "lucide-react";

export default function DeleteConflictDialog({ visible, conflict, onClose }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");

  if (!conflict) return null;

  const { message, conflicts = [] } = conflict;

  // نعرض اسم المورد حسب اللغة الحالية
  const getRecordName = (record) => {
    if (isAr) {
      return record.name_ar || record.name_en || `#${record.id}`;
    }
    return record.name_en || record.name_ar || `#${record.id}`;
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton={false}
      showTitle={false}
      width={640}
      height="auto"
      maxHeight="85vh"
      wrapperAttr={{ class: "category-form-popup" }}
    >
      <div className="p-6">
        {/* الرأس */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-secondary-900 mb-1">
              {t("deleteConflict.title")}
            </h3>
            <p className="text-sm text-secondary-600 leading-relaxed">
              {message || t("deleteConflict.defaultMessage")}
            </p>
          </div>
        </div>

        {/* قائمة التعارضات */}
        {conflicts.length > 0 && (
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pe-1">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="border border-border rounded-md overflow-hidden bg-white"
              >
                {/* اسم الجدول */}
                <div
                  className="flex items-center gap-2 px-3 py-2
                                bg-secondary-50 border-b border-border"
                >
                  <Table size={14} className="text-secondary-500" />
                  <span className="text-xs font-semibold text-secondary-700">
                    {t("deleteConflict.tableLabel")}
                  </span>
                  <span
                    className="text-xs font-mono font-semibold
                               text-primary bg-primary-50 px-2 py-0.5 rounded"
                    dir="ltr"
                  >
                    {conflict.tableName}
                  </span>
                  {conflict.blockingRecords?.length > 0 && (
                    <span className="ms-auto text-xs text-secondary-500">
                      {t("deleteConflict.recordsCount", {
                        count: conflict.blockingRecords.length,
                      })}
                    </span>
                  )}
                </div>

                {/* السجلات المُعطِّلة */}
                {conflict.blockingRecords?.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {conflict.blockingRecords.map((record) => (
                      <li
                        key={record.id}
                        className="flex items-center gap-3 px-3 py-2.5
                                   hover:bg-secondary-50/50 transition"
                      >
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full
                                     bg-secondary-100 text-secondary-600
                                     text-xs font-bold
                                     inline-flex items-center justify-center"
                          dir="ltr"
                        >
                          {record.id}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-secondary-800 truncate">
                          {getRecordName(record)}
                        </span>
                        {record.name_ar && record.name_en && (
                          <span
                            className="flex-shrink-0 text-xs text-secondary-400 truncate max-w-[140px]"
                            dir={isAr ? "ltr" : "rtl"}
                          >
                            {isAr ? record.name_en : record.name_ar}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-2.5 text-xs text-secondary-400">
                    {t("deleteConflict.noRecords")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* الإجراء المقترح */}
        <div
          className="mt-5 flex items-start gap-2 p-3 rounded-md
                        bg-blue-50 border border-blue-200"
        >
          <ArrowLeft size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            {t("deleteConflict.hint")}
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium
                       bg-primary text-white
                       hover:bg-primary-700 transition"
          >
            {t("deleteConflict.closeButton")}
          </button>
        </div>
      </div>
    </Popup>
  );
}
