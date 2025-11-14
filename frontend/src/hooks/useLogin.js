import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../utils/authService";

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = async (username, password) => {
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username/email and password");
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            await loginUser({ username, password });
            navigate("/dashboard");
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 
                              err.response?.data?.error || 
                              err.message || 
                              "Login failed. Please check your username and password.";
            setError(errorMessage);
            throw err; // Re-throw so component can handle it
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
};
