import client from "./client";

export const workersApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/workers/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/workers/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/workers/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/workers/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/workers/status/${id}`, { isActive });
    return response.data;
  },

  listAllActive: async () => {
    const response = await client.get("/workers/index", {
      params: { page: 1, pageSize: 1000 },
    });
    return (response.data.items || []).filter((w) => w.isActive);
  },
};
