import { Platform } from "react-native";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
let authToken = null;

export function setAuthToken(token) { authToken = token || null; }
export function getApiBaseUrl() { return API_BASE_URL; }

export async function request(path, options = {}) {
    const headers = { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch (_error) {
        const hostHint = Platform.OS === "android" ? " No Android Emulator, use http://10.0.2.2:3000/api ou configure EXPO_PUBLIC_API_URL." : " Configure EXPO_PUBLIC_API_URL para apontar ao backend.";
        throw new Error(`Não foi possível conectar ao servidor.${hostHint}`);
    }
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
        const error = new Error(payload?.error || `Falha na requisição (${response.status}).`);
        error.status = response.status;
        error.code = payload?.code;
        throw error;
    }
    return payload;
}
