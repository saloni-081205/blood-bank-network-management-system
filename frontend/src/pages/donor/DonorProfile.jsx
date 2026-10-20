import React, { useEffect, useState } from 'react';
import { UserCircle2, Mail, Phone, MapPin, Droplet, Calendar, Weight, AlertCircle, CheckCircle2, Pencil,ArrowLeft } from 'lucide-react';
import { donorService } from '../../services/donorService';
import { useNavigate } from 'react-router-dom';


const DonorProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await donorService.getMyProfile();
            setProfile(res.data.donor);
            setFormData(res.data.donor);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                date_of_birth: formData.date_of_birth?.split('T')[0],
                gender: formData.gender,
                blood_group: formData.blood_group,
                weight: parseFloat(formData.weight),
                address: formData.address,
                city: formData.city,
            };
            const res = await donorService.updateMyProfile(payload);
            setProfile(res.data.donor);
            setFormData(res.data.donor);
            setEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Update failed',
            });
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 disabled:bg-slate-100 disabled:text-slate-500 transition-shadow';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-rose-700 text-base sm:text-lg">Profile not found.</p>
            </div>
        );
    }

    const isEligible = profile.eligibility_status === 'ELIGIBLE';

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <button onClick={() => navigate('/donor')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Profile</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1">
                            View and manage your donor information
                        </p>
                    </div>
                    {!editing && (
                        <button
                            onClick={() => { setEditing(true); setMessage({ type: '', text: '' }); }}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 text-sm sm:text-base font-medium transition-colors shadow-sm"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Profile
                        </button>
                    )}
                </div>

                {message.text && (
                    <div className={`flex items-start gap-2 mb-4 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm border ${
                        message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {message.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-t-4 border-rose-700">
                    {/* Summary banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-700 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 shadow-md">
                            {profile.blood_group}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                                {profile.name}
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 truncate flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3.5 h-3.5" />
                                {profile.email}
                            </p>
                            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                isEligible
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {isEligible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {profile.eligibility_status}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input type="text" name="name" value={formData.name || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input type="email" value={formData.email || ''} disabled className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input type="text" name="phone" value={formData.phone || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                                <input type="date" name="date_of_birth"
                                    value={formData.date_of_birth?.split('T')[0] || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Gender</label>
                                <select name="gender" value={formData.gender || 'MALE'}
                                    onChange={handleChange} disabled={!editing} className={inputClass}>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Blood Group</label>
                                <select name="blood_group" value={formData.blood_group || 'A+'}
                                    onChange={handleChange} disabled={!editing} className={inputClass}>
                                    {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
                                <input type="number" name="weight" min="0" step="0.1"
                                    value={formData.weight || ''} onChange={handleChange}
                                    disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">City</label>
                                <input type="text" name="city" value={formData.city || ''}
                                    onChange={handleChange} disabled={!editing} className={inputClass} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Address</label>
                                <input type="text" name="address" value={formData.address || ''}
                                    onChange={handleChange} disabled={!editing} className={inputClass} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Last Donation Date</label>
                                <input type="text"
                                    value={formData.last_donation_date
                                        ? new Date(formData.last_donation_date).toLocaleDateString()
                                        : 'No donations yet'}
                                    disabled className={inputClass} />
                                <p className="text-xs text-slate-500 mt-1">Managed automatically by donation records.</p>
                            </div>
                        </div>

                        {editing && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-medium transition-colors disabled:opacity-50 text-sm sm:text-base shadow-sm">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button"
                                    onClick={() => { setEditing(false); setFormData(profile); setMessage({ type: '', text: '' }); }}
                                    className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors text-sm sm:text-base">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DonorProfile;