import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import { navigationGroups } from "./data/navigation";
import "devextreme/dist/css/dx.fluent.blue.light.css";

function App() {
  // توليد كل المسارات من ملف التنقل تلقائياً
  const allRoutes = navigationGroups.flatMap((group) =>
    group.items.map((item) => ({
      path: item.path,
      titleKey: item.key,
      groupKey: group.key,
    })),
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />

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
    </BrowserRouter>
  );
}

export default App;
