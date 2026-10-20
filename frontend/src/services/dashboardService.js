import api from './api';

export const dashboardService = {
    getAdmin: () => api.get('/dashboard/admin'),
    getDonor: () => api.get('/dashboard/donor'),
    getHospital: () => api.get('/dashboard/hospital'),
};