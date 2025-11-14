import apiClient from './apiClient';

export const registerUser = async (data) => {
    return apiClient.post('/register/', data);
};

export const loginUser = async (data) => {
    // Use custom endpoint that supports both username and email via identifier field
    // This allows users to login with either their username or email address
    const payload = {
        identifier: data.username || data.email || data.identifier,  // Can be username or email
        password: data.password
    }
    console.log("Login payload:", payload);
    const response = await apiClient.post('/user/token/', payload);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
};

export const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    const response = await apiClient.post('/token/refresh/', { refresh });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
};

export const getProfile = async () => {
    return apiClient.get('/user/profile/');
};

export const logoutUser = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};
