import client from "./client";

export const stepTypesApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/steptypes/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/steptypes/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/steptypes/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/steptypes/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/steptypes/status/${id}`, { isActive });
    return response.data;
  },

  /**
   * جلب كل أنواع المراحل النشطة لملء القوائم
   */
  listAllActive: async () => {
    const response = await client.get("/steptypes/index", {
      params: { page: 1, pageSize: 1000 },
    });
    return (response.data.items || []).filter((s) => s.isActive);
  },
};
