import api from './api';

export const requestService = {
    create: (data) => api.post('/requests', data),
    getAll: (params = {}) => api.get('/requests', { params }),
    getById: (id) => api.get(`/requests/${id}`),

    // Emergency
    getEmergencyQueue: () => api.get('/requests/emergency'),

    // Workflow actions (same for normal & emergency)
    approve: (id) => api.put(`/requests/${id}/approve`),
    reject: (id, reason) => api.put(`/requests/${id}/reject`, { reason }),
    issue: (id) => api.put(`/requests/${id}/issue`),
    complete: (id) => api.put(`/requests/${id}/complete`),
};