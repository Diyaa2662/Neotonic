import client from "./client";

export const machinesApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/machines/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/machines/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/machines/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/machines/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/machines/status/${id}`, { isActive });
    return response.data;
  },
};
