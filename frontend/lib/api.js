// API base URL and token helpers for calling backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getApiUrl() {
  return API_URL;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cert_token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cert_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cert_token");
}

export function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
