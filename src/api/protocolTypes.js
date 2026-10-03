import client from "./client";

export const protocolTypesApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/protocoltypes/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/protocoltypes/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/protocoltypes/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/protocoltypes/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/protocoltypes/status/${id}`, {
      isActive,
    });
    return response.data;
  },

  listAllActive: async () => {
    const response = await client.get("/protocoltypes/index", {
      params: { page: 1, pageSize: 1000 },
    });
    return (response.data.items || []).filter((p) => p.isActive);
  },
};
