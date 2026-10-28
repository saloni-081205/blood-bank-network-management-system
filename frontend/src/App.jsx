import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import HospitalProfile from './pages/hospital/HospitalProfile';
import CreateRequest from './pages/hospital/CreateRequest';
import CreateEmergencyRequest from './pages/hospital/CreateEmergencyRequest';
import RequestHistory from './pages/hospital/RequestHistory';
import DonorProfile from './pages/donor/DonorProfile';
import DonorEligibility from './pages/donor/DonorEligibility';
import DonationHistory from './pages/donor/DonationHistory';
import RecordDonation from './pages/donor/RecordDonation';
import BloodAvailability from './pages/donor/BloodAvailability';
import DonorManagement from './pages/admin/DonorManagement';
import DonationManagement from './pages/admin/DonationManagement';
import Inventory from './pages/admin/Inventory';
import HospitalManagement from './pages/admin/HospitalManagement';
import BloodRequests from './pages/admin/BloodRequests';
import EmergencyQueue from './pages/admin/EmergencyQueue';
import Notifications from './pages/Notifications';
import Landing from './pages/Landing';

const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <div>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['ADMIN']}><DonorManagement /></ProtectedRoute>} />
                <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={['ADMIN']}><DonationManagement /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['ADMIN']}><Inventory /></ProtectedRoute>} />
                <Route path="/admin/hospitals" element={<ProtectedRoute allowedRoles={['ADMIN']}><HospitalManagement /></ProtectedRoute>} />
                <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['ADMIN']}><BloodRequests /></ProtectedRoute>} />
                <Route path="/admin/emergency" element={<ProtectedRoute allowedRoles={['ADMIN']}><EmergencyQueue /></ProtectedRoute>} />

                {/* Donor */}
                <Route path="/donor" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
                <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorProfile /></ProtectedRoute>} />
                <Route path="/donor/eligibility" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorEligibility /></ProtectedRoute>} />
                <Route path="/donor/record-donation" element={<ProtectedRoute allowedRoles={['DONOR']}><RecordDonation /></ProtectedRoute>} />
                <Route path="/donor/donations" element={<ProtectedRoute allowedRoles={['DONOR']}><DonationHistory /></ProtectedRoute>} />
                <Route path="/donor/availability" element={<ProtectedRoute allowedRoles={['DONOR']}><BloodAvailability /></ProtectedRoute>} />

                {/* Hospital */}
                <Route path="/hospital" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><HospitalDashboard /></ProtectedRoute>} />
                <Route path="/hospital/profile" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><HospitalProfile /></ProtectedRoute>} />
                <Route path="/hospital/availability" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><BloodAvailability /></ProtectedRoute>} />
                <Route path="/hospital/request" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><CreateRequest /></ProtectedRoute>} />
                <Route path="/hospital/emergency-request" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><CreateEmergencyRequest /></ProtectedRoute>} />
                <Route path="/hospital/requests" element={<ProtectedRoute allowedRoles={['HOSPITAL']}><RequestHistory /></ProtectedRoute>} />

                <Route path="/notifications" element={
    <ProtectedRoute allowedRoles={['ADMIN', 'DONOR', 'HOSPITAL']}>
        <Notifications />
    </ProtectedRoute>
} />

                {/* Root — landing for guests, dashboard for logged-in */}
                <Route path="/" element={
                    user ? (
                        user.role === 'ADMIN' ? <Navigate to="/admin" /> :
                        user.role === 'DONOR' ? <Navigate to="/donor" /> :
                        <Navigate to="/hospital" />
                    ) : <Landing />
                } />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider><AppRoutes /></AuthProvider>
        </Router>
    );
}

export default App;