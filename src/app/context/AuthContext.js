"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiClient } from "../../../apiClient/apiClient";

const AuthContext = createContext();

export const AuthProvider =({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    const apiClient = new ApiClient();
    useEffect(() => {
        const checkAuth = async () => {
            const loggedIn = apiClient.isLoggedIn();
            setIsLoggedIn(loggedIn);
            if(loggedIn) {
                try {
                    const response = await apiClient.getProfile();
                     setUser(response.data);       
                } catch (err) {
                    console.error("Failed to fetch user profile:", err);
                    setUser(null);
                    setIsLoggedIn(false);
                }
            }
            setLoading(false);
    };
    checkAuth();
}, []);
    const register = async (name, email, password) => {
        const response = await apiClient.register(name, email, password);
        setIsLoggedIn(true);
        const userRes = await apiClient.getProfile();
        setUser(userRes.data);
        return response;
    }
    const login = async (email, password) => {
        const response = await apiClient.login(email, password);
        setIsLoggedIn(true);
         const userRes = await apiClient.getProfile();
        setUser(userRes.data);
        return response;
    };
    const logout = async () => {
        await apiClient.logout();
        setIsLoggedIn(false);
        setUser(null);
    };
    const deleteAccount = async () => {
        try {
            await apiClient.removeProfile();
            setIsLoggedIn(false);
            setUser(null);
       } catch (error) { 
           console.error("Failed to delete account.", error);
           throw error;
       }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, setUser, register, login, logout, deleteAccount, loading}}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => useContext(AuthContext);