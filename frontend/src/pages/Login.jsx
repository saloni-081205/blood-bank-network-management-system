import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, error } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError('');
        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            const role = result.user.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'DONOR') navigate('/donor');
            else if (role === 'HOSPITAL') navigate('/hospital');
        } else {
            setLocalError(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md mx-auto text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-700 flex items-center justify-center shadow-lg shadow-rose-200">
                    <Droplet className="w-8 h-8 text-white" fill="white" />
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Sign in to your BloodBank account
                </p>
            </div>

            <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
                <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl rounded-2xl border-t-4 border-rose-700">
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {(localError || error) && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{localError || error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 transition-shadow"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 transition-shadow"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold text-white bg-rose-700 hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <div className="text-center text-sm text-slate-600 pt-1">
                            New here?{' '}
                            <Link to="/register" className="font-semibold text-rose-700 hover:text-rose-800">
                                Create an account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;