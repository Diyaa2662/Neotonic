import client from "./client";

export const contractReviewsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/contractreviews/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/contractreviews/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/contractreviews/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/contractreviews/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/contractreviews/status/${id}`, {
      isActive,
    });
    return response.data;
  },
};
