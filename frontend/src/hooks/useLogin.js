import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../utils/authService";

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = async (username, password) => {
        try {

            const payload = {
                username: username,
                password: password
            }
            setLoading(true);
            setError(null);
            await loginUser(payload);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
};
