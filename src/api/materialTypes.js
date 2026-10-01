import client from "./client";

export const materialTypesApi = {
  /**
   * جلب قائمة أنواع المواد
   */
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/materialtypes/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * إنشاء نوع مادة جديد
   */
  create: async (payload) => {
    const response = await client.post("/materialtypes/create", payload);
    return response.data;
  },

  /**
   * تعديل نوع مادة
   */
  update: async (id, payload) => {
    const response = await client.put(`/materialtypes/update/${id}`, payload);
    return response.data;
  },

  /**
   * حذف نوع مادة
   */
  remove: async (id) => {
    const response = await client.delete(`/materialtypes/delete/${id}`);
    return response.data;
  },

  /**
   * تغيير حالة نوع مادة
   */
  setStatus: async (id, isActive) => {
    const response = await client.put(`/materialtypes/status/${id}`, {
      isActive,
    });
    return response.data;
  },
};
