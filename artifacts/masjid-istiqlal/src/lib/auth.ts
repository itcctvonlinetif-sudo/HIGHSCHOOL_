// Simple auth helper for admin panel
export const getAuthToken = () => localStorage.getItem("adminToken");
export const setAuthToken = (token: string) => localStorage.setItem("adminToken", token);
export const removeAuthToken = () => localStorage.removeItem("adminToken");
export const isAuthenticated = () => !!getAuthToken();
