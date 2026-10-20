import api from './api';

export const hospitalService = {
    // Self
    getMyProfile: () => api.get('/hospitals/profile'),
    updateMyProfile: (data) => api.put('/hospitals/profile', data),

    // Admin
    getAll: (params = {}) => api.get('/hospitals', { params }),
    getById: (id) => api.get(`/hospitals/${id}`),
    updateStatus: (id, status) => api.put(`/hospitals/${id}/status`, { status }),
    getCities: () => api.get('/hospitals/cities'),
};