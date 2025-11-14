import axios from 'axios';
import { getApiEndpoint } from "./helpers";

// Store getApiEndpoint for use in interceptor
const API_ENDPOINT = getApiEndpoint();

const apiClient = axios.create({
    baseURL: getApiEndpoint(),
});

// Create a separate axios instance for token refresh (no interceptors)
const refreshClient = axios.create({
    baseURL: getApiEndpoint(),
});


apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);



// Response interceptor to handle 401 and refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Skip token refresh for auth endpoints and if already retried
        if (error.response?.status === 401 && !originalRequest._retry && 
            !originalRequest.url?.includes('/token/') && 
            !originalRequest.url?.includes('/register/') &&
            !originalRequest.url?.includes('/login/') &&
            !originalRequest.url?.includes('/user/token/')) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem("refresh_token");
                
                // If no refresh token, redirect to login
                if (!refresh) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                    return Promise.reject(error);
                }
                
                // Use separate axios instance to avoid interceptor loop
                // Use the main token refresh endpoint at /api/token/refresh/
                const refreshResponse = await refreshClient.post(
                    '/token/refresh/',
                    { refresh },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (refreshResponse.data && refreshResponse.data.access) {
                    localStorage.setItem("access_token", refreshResponse.data.access);
                    // Update refresh token if a new one is provided
                    if (refreshResponse.data.refresh) {
                        localStorage.setItem("refresh_token", refreshResponse.data.refresh);
                    }
                    originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
                    return apiClient(originalRequest);
                } else {
                    throw new Error("Invalid refresh token response");
                }
            } catch (err) {
                console.error("Token refresh failed:", err.response?.data || err.message);
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login"; // redirect to login
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);
export default apiClient;
