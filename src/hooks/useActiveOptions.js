import { useEffect, useState } from "react";
import { categoriesApi } from "../api/categories";
import { materialTypesApi } from "../api/materialTypes";
import { stepTypesApi } from "../api/stepTypes";

export function useActiveOptions() {
  const [categories, setCategories] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [stepTypes, setStepTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([
      categoriesApi.listAllActive().catch(() => []),
      materialTypesApi.listAllActive().catch(() => []),
      stepTypesApi.listAllActive().catch(() => []),
    ])
      .then(([cats, mats, steps]) => {
        if (cancelled) return;
        setCategories(cats);
        setMaterialTypes(mats);
        setStepTypes(steps);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, materialTypes, stepTypes, loading };
}
