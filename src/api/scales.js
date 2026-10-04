import client from "./client";

export const scalesApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/scales/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/scales/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/scales/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/scales/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/scales/status/${id}`, { isActive });
    return response.data;
  },
};
