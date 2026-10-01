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
import { navigationGroups } from "./data/navigation";
import "devextreme/dist/css/dx.fluent.blue.light.css";

// الصفحات الحقيقية المبنية (باقي الصفحات تستخدم Placeholder)
const realPages = {
  "/categories": CategoriesList,
  "/material-types": MaterialTypesList,
  "/materials-list": MaterialsList,
  "/step-types": StepTypesList,
  "/steps": StepsList,
};

function App() {
  const allRoutes = navigationGroups.flatMap((group) =>
    group.items
      .filter((item) => !realPages[item.path]) // نستثني الصفحات الحقيقية
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

            {/* الصفحات الحقيقية */}
            {Object.entries(realPages).map(([path, Component]) => (
              <Route key={path} path={path.slice(1)} element={<Component />} />
            ))}

            {/* الصفحات المؤقتة */}
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
