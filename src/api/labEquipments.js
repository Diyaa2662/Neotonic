import client from "./client";

export const labEquipmentsApi = {
  list: async (params = {}) => {
    const { page = 1, pageSize = 20 } = params;
    const response = await client.get("/labequipments/index", {
      params: { page, pageSize },
    });
    return response.data;
  },

  create: async (payload) => {
    const response = await client.post("/labequipments/create", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await client.put(`/labequipments/update/${id}`, payload);
    return response.data;
  },

  remove: async (id) => {
    const response = await client.delete(`/labequipments/delete/${id}`);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await client.put(`/labequipments/status/${id}`, {
      isActive,
    });
    return response.data;
  },
};
