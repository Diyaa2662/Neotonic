import client from "./client";

export const materialsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/materials/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/materials/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/materials/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/materials/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/materials/status/${id}`, { isActive });
    return response.data;
  },
};
