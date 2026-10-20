import React from 'react';
import { Navigate } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        if (user.role === 'DONOR') return <Navigate to="/donor" replace />;
        if (user.role === 'HOSPITAL') return <Navigate to="/hospital" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;