import api from '../config/api';

export const jobService = {
  // Get jobs for company
  async getCompanyJobs(companyId, params = {}) {
    const response = await api.get(`/jobs/company/${companyId}`, { params });
    return response.data;
  },

  // Get jobs for technician
  async getTechnicianJobs(technicianId, params = {}) {
    const response = await api.get(`/jobs/technician/${technicianId}`, { params });
    return response.data;
  },

  // Create new job
  async createJob(jobData) {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  // Assign technician to job
  async assignTechnician(jobId, technicianId) {
    const response = await api.put(`/jobs/${jobId}/assign`, { technicianId });
    return response.data;
  },

  // Update job status
  async updateJobStatus(jobId, status, notes = '') {
    const response = await api.put(`/jobs/${jobId}/status`, { status, notes });
    return response.data;
  },

  // Update technician location
  async updateLocation(jobId, locationData) {
    const response = await api.post(`/jobs/${jobId}/location`, locationData);
    return response.data;
  },

  // Get job by tracking code (public)
  async getJobByTrackingCode(trackingCode) {
    const response = await api.get(`/jobs/track/${trackingCode}`);
    return response.data;
  },
};