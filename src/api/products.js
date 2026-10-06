import client from "./client";

export const productsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/products/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/products/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/products/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/products/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/products/status/${id}`, { isActive });
    return response.data;
  },
};
