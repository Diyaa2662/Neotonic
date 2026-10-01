import { useState, useCallback, useMemo } from "react";
import AuthContext from "./AuthContext";
import { authApi } from "../api/auth";
import { authStorage } from "../utils/authStorage";
import { isTokenExpired } from "../utils/jwt";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = authStorage.getToken();
    if (!token || isTokenExpired(token)) {
      authStorage.clear();
      return null;
    }
    return authStorage.getUser();
  });

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const { token, user: userData } = response.data;

    authStorage.save(token, userData);
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
