import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "/utils/authService";

export const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const register = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            await registerUser({ username, password });
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.detail || err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return { register, loading, error };
};
