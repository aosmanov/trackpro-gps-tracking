import api from '../config/api';

export const authService = {
  // Dispatcher login
  async loginDispatcher(email, password) {
    const response = await api.post('/auth/login/dispatcher', {
      email,
      password,
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Trigger auth state update
    window.dispatchEvent(new Event('authChange'));
    
    return { token, user };
  },

  // Technician login
  async loginTechnician(phone, pin) {
    const response = await api.post('/auth/login/technician', {
      phone,
      pin,
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Trigger auth state update
    window.dispatchEvent(new Event('authChange'));
    
    return { token, user };
  },

  // Register new company and dispatcher
  async register(companyData) {
    const response = await api.post('/auth/register', companyData);
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Trigger auth state update
    window.dispatchEvent(new Event('authChange'));
    
    return { token, user };
  },

  // Create technician
  async createTechnician(technicianData) {
    const response = await api.post('/auth/create-technician', technicianData);
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Trigger auth state update
    window.dispatchEvent(new Event('authChange'));
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  },
};