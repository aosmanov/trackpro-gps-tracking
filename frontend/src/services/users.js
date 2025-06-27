import api from '../config/api';

export const userService = {
  // Get technicians for company
  async getCompanyTechnicians(companyId) {
    const response = await api.get(`/users/company/${companyId}/technicians`);
    return response.data;
  },

  // Get technician profile
  async getTechnicianProfile(technicianId) {
    const response = await api.get(`/users/technician/${technicianId}/profile`);
    return response.data;
  },

  // Update technician profile
  async updateTechnicianProfile(technicianId, profileData) {
    const response = await api.put(`/users/technician/${technicianId}/profile`, profileData);
    return response.data;
  },

  // Change technician PIN
  async changeTechnicianPin(technicianId, currentPin, newPin) {
    const response = await api.put(`/users/technician/${technicianId}/change-pin`, {
      currentPin,
      newPin,
    });
    return response.data;
  },
};