import axios from "axios";

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export class ApiClient {
    constructor(getAuthToken, clearAuthToken) {
        this.getAuthToken = getAuthToken;
        this.clearAuthToken = clearAuthToken;
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                "Content-Type": "application/json",
            },
        });
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
    );
      this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                  this.removeToken();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/auth/unauthorized';
                  }
                }
                return Promise.reject(error);
            }
            );
        }
        getToken() {
            if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            return token;
            }
            return null;
        }

        setToken(token) {
            if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
            // Update axios default headers
            this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        removeToken() {
            if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            delete this.axiosInstance.defaults.headers['Authorization'];
            }
        }

        isLoggedIn() {
            const isLoggedIn = !!this.getToken();
            return isLoggedIn;
        }

        async apiCall(method, url, data, config = {}) {
            try {
                const response = await this.axiosInstance({
                    method,
                    url,
                    data,
                    ...config,
                });
                return response;
            } catch (error) {
                console.error("API call error:", error.response ? error.response.data : error.message);
                throw error;
            }
        }
       async login(email, password) {
            try {
                const response = await this.apiCall("post", API_BASE_URL + "/auth/login", { email, password });
                
                if (response.data && response.data.token) {
                    this.setToken(response.data.token);
                    return response;
                } else {
                    throw new Error('No token received from server');
                }
        
            } catch (error) {
                throw error;
                }
        }
    
        async logout() {
           const token = this.getToken();
            try {
                if (token) {
                    await this.apiCall("post", API_BASE_URL + "/auth/logout", {token});
                }
            }catch (error) {
                console.error('Logout error:', error?.response?.data || error.message);
            } finally {
                this.removeToken();
                if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
          } 
 } 
       async register(name, email, password) {
          try {
            const response = await this.apiCall("post", API_BASE_URL + "/auth/register", { name, email, password });
          if (response.data && response.data.token) {
                    this.setToken(response.data.token);
                    return response;
                } else {
                    throw new Error('No token received from server');
                }
        
            } catch (error) {
                throw error;
                }

       }
       async getProfile() {
        try{
            const response = await this.apiCall("get", API_BASE_URL + "/users/profile");
            return response;
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            throw error;
        }
       }

       async updateProfile(data) {
            try {
                  const response = await this.apiCall("put", API_BASE_URL + "/users/profile", data);
                    return response.data;
        
            } catch (error) {
                throw error;
                }
       }
       async removeProfile() {
            const response = await this.apiCall("delete", API_BASE_URL + "/users/profile");
            return response.data;
        }

       async createApartment(formData) {
        return this.apiCall("post", "/apartments", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }

       async getApartments(page = 1, limit = 6, filters = {}) {
            const params = { page, limit, ...filters };
            try {
                const queryString = new URLSearchParams(params).toString();
                const endpoint = "/apartments" + (queryString ? `?${queryString}` : "");
                const response = await this.apiCall("get", endpoint);
                return response;
            } catch (error) {
                throw error;
            }
        }

        async getApartment(id) {
            try {
                const response = await this.apiCall("get", `/apartments/${id}`);
                return response;
            } catch (error) {
                throw error;
            }
        }

        // Notes API methods
        async getNotes(filters = {}) {
            try {
                const params = new URLSearchParams(filters).toString();
                const endpoint = "/notes" + (params ? `?${params}` : "");
                const response = await this.apiCall("get", endpoint);
                return response;
            } catch (error) {
                throw error;
            }
        }

        async createNote(noteData) {
            try {
                const response = await this.apiCall("post", "/notes", noteData);
                return response;
            } catch (error) {
                throw error;
            }
        }

        async updateNote(noteId, noteData) {
            try {
                const response = await this.apiCall("put", `/notes/${noteId}`, noteData);
                return response;
            } catch (error) {
                throw error;
            }
        }

        async deleteNote(noteId) {
            try {
                const response = await this.apiCall("delete", `/notes/${noteId}`);
                return response;
            } catch (error) {
                throw error;
            }
        }

        // Favorites API methods
        async getFavorites() {
            try {
                const response = await this.apiCall("get", "/favorites");
                return response;
            } catch (error) {
                throw error;
            }
        }

        async addFavorite(apartmentId) {
            try {
                const response = await this.apiCall("post", "/favorites", { apartmentId });
                return response;
            } catch (error) {
                throw error;
            }
        }

        async removeFavorite(apartmentId) {
            try {
                const response = await this.apiCall("delete", `/favorites/${apartmentId}`);
                return response;
            } catch (error) {
                throw error;
            }
        }

}