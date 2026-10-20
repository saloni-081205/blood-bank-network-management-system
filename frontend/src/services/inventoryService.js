import api from './api';

export const inventoryService = {
    getAll: () => api.get('/inventory'),
    getByGroup: (bloodGroup) => api.get(`/inventory/${encodeURIComponent(bloodGroup)}`),
    getLowStockAlerts: () => api.get('/inventory/alerts/low-stock'),
    getExpired: () => api.get('/inventory/alerts/expired'),
    update: (id, data) => api.put(`/inventory/${id}`, data),
};