"use client";

import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', address: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/warehouses', formData);
            setIsModalOpen(false);
            setFormData({ name: '', address: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to create warehouse');
        }
    };

    const handleDelete = async (warehouseId: string) => {
        if (!confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            await api.delete(`/warehouses/${warehouseId}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete warehouse');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Warehouses</h1>
                    <p className="text-slate-400 mt-2">Manage your physical storage locations</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.4)] font-semibold tracking-wide"
                >
                    <Plus size={20} /> Add Warehouse
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    </div>
                ) : warehouses.length === 0 ? (
                    <div className="col-span-full border border-dashed border-white/20 rounded-3xl p-12 text-center text-slate-500">
                        <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No warehouses configured yet.</p>
                    </div>
                ) : (
                    warehouses.map(w => (
                        <motion.div 
                            key={w._id || w.id} 
                            whileHover={{ y: -5 }}
                            className="glass-card p-6 relative group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                            
                            <div className="flex items-start justify-between relative z-10 mb-6">
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                    <Building2 size={28} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-indigo-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(w.id)} className="text-rose-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-2">{w.name}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{w.address || 'No address provided'}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

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
                            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Create Warehouse</h2>
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Warehouse Name</label>
                                    <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Main Distribution Center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                                    <textarea className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Warehouse Rd..."></textarea>
                                </div>
                                <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-white/5">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30">Save Warehouse</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
