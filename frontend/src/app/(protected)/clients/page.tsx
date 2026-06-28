"use client";

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Users, Building, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '../../../components/LoadingScreen';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await api.get('/clients');
                setClients(res.data);
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    if (loading) {
        return <LoadingScreen fullScreen={false} />;
    }

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Users size={32} className="text-indigo-400" /> 
                    Clients & Partners
                </h1>
                <p className="text-slate-400 mt-2 text-lg">Manage your global integrated network of suppliers and customers.</p>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                {clients.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-white/5">
                        <Building size={48} className="mx-auto text-slate-600 mb-4" />
                        <h4 className="text-xl font-medium text-slate-300">No Clients Found</h4>
                        <p className="text-slate-500 mt-2">Looks like your directory is empty. Add some clients to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-400 text-sm tracking-widest uppercase bg-slate-800/30">
                                    <th className="p-5 font-semibold rounded-tl-xl">Client Name</th>
                                    <th className="p-5 font-semibold">Company</th>
                                    <th className="p-5 font-semibold">Contact Details</th>
                                    <th className="p-5 font-semibold">Classification</th>
                                    <th className="p-5 font-semibold rounded-tr-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.id} className="border-b border-white/5 hover:bg-slate-800/40 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-200">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Building size={16} /> {client.company || '-'}
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400 space-y-1">
                                            {client.email && <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-indigo-400" /> {client.email}</div>}
                                            {client.phone && <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-emerald-400" /> {client.phone}</div>}
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                                                client.type === 'Supplier' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            }`}>
                                                {client.type}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                {client.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
