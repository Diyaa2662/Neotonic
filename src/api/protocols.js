import client from "./client";

export const protocolsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/protocols/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/protocols/${id}`);
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/protocols/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/protocols/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/protocols/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/protocols/status/${id}`, { isActive });
    return response.data;
  },

  /**
   * تحديث قائمة المراحل للبروتوكول
   * @param {number|string} id
   * @param {number[]} stepIds - معرفات المراحل بالترتيب
   */
  updateSteps: async (id, stepIds) => {
    const response = await client.put(`/protocols/${id}/steps`, { stepIds });
    return response.data;
  },
};
