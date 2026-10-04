import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import CategoriesList from "./pages/categories/CategoriesList";
import MaterialTypesList from "./pages/materialTypes/MaterialTypesList";
import MaterialsList from "./pages/materials/MaterialsList";
import StepTypesList from "./pages/stepTypes/StepTypesList";
import StepsList from "./pages/steps/StepsList";
import ProtocolsList from "./pages/protocols/ProtocolsList";
import DepartmentsList from "./pages/departments/DepartmentsList";
import LabEquipmentsList from "./pages/labEquipments/LabEquipmentsList";
import MachinesList from "./pages/machines/MachinesList";
import ScalesList from "./pages/scales/ScalesList";
import { navigationGroups } from "./data/navigation";
import "devextreme/dist/css/dx.fluent.blue.light.css";

const realPages = {
  "/categories": CategoriesList,
  "/material-types": MaterialTypesList,
  "/materials-list": MaterialsList,
  "/step-types": StepTypesList,
  "/steps": StepsList,
  "/protocols": ProtocolsList,
  "/factory-sections": DepartmentsList,
  "/lab-devices": LabEquipmentsList,
  "/factory-machines": MachinesList,
  "/factory-scales": ScalesList,
};

function App() {
  const allRoutes = navigationGroups.flatMap((group) =>
    group.items
      .filter((item) => !realPages[item.path])
      .map((item) => ({
        path: item.path,
        titleKey: item.key,
        groupKey: group.key,
      })),
  );

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {Object.entries(realPages).map(([path, Component]) => (
              <Route key={path} path={path.slice(1)} element={<Component />} />
            ))}

            {allRoutes.map((r) => (
              <Route
                key={r.path}
                path={r.path.slice(1)}
                element={
                  <Placeholder titleKey={r.titleKey} groupKey={r.groupKey} />
                }
              />
            ))}

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
