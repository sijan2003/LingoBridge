import React, {createContext, useState, useEffect, useContext} from "react";
import { getProfile, logoutUser } from "../utils/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            const response = await getProfile();
            setUser(response.data);
        } catch (err) {
            console.error("Failed to load user:", err);
            setUser(null);
            // Clear invalid tokens
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
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
        // Only log when in development and user/token exists
        if (process.env.NODE_ENV === 'development' && (user || localStorage.getItem("access_token"))) {
            console.log("🔍 Current user:", user);
            console.log("🔍 Token:", localStorage.getItem("access_token") ? "Present" : "Missing");
        }
    }, [user]);


    useEffect(() => {

            loadUser();

    }, []);


    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => useContext(AuthContext);