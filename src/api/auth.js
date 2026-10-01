import client from "./client";

export const authApi = {
  /**
   * تسجيل الدخول
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: object }>}
   */
  login: (credentials) => client.post("/auth/login", credentials),
};
