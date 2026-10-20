import React, { useEffect, useState } from 'react';
import { Package, Droplet, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { useNavigate } from 'react-router-dom';

const BloodAvailability = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const res = await inventoryService.getAll();
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const stockBadge = (level) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-50 text-red-700 border border-red-200';
            case 'LOW': return 'bg-amber-50 text-amber-800 border border-amber-200';
            default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        }
    };

    const stockLabel = (level) => {
        switch (level) {
            case 'CRITICAL': return 'Critical';
            case 'LOW': return 'Low';
            default: return 'Available';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <Droplet className="w-14 h-14 text-rose-700 animate-pulse mx-auto" fill="currentColor" />
                    <p className="text-rose-700 mt-4 text-sm sm:text-base font-semibold">Loading availability...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate('/donor')}
                                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-700 mb-4">
                                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                                </button>
                <div className="mb-6 flex items-center gap-3">
                    
                    <div className="w-12 h-12 rounded-xl bg-rose-700 flex items-center justify-center shadow-sm">
                        
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Blood Availability</h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                            Live stock of blood groups across the network
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {data.inventory.map(item => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md hover:border-rose-300 transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-700 text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-sm">
                                        {item.blood_group}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${stockBadge(item.stock_level)}`}>
                                        {item.stock_level === 'NORMAL' && <CheckCircle2 className="w-3 h-3" />}
                                        {item.stock_level !== 'NORMAL' && <AlertCircle className="w-3 h-3" />}
                                        {stockLabel(item.stock_level)}
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Available</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                                        {item.units_available}
                                        <span className="text-xs sm:text-sm font-normal text-slate-500 ml-1">units</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BloodAvailability;