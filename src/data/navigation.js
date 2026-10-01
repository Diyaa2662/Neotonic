import {
  ShoppingCart,
  PackageCheck,
  RefreshCw,
  Boxes,
  Factory,
} from "lucide-react";

export const navigationGroups = [
  {
    key: "purchaseRequests",
    Icon: ShoppingCart,
    items: [
      { key: "purchaseRequest", path: "/purchase-request" },
      { key: "supplierSample", path: "/supplier-sample" },
      { key: "analysisReport", path: "/analysis-report" },
      { key: "purchaseOrder", path: "/purchase-order" },
    ],
  },
  {
    key: "materialReceiving",
    Icon: PackageCheck,
    items: [
      { key: "rawMaterialReceiving", path: "/raw-material-receiving" },
      { key: "receivingAnalysisReport", path: "/receiving-analysis-report" },
      { key: "materialAcceptance", path: "/material-acceptance" },
      { key: "initialPrepOrder", path: "/initial-prep-order" },
      { key: "prepStagesTracking", path: "/prep-stages-tracking" },
    ],
  },
  {
    key: "periodicWork",
    Icon: RefreshCw,
    items: [
      { key: "scaleCalibration", path: "/scale-calibration" },
      { key: "cleaningRequest", path: "/cleaning-request" },
    ],
  },
  {
    key: "constants",
    Icon: Boxes,
    items: [
      { key: "categories", path: "/categories" },
      { key: "materialTypes", path: "/material-types" },
      { key: "materialsList", path: "/materials-list" },
      { key: "stages", path: "/stages" },
      { key: "cleaningProtocols", path: "/cleaning-protocols" },
      { key: "prepMethodDef", path: "/prep-method-def" },
      { key: "factorySections", path: "/factory-sections" },
      { key: "factoryMachines", path: "/factory-machines" },
      { key: "factoryScales", path: "/factory-scales" },
      { key: "suppliers", path: "/suppliers" },
      { key: "labDevices", path: "/lab-devices" },
      { key: "pathbox", path: "/pathbox" },
      { key: "workersDefPage", path: "/workers-def-page" },
    ],
  },
  {
    key: "secondFloor",
    Icon: Factory,
    items: [
      { key: "manufacturingOrder", path: "/manufacturing-order" },
      { key: "preparationOrder", path: "/preparation-order" },
      { key: "manufacturingStagesTrack", path: "/manufacturing-stages-track" },
      { key: "stoneWarehouse", path: "/stone-warehouse" },
      { key: "finalWarehouse", path: "/final-warehouse" },
      { key: "weightCard", path: "/weight-card" },
      { key: "samplesEntryLog", path: "/samples-entry-log" },
      { key: "inProcessAnalysisReport", path: "/in-process-analysis-report" },
      { key: "receivedInitialAnalysis", path: "/received-initial-analysis" },
      { key: "sampleAnalysisReport", path: "/sample-analysis-report" },
    ],
  },
];
