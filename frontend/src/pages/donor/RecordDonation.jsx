import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplet, HeartHandshake, Calendar, Hash, FileText,
    AlertCircle, CheckCircle2, Info, ArrowLeft,
} from 'lucide-react';
import { donorService } from '../../services/donorService';
import { donationService } from '../../services/donationService';

const RecordDonation = () => {
    const navigate = useNavigate();
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        units_collected: 1,
        donation_date: today,
        notes: '',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await donorService.getMyProfile();
                setDonor(res.data.donor);
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to load donor profile' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await donationService.create({
                blood_group: donor.blood_group,
                units_collected: parseFloat(formData.units_collected),
                donation_date: formData.donation_date,
                notes: formData.notes,
            });
            setMessage({ type: 'success', text: 'Donation recorded successfully!' });
            setTimeout(() => navigate('/donor/donations'), 1200);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message
                    || err.response?.data?.errors?.[0]?.msg
                    || 'Failed to record donation',
            });
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'mt-1 block w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-rose-700 transition-shadow';

    const isEligible = donor?.eligibility_status === 'ELIGIBLE';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 mt-4 text-sm sm:text-base font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/donor')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                        <HeartHandshake className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Record a Donation</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                            Submit a donation you've made
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-t-4 border-rose-700">
                    {/* Donor summary */}
                    {donor && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-700 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 shadow-md">
                                {donor.blood_group}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{donor.name}</h2>
                                <p className="text-sm text-slate-600 truncate">{donor.email}</p>
                                <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                    isEligible
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {isEligible
                                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                                        : <AlertCircle className="w-3.5 h-3.5" />}
                                    {donor.eligibility_status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Alert */}
                    {message.text && (
                        <div className={`flex items-start gap-2 mt-6 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm border ${
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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Droplet className="w-4 h-4 text-rose-700" fill="currentColor" />
                                    Blood Group
                                </label>
                                <input
                                    type="text"
                                    value={donor?.blood_group || ''}
                                    disabled
                                    className={`${inputClass} bg-slate-100 text-slate-600 font-bold`}
                                />
                                <p className="text-xs text-slate-500 mt-1">Locked to your profile.</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Hash className="w-4 h-4 text-rose-700" />
                                    Units Collected *
                                </label>
                                <input
                                    type="number"
                                    name="units_collected"
                                    min="0.5"
                                    step="0.5"
                                    required
                                    value={formData.units_collected}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <Calendar className="w-4 h-4 text-rose-700" />
                                    Donation Date *
                                </label>
                                <input
                                    type="date"
                                    name="donation_date"
                                    max={today}
                                    required
                                    value={formData.donation_date}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                    <FileText className="w-4 h-4 text-rose-700" />
                                    Notes (optional)
                                </label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Any additional info about this donation"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs sm:text-sm text-rose-800">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Expiry date will be calculated automatically (42 days after donation).</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base shadow-sm"
                            >
                                {saving ? 'Recording...' : 'Record Donation'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/donor/donations')}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecordDonation;