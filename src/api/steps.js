import client from "./client";

export const stepsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/steps/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/steps/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/steps/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/steps/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/steps/status/${id}`, { isActive });
    return response.data;
  },
};
