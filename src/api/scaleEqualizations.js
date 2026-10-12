import client from "./client";

export const scaleEqualizationsApi = {
  /**
   * جلب قائمة المعايرات
   * @param {{ page?: number, pageSize?: number, scaleId?: number }} params
   */
  list: async (params = {}) => {
    const { page = 1, pageSize = 20, scaleId } = params;
    const queryParams = { page, pageSize };
    if (scaleId) queryParams.scaleId = scaleId;
    const response = await client.get("/scaleequalizations/index", {
      params: queryParams,
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/scaleequalizations/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(
      `/scaleequalizations/update/${id}`,
      payload,
    );
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/scaleequalizations/delete/${id}`);
    return response.data;
  },
};
