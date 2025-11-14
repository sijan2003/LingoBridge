import apiClient from './apiClient';

export const registerUser = async (data) => {
    return apiClient.post('/user/register/', data);
};

export const loginUser = async (data) => {

    const payload = {
        username: data.username,
        password: data.password
    }
    console.log(payload,"authservice",data.username , data.password)
    const response = await apiClient.post('/token/', payload);
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
