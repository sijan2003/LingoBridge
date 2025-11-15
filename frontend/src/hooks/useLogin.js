// useLogin.js
import axios from "axios";
import { useState } from "react";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/token/", { username, password });
      // Save tokens etc.
      return response.data;
    } catch (err) {
      const backendMessage = err.response?.data?.detail ||
                             err.response?.data?.non_field_errors?.[0] ||
                             err.response?.data?.error ||
                             err.message ||
                             "Login failed";
      setError(backendMessage);
      throw err; // optional, if you want parent to handle it
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
