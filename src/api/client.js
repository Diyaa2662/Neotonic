import axios from "axios";

// ✅ التعديل: استخدام مسار نسبي بدلاً من الرابط الكامل
// Vercel سيتولى تمرير الطلبات إلى http://neotonic.runasp.net/api
// import.meta.env.VITE_API_BASE_URL ||
const BASE_URL = "/api";
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: إرفاق التوكن
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("neotonic_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: التعامل الموحد مع الأخطاء
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("neotonic_token");
      localStorage.removeItem("neotonic_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default client;
