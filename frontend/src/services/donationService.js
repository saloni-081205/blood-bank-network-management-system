import api from './api';

export const donationService = {
    // POST — record a donation
    create: (data) => api.post('/donations', data),

    // GET — all donations (admin) or own (donor)
    getAll: (params = {}) => api.get('/donations', { params }),

    // GET — one donation
    getById: (id) => api.get(`/donations/${id}`),

    // GET — donations for a specific donor
    getByDonor: (donorId) => api.get(`/donors/${donorId}/donations`),
};