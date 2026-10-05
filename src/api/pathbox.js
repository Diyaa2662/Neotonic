import client from "./client";

export const pathboxApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/boxpath/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/boxpath/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/boxpath/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/boxpath/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/boxpath/status/${id}`, { isActive });
    return response.data;
  },
};
