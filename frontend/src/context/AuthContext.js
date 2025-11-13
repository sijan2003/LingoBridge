import React, { createContext, useState, useEffect } from "react";
import { getProfile, logoutUser } from "../utils/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const res = await getProfile();
            setUser(res.data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        logoutUser();
        setUser(null);
        window.location.href = "/login";
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token && process.env.NEXT_PUBLIC_API_URL) {
            loadUser();
        }
    }, []);


    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
