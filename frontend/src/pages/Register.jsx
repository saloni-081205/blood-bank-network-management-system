import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, UserRound, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register, error } = useAuth();
    const [role, setRole] = useState('DONOR');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', role: 'DONOR',
        date_of_birth: '', gender: 'MALE', blood_group: 'A+', weight: '',
        address: '', city: '',
        hospital_name: '', license_number: '', contact_number: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleRoleChange = (selectedRole) => {
        setRole(selectedRole);
        setFormData({ ...formData, role: selectedRole });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError('');

        let userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: formData.role,
        };

        if (formData.role === 'DONOR') {
            userData = {
                ...userData,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                blood_group: formData.blood_group,
                weight: parseFloat(formData.weight),
                address: formData.address,
                city: formData.city,
            };
        } else if (formData.role === 'HOSPITAL') {
            userData = {
                ...userData,
                hospital_name: formData.hospital_name,
                license_number: formData.license_number,
                contact_number: formData.contact_number,
                address: formData.address,
                city: formData.city,
            };
        }

        const result = await register(userData);
        setLoading(false);

        if (result.success) navigate('/login');
        else setLocalError(result.error || 'Registration failed');
    };

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 transition-shadow';

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-700 flex items-center justify-center shadow-lg shadow-rose-200">
                        <Droplet className="w-8 h-8 text-white" fill="white" />
                    </div>
                    <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Join the BloodBank network
                    </p>
                </div>

                <div className="mt-6 sm:mt-8 bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl rounded-2xl border-t-4 border-rose-700">
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {(localError || error) && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{localError || error}</span>
                            </div>
                        )}

                        {/* Role Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">I am a...</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('DONOR')}
                                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-2.5 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base border-2 ${
                                        role === 'DONOR'
                                            ? 'bg-rose-700 text-white border-rose-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                                    }`}
                                >
                                    <UserRound className="w-4 h-4" />
                                    Donor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('HOSPITAL')}
                                    className={`flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-2.5 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base border-2 ${
                                        role === 'HOSPITAL'
                                            ? 'bg-rose-700 text-white border-rose-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                                    }`}
                                >
                                    <Building2 className="w-4 h-4" />
                                    Hospital
                                </button>
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name *</label>
                                <input type="text" name="name" required value={formData.name}
                                    onChange={handleChange} className={inputClass} placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email *</label>
                                <input type="email" name="email" required value={formData.email}
                                    onChange={handleChange} className={inputClass} placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Password *</label>
                                <input type="password" name="password" required minLength="6"
                                    value={formData.password} onChange={handleChange}
                                    className={inputClass} placeholder="Min 6 characters" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone *</label>
                                <input type="text" name="phone" required value={formData.phone}
                                    onChange={handleChange} className={inputClass} placeholder="1234567890" />
                            </div>
                        </div>

                        {/* Donor Fields */}
                        {role === 'DONOR' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-slate-200">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Date of Birth *</label>
                                    <input type="date" name="date_of_birth" required
                                        value={formData.date_of_birth} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Gender *</label>
                                    <select name="gender" required value={formData.gender}
                                        onChange={handleChange} className={inputClass}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Blood Group *</label>
                                    <select name="blood_group" required value={formData.blood_group}
                                        onChange={handleChange} className={inputClass}>
                                        {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Weight (kg) *</label>
                                    <input type="number" name="weight" required min="0" step="0.1"
                                        value={formData.weight} onChange={handleChange}
                                        className={inputClass} placeholder="70" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Address</label>
                                    <input type="text" name="address" value={formData.address}
                                        onChange={handleChange} className={inputClass} placeholder="123 Main St" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">City</label>
                                    <input type="text" name="city" value={formData.city}
                                        onChange={handleChange} className={inputClass} placeholder="New York" />
                                </div>
                            </div>
                        )}

                        {/* Hospital Fields */}
                        {role === 'HOSPITAL' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-slate-200">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Hospital Name *</label>
                                    <input type="text" name="hospital_name" required
                                        value={formData.hospital_name} onChange={handleChange}
                                        className={inputClass} placeholder="City Hospital" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">License Number *</label>
                                    <input type="text" name="license_number" required
                                        value={formData.license_number} onChange={handleChange}
                                        className={inputClass} placeholder="LIC-12345" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Contact Number *</label>
                                    <input type="text" name="contact_number" required
                                        value={formData.contact_number} onChange={handleChange}
                                        className={inputClass} placeholder="9876543210" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">Address</label>
                                    <input type="text" name="address" value={formData.address}
                                        onChange={handleChange} className={inputClass} placeholder="123 Hospital Rd" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">City</label>
                                    <input type="text" name="city" value={formData.city}
                                        onChange={handleChange} className={inputClass} placeholder="New York" />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center py-2.5 sm:py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold text-white bg-rose-700 hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>

                        <div className="text-center text-sm text-slate-600">
                            Already registered?{' '}
                            <Link to="/login" className="font-semibold text-rose-700 hover:text-rose-800">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;