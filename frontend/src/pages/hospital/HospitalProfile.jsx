import React, { useEffect, useState } from 'react';
import {
    Building2, Mail, Phone, MapPin, FileBadge, UserCircle2,
    AlertCircle, CheckCircle2, Pencil, Droplet, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { useNavigate } from 'react-router-dom';

const HospitalProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await hospitalService.getMyProfile();
            setProfile(res.data.hospital);
            setFormData(res.data.hospital);
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
                hospital_name: formData.hospital_name,
                address: formData.address,
                city: formData.city,
                contact_number: formData.contact_number,
            };
            const res = await hospitalService.updateMyProfile(payload);
            setProfile(res.data.hospital);
            setFormData(res.data.hospital);
            setEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message
                    || err.response?.data?.errors?.[0]?.msg
                    || 'Update failed',
            });
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 disabled:bg-slate-100 disabled:text-slate-500 transition-shadow';

    const statusBadge = (s) => {
        switch (s) {
            case 'ACTIVE': return { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle2 };
            case 'INACTIVE': return { cls: 'bg-red-50 text-red-700 border border-red-200', icon: AlertCircle };
            case 'PENDING': return { cls: 'bg-amber-50 text-amber-800 border border-amber-200', icon: AlertCircle };
            default: return { cls: 'bg-slate-100 text-slate-700 border border-slate-200', icon: AlertCircle };
        }
    };

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

    const sb = statusBadge(profile.status);
    const StatusIcon = sb.icon;

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/hospital')}
                                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                                <ArrowLeft className="w-4 h-4" /> Back to dashboard
                            </button>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hospital Profile</h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                                Manage your hospital information
                            </p>
                        </div>
                    </div>
                    {!editing && (
                        <button
                            onClick={() => { setEditing(true); setMessage({ type: '', text: '' }); }}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 text-sm sm:text-base font-semibold transition-colors shadow-sm"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Alert */}
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

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-t-4 border-rose-700">
                    {/* Summary banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-md">
                            <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                                {profile.hospital_name}
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 truncate flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3.5 h-3.5" />
                                {profile.email}
                            </p>
                            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${sb.cls}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {profile.status}
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSave} className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <UserCircle2 className="w-4 h-4 text-rose-700" />
                                    Contact Person Name
                                </label>
                                <input type="text" name="name" value={formData.name || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Mail className="w-4 h-4 text-rose-700" />
                                    Email
                                </label>
                                <input type="email" value={formData.email || ''} disabled className={inputClass} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Building2 className="w-4 h-4 text-rose-700" />
                                    Hospital Name
                                </label>
                                <input type="text" name="hospital_name" value={formData.hospital_name || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <FileBadge className="w-4 h-4 text-rose-700" />
                                    License Number
                                </label>
                                <input type="text" value={formData.license_number || ''} disabled className={inputClass} />
                                <p className="text-xs text-slate-500 mt-1">Contact admin to change license number.</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Phone className="w-4 h-4 text-rose-700" />
                                    Contact Number
                                </label>
                                <input type="text" name="contact_number" value={formData.contact_number || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Phone className="w-4 h-4 text-rose-700" />
                                    Account Phone
                                </label>
                                <input type="text" name="phone" value={formData.phone || ''}
                                    onChange={handleChange} disabled={!editing} required className={inputClass} />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <MapPin className="w-4 h-4 text-rose-700" />
                                    City
                                </label>
                                <input type="text" name="city" value={formData.city || ''}
                                    onChange={handleChange} disabled={!editing} className={inputClass} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <MapPin className="w-4 h-4 text-rose-700" />
                                    Address
                                </label>
                                <input type="text" name="address" value={formData.address || ''}
                                    onChange={handleChange} disabled={!editing} className={inputClass} />
                            </div>
                        </div>

                        {editing && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base shadow-sm">
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

export default HospitalProfile;