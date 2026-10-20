import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Droplet, Calendar, Weight, UserRound, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { donorService } from '../../services/donorService';

const DonorEligibility = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const profileRes = await donorService.getMyProfile();
                const donorId = profileRes.data.donor.id;
                const eligRes = await donorService.getEligibility(donorId);
                setData(eligRes.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load eligibility');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 text-base sm:text-lg mt-4 font-semibold">Checking eligibility...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-rose-700 text-base sm:text-lg text-center">{error}</p>
            </div>
        );
    }

    const isEligible = data.eligible;

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <button onClick={() => navigate('/donor')}
                                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Eligibility Status</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">
                        Based on age, weight, and last donation date
                    </p>
                </div>

                <div className={`rounded-2xl shadow-xl p-6 sm:p-8 bg-white border-t-4 ${
                    isEligible ? 'border-emerald-600' : 'border-red-600'
                }`}>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 ${
                            isEligible ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                            {isEligible
                                ? <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-600" />
                                : <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 text-red-600" />}
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className={`text-xl sm:text-3xl font-bold ${
                                isEligible ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                                {isEligible ? 'You are ELIGIBLE' : 'You are NOT ELIGIBLE'}
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">
                                {isEligible
                                    ? 'You can proceed to donate blood.'
                                    : 'Please review the reasons below.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500">
                                <UserRound className="w-4 h-4" />
                                <p className="text-xs sm:text-sm font-medium">Age</p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{data.age} yrs</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Weight className="w-4 h-4" />
                                <p className="text-xs sm:text-sm font-medium">Weight</p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{data.weight} kg</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Calendar className="w-4 h-4" />
                                <p className="text-xs sm:text-sm font-medium">Last Donation</p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                                {data.last_donation_date
                                    ? new Date(data.last_donation_date).toLocaleDateString()
                                    : 'None'}
                            </p>
                        </div>
                    </div>

                    {!isEligible && data.reasons?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-2">
                                Reasons:
                            </h3>
                            <ul className="space-y-2">
                                {data.reasons.map((r, i) => (
                                    <li key={i}
                                        className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                                        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!isEligible && data.next_eligible_date && (
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 text-amber-700 shrink-0" />
                            <p className="text-sm text-amber-800">
                                <span className="font-semibold">Next eligible date:</span>{' '}
                                {new Date(data.next_eligible_date).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex items-start gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>These are project rules, not medical advice. Actual eligibility should follow the relevant blood service's policy.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorEligibility;