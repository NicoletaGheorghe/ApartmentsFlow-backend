"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiClient } from "../../../apiClient/apiClient";

const AuthContext = createContext();

export const AuthProvider =({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const apiClient = new ApiClient();
    useEffect(() => {
        setIsLoggedIn(apiClient.isLoggedIn());
        setLoading(false);
}, []);
    const login = async (email, password) => {
        const response = await apiClient.login(email, password);
        setIsLoggedIn(true);
        return response;
    };
    const logout = async () => {
        await apiClient.logout();
        setIsLoggedIn(false);
    };
    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, loading}}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => useContext(AuthContext);