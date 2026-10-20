import api from './api';

export const donorService = {
    // Donor self
    getMyProfile: () => api.get('/donors/profile'),
    updateMyProfile: (data) => api.put('/donors/profile', data),
    getEligibility: (id) => api.get(`/donors/${id}/eligibility`),

    // Admin
    getAllDonors: (params = {}) => api.get('/donors', { params }),
    getDonorById: (id) => api.get(`/donors/${id}`),
    updateDonor: (id, data) => api.put(`/donors/${id}`, data),
    deactivateDonor: (id) => api.put(`/donors/${id}/deactivate`),
};