"use client";

import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { History as HistoryIcon, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MoveHistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/stock');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(h =>
        h.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.operationType?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Move History</h1>
                    <p className="text-slate-400 mt-2">Stock Ledger of all validated inventory movements</p>
                </div>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner">
                    <HistoryIcon size={28} />
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by product or operation type..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-slate-800/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-slate-500 transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-widest border-b border-white/10">
                                <th className="p-5 font-semibold">Timestamp</th>
                                <th className="p-5 font-semibold">Product Evaluated</th>
                                <th className="p-5 font-semibold">Quantity Delta</th>
                                <th className="p-5 font-semibold">Operation Type</th>
                                <th className="p-5 font-semibold">Source</th>
                                <th className="p-5 font-semibold">Destination</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-slate-500">
                                        <HistoryIcon size={48} className="opacity-20 mb-4 mx-auto" />
                                        <p>No validated stock movements found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map(h => (
                                    <tr key={h._id || h.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5 text-sm font-medium text-slate-400">
                                            {new Date(h.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-5 text-sm font-bold text-white">
                                            <span className="truncate max-w-[150px]">{h.product?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="p-5 text-sm font-black">
                                            <span className={`px-3 py-1 bg-slate-900 rounded-lg border ${h.quantity > 0 ? "text-emerald-400 border-emerald-500/20" : "text-rose-400 border-rose-500/20"}`}>
                                                {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                {h.operationType}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm text-slate-400">{h.sourceLocation?.name || '---'}</td>
                                        <td className="p-5 text-sm text-slate-400">{h.destLocation?.name || '---'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
