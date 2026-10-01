/**
 * فك الـ payload من JWT بدون مكتبات خارجية
 * ملاحظة: هذا للقراءة فقط، وليس للتحقق من التوقيع (التحقق مهمة السيرفر)
 */
export function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * هل التوكن منتهي الصلاحية؟
 */
export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  // exp بالثواني، Date.now بالميلي ثانية
  return payload.exp * 1000 < Date.now();
}
