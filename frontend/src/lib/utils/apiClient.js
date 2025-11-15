import axios from 'axios';
import { getApiEndpoint } from "./helpers";

const apiClient = axios.create({
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem("refresh_token");
                const res = await apiClient.post("token/refresh/", { refresh });
                localStorage.setItem("access_token", res.data.access);
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return apiClient(originalRequest);
            } catch (err) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login"; // redirect to login
            }
        }
        return Promise.reject(error);
    }
);
export default apiClient;
