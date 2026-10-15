import client from "./client";

export const memosInApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20, typeId } = params;
    const queryParams = { page, pageSize };
    // فلترة بـ typeId (1 = In) إذا أردت
    if (typeId) queryParams.typeId = typeId;
    const response = await client.get("/memos/index", {
      params: queryParams,
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/memos/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/memos/in/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/memos/in/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/memos/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/memos/status/${id}`, { isActive });
    return response.data;
  },
};
