import client from "./client";

export const clothesApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/clothes/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/clothes/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/clothes/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/clothes/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/clothes/status/${id}`, { isActive });
    return response.data;
  },

  listAllActive: async () => {
    const response = await client.get("/clothes/index", {
      params: { page: 1, pageSize: 1000 },
    });
    return (response.data.items || []).filter((c) => c.isActive);
  },
};
