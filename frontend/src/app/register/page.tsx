"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Package, Mail, Lock, User, Shield, ArrowRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Staff');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', { name, email, password, role, phone: phone || undefined });
            login(res.data.token, res.data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden selection:bg-indigo-500/30">
            {/* Left side Branding */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between relative p-12 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[30%] -left-[10%] w-[40rem] h-[40rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
                    <div className="absolute -bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 backdrop-blur-md mb-4">
                        <Package size={32} className="text-indigo-400" />
                    </div>
                </div>

                <div className="relative z-10 text-white max-w-lg space-y-6 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-5xl font-black tracking-tight mb-4">
                            Start Building Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Empire</span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed font-light">
                            Join thousands of organizations that orchestrate their global supply chain natively through NexIMS.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right side Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative z-10 bg-slate-900/50 backdrop-blur-2xl border-l border-white/5 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-md my-auto"
                >
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white tracking-wide mb-2">Create Account</h2>
                        <p className="text-slate-400">Join the NexIMS platform today.</p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm text-center mb-8 shadow-sm">
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 px-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 px-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 px-1">Phone Number <span className="text-slate-500 text-xs">(for SMS OTP)</span></label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Phone size={20} />
                                </div>
                                <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                                    +91
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-[5.5rem] pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 px-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 px-1">Account Role</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Shield size={20} />
                                </div>
                                <select
                                    className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="Staff" className="bg-slate-800">Warehouse Staff</option>
                                    <option value="Manager" className="bg-slate-800">Inventory Manager</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.3)] flex justify-center items-center group"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80"></div>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </motion.button>
                        </div>
                    </form>

                    <div className="mt-8 text-center pb-8">
                        <p className="text-slate-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
