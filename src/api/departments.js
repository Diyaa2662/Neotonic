import client from "./client";

export const departmentsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/departments/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/departments/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/departments/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/departments/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/departments/status/${id}`, {
      isActive,
    });
    return response.data;
  },

  listAllActive: async () => {
    const response = await client.get("/departments/index", {
      params: { page: 1, pageSize: 1000 },
    });
    return (response.data.items || []).filter((d) => d.isActive);
  },
};
