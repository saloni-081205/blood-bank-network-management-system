import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="bg-white shadow-sm border-b-4 border-rose-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
                        <div className="w-9 h-9 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                            <Droplet className="w-5 h-5 text-white" fill="white" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-slate-900">
                            Blood<span className="text-rose-700">Bank</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-3">
                        {user ? (
                            <>
                                <NotificationBell />
                                <span className="text-slate-700 text-sm lg:text-base">
                                    Welcome, <span className="font-semibold">{user.name}</span>
                                </span>
                                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs lg:text-sm font-semibold">
                                    {user.role}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-sm lg:text-base shadow-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login"
                                    className="px-4 py-2 text-rose-700 border border-rose-700 rounded-lg hover:bg-rose-50 transition-colors text-sm lg:text-base">
                                    Login
                                </Link>
                                <Link to="/register"
                                    className="px-4 py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-sm lg:text-base shadow-sm">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-1">
                        {user && <NotificationBell />}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-lg text-rose-700 hover:bg-rose-50 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3">
                    {user ? (
                        <>
                            <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
                                <span className="text-slate-700 text-sm">
                                    Welcome, <span className="font-semibold">{user.name}</span>
                                </span>
                                <span className="self-start px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
                                    {user.role}
                                </span>
                            </div>
                            <button onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-sm font-medium">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMenu}
                                className="block w-full text-center px-4 py-2.5 text-rose-700 border border-rose-700 rounded-lg hover:bg-rose-50 transition-colors text-sm font-medium">
                                Login
                            </Link>
                            <Link to="/register" onClick={closeMenu}
                                className="block w-full text-center px-4 py-2.5 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-sm font-medium">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;