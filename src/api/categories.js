import client from "./client";

export const categoriesApi = {
  /**
   * جلب قائمة الفئات
   */
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/categories/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * إنشاء فئة جديدة
   */
  create: async (payload) => {
    const response = await client.post("/categories/create", payload);
    return response.data;
  },

  /**
   * تعديل فئة
   * @param {number|string} id
   * @param {{ nameEn: string, nameAr: string }} payload
   */
  update: async (id, payload) => {
    const response = await client.put(`/categories/update/${id}`, payload);
    return response.data;
  },

  /**
   * حذف فئة
   * @param {number|string} id
   */
  remove: async (id) => {
    const response = await client.delete(`/categories/delete/${id}`);
    return response.data;
  },

  /**
   * تغيير حالة فئة (تفعيل/تعطيل)
   * @param {number|string} id
   * @param {boolean} isActive
   */
  setStatus: async (id, isActive) => {
    const response = await client.put(`/categories/status/${id}`, { isActive });
    return response.data;
  },
};
