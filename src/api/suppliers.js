import client from "./client";

export const suppliersApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/suppliers/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/suppliers/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/suppliers/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/suppliers/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/suppliers/status/${id}`, { isActive });
    return response.data;
  },
};
