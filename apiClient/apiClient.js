import axios from "axios";
const url = "http://localhost:3000/api";


export class ApiClient {
    constructor() {
        this.axiosInstance = axios.create({
            headers:{
                Authorization: `Bearer ${this.getToken()}`,
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

        async apiCall(method, url, data) {
            try {
            const response = await this.axiosInstance({
                method,
                url,
                data,
            });
            return response;
            } catch (error) {
            console.error('API call error:', error.response?.data || error.message || error); 
            if (error.response && error.response.status === 401) {
                this.removeToken();
                if (typeof window !== 'undefined') {
                window.location.href = '/auth/unauthorized';
                }
            }
            throw error;
            }
        }
       async login(email, password) {
            try {
                const response = await this.apiCall("post", url + "/auth/login", { email, password });
                
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
                    await this.apiCall("post", url + "/auth/logout", {token});
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
            const response = await this.apiCall("post", url + "/auth/register", { name, email, password });
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
            const response = await this.apiCall("get", url + "/users/profile");
            return response;
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            throw error;
        }
       }

       async updateProfile(data) {
            try {
                  const response = await this.apiCall("put", url + "/users/profile", data);
                    return response.data;
        
            } catch (error) {
                throw error;
                }
       }
       async removeProfile() {
            const response = await this.apiCall("delete", url + "/users/profile");
            return response.data;
        }

       async createApartment(
        title,
        description,
        price,
        location,
        bedrooms,
        bathrooms,
        area,
        amenities,
        images,
        status
       ) {
        try {
            const numericPrice = Number(price);
            const numericBedrooms = Number(bedrooms);
            const numericBathrooms = Number(bathrooms);
            const numericArea = Number(area);
            if (isNaN(numericPrice)) {
                throw new Error("Price must be a valid number.");
            }
            if (isNaN(numericBedrooms)) {
                throw new Error("Bedrooms must be a valid number.");
            }
            if (isNaN(numericBathrooms)) {
                throw new Error ("Bathrooms must be a valid number.");
            }
            if (isNaN(numericArea)) {
                throw new Error ("Area must be a valid number.");
            }
            return this.apiCall("post", url + "/apartments", {
                title,
                description,
                price : numericPrice,
                location,
                bedrooms: numericBedrooms,
                bathrooms: numericBathrooms,
                area: numericArea,
                amenities,
                images,
                status
            });
        } catch (error) {
            console.error("addAd error:", error.response || error); 
            throw error;
            }
       }
       async getApartments(params = {page, limit}) {
            try {
                const queryString = new URLSearchParams(params).toString();
                const endpoint = url + "/apartments" + (queryString ? `?${queryString}` : "") ;
                const response = await this.apiCall("get", endpoint);
                return response;
            } catch (error) {
                throw error;
            }
        }
      
}