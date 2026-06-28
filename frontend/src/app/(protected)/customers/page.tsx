"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/swrFetcher';
import api from '@/utils/api';
import { Users, Building, Mail, Phone, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/LoadingScreen';

export default function CustomersPage() {
    const { data: clientsData, isLoading: loading, mutate: mutateClients } = useSWR<any[]>('/clients', fetcher);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'Active'
    });

    const clients = (clientsData || []).filter((c: any) => c.type === 'Customer');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/clients', {
                ...formData,
                type: 'Customer'
            });
            setIsModalOpen(false);
            setFormData({
                name: '',
                company: '',
                email: '',
                phone: '',
                status: 'Active'
            });
            mutateClients();
        } catch (err) {
            console.error(err);
            alert('Failed to add customer');
        }
    };

    const handleDelete = async (clientId: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/clients/${clientId}`);
            mutateClients();
        } catch (err) {
            console.error(err);
            alert('Failed to delete customer');
        }
    };

    if (loading) {
        return <LoadingScreen fullScreen={false} />;
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Users size={32} className="text-indigo-400" /> 
                        Customers List
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Manage your integrated directory of customers and buyers.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)] font-semibold tracking-wide"
                >
                    <Plus size={20} /> New Customer
                </motion.button>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                {clients.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-white/5">
                        <Building size={48} className="mx-auto text-slate-600 mb-4" />
                        <h4 className="text-xl font-medium text-slate-300">No Customers Found</h4>
                        <p className="text-slate-500 mt-2">Looks like your customer list is empty.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-400 text-sm tracking-widest uppercase bg-slate-800/30">
                                    <th className="p-5 font-semibold rounded-tl-xl">Name</th>
                                    <th className="p-5 font-semibold">Company</th>
                                    <th className="p-5 font-semibold">Contact Details</th>
                                    <th className="p-5 font-semibold">Status</th>
                                    <th className="p-5 font-semibold text-right rounded-tr-xl">Action</th>
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
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                                                client.status === 'Active' 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                            }`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => handleDelete(client.id)} 
                                                className="p-2 bg-slate-900/80 backdrop-blur text-slate-300 hover:text-rose-400 rounded-xl border border-white/10 hover:border-rose-500/50 transition-colors shadow-lg shadow-black/50"
                                                title="Delete Customer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative z-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Add New Customer</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                                    <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                                    <input type="text" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input type="email" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. john@acme.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input type="text" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. +91 9876543210" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active" className="bg-slate-800">Active</option>
                                        <option value="Inactive" className="bg-slate-800">Inactive</option>
                                    </select>
                                </div>
                                <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-white/5">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30">Save Customer</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
