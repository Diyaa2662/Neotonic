import client from "./client";

export const annualPlansApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/annualplans/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/annualplans/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/annualplans/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/annualplans/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/annualplans/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/annualplans/status/${id}`, {
      isActive,
    });
    return response.data;
  },
};
