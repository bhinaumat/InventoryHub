"use client";

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '../../../utils/swrFetcher';
import api from '../../../utils/api';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Users, Building, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Link from 'next/link';
import LoadingScreen from '../../../components/LoadingScreen';

interface DashboardStats {
    totalProducts: number;
    lowStockCount: number;
    pendingImports: number;
    pendingExports: number;
    pendingTransfers: number;
}

const mockActivityData = [
    { name: 'Mon', imports: 12, exports: 15 },
    { name: 'Tue', imports: 19, exports: 10 },
    { name: 'Wed', imports: 15, exports: 22 },
    { name: 'Thu', imports: 25, exports: 18 },
    { name: 'Fri', imports: 30, exports: 24 },
    { name: 'Sat', imports: 10, exports: 5 },
    { name: 'Sun', imports: 5, exports: 2 },
];

export default function DashboardPage() {
    const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>('/dashboard', fetcher);
    const { data: allClients, isLoading: clientsLoading } = useSWR<any[]>('/clients', fetcher);

    const loading = statsLoading || clientsLoading;
    const clients = Array.isArray(allClients) ? allClients.slice(0, 5) : [];

    if (loading) {
        return <LoadingScreen fullScreen={false} />;
    }

    const kpis = [
        { title: 'Total Commodities', value: stats?.totalProducts || 0, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/20', href: '/products' },
        { title: 'Low Stock Alerts', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20', href: '/products?filter=low-stock' },
        { title: 'Pending Imports', value: stats?.pendingImports || 0, icon: ArrowDownToLine, color: 'text-emerald-400', bg: 'bg-emerald-500/20', href: '/operations/imports' },
        { title: 'Pending Exports', value: stats?.pendingExports || 0, icon: ArrowUpFromLine, color: 'text-orange-400', bg: 'bg-orange-500/20', href: '/operations/exports' },
        { title: 'Port Transfers', value: stats?.pendingTransfers || 0, icon: ArrowRightLeft, color: 'text-purple-400', bg: 'bg-purple-500/20', href: '/operations/transfers' },
    ];

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="mb-2">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Global Dashboard</h1>
                <p className="text-slate-400 mt-2 text-lg">Real-time international trade metrics and port telemetry.</p>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
            >
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <Link href={kpi.href} key={idx} className="block outline-none">
                            <motion.div 
                                variants={itemVariants}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="glass-card p-6 relative overflow-hidden group cursor-pointer h-full transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-white/10 hover:border-indigo-500/50"
                            >
                                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${kpi.bg} group-hover:opacity-60 transition-opacity duration-500`}></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-white transition-colors">
                                            {kpi.title} <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 ml-1">→</span>
                                        </p>
                                        <h3 className="text-4xl font-black text-white">{kpi.value}</h3>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} shadow-lg backdrop-blur-md border border-white/5`}>
                                        <Icon size={28} strokeWidth={2.5} />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    )
                })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="glass-card p-8 flex flex-col h-[400px]"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Weekly Trade Flow</h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="imports" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorImports)" />
                                <Area type="monotone" dataKey="exports" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorExports)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="glass-card p-8 flex flex-col h-[400px]"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Trade Volume by Type</h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="imports" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="exports" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="glass-card p-8 mt-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users size={22} className="text-indigo-400" />
                        Recent Partners & Clients
                    </h3>
                    <div className="text-sm font-medium text-slate-400">
                        {clients.length > 0 ? `${clients.length} connected` : ''}
                    </div>
                </div>
                
                {clients.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-white/5">
                        <Building size={48} className="mx-auto text-slate-600 mb-4" />
                        <h4 className="text-lg font-medium text-slate-300">No Clients Found</h4>
                        <p className="text-slate-500 mt-2">Initialize your database or add clients to see them connected here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-400 text-sm tracking-wider uppercase bg-slate-800/20">
                                    <th className="p-4 font-medium rounded-tl-xl">Client Name</th>
                                    <th className="p-4 font-medium">Company</th>
                                    <th className="p-4 font-medium">Contact</th>
                                    <th className="p-4 font-medium rounded-tr-xl">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.id} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Building size={16} /> {client.company || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 space-y-1">
                                            {client.email && <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-indigo-400" /> {client.email}</div>}
                                            {client.phone && <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-emerald-400" /> {client.phone}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                client.type === 'Supplier' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {client.type}
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
