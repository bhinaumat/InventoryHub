"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../utils/api';
import { Package, Mail, ArrowLeft, ArrowRight, KeyRound, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const payload = method === 'email' ? { email } : { phone };
            const res = await api.post('/auth/forgot-password', payload);
            setMessage(res.data.message || 'OTP has been sent. Check your phone for the code.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden selection:bg-indigo-500/30">
            {/* Left side Branding */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[20%] left-[20%] w-[35rem] h-[35rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
                    <div className="absolute bottom-[20%] right-[20%] w-[35rem] h-[35rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                <div className="relative z-10 text-white max-w-lg space-y-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 backdrop-blur-md shadow-2xl mb-8">
                            <Package size={48} className="text-indigo-400" />
                        </div>
                        <h1 className="text-6xl font-black tracking-tight mb-4">
                            Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Recovery</span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed font-light">
                            Don&apos;t worry — it happens to the best of us. We&apos;ll send you a secure OTP via SMS to reset your password.
                        </p>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
                        className="glass-card p-6 mt-12 max-w-md"
                    >
                        <blockquote className="text-slate-300 italic text-lg border-l-4 border-indigo-500 pl-4 py-1">
                            &quot;Your data and access are always protected with our multi-layer security protocols.&quot;
                        </blockquote>
                    </motion.div>
                </div>
            </div>

            {/* Right side Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative z-10 bg-slate-900/50 backdrop-blur-2xl border-l border-white/5">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-md"
                >
                    <Link href="/login" className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors text-sm">
                        <ArrowLeft size={16} /> Back to login
                    </Link>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-4">
                            <KeyRound size={32} className="text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-wide mb-2">Reset Password</h2>
                        <p className="text-slate-400">Enter your email or phone number to receive an OTP via SMS.</p>
                    </div>

                    {message ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-4 rounded-xl text-sm shadow-sm">
                                📱 {message}
                            </div>
                            <Link 
                                href="/reset-password" 
                                className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all tracking-wide shadow-[0_0_20px_rgba(99,102,241,0.3)] text-center"
                            >
                                Proceed to enter OTP →
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm text-center mb-8 shadow-sm">
                                    {error}
                                </motion.div>
                            )}

                            {/* Method Toggle */}
                            <div className="flex bg-slate-800/80 rounded-xl p-1 mb-6 border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setMethod('email')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === 'email' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Mail size={16} /> Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMethod('phone')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === 'phone' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Phone size={16} /> Phone
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {method === 'email' ? (
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
                                                placeholder="admin@nexims.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300 px-1">Phone Number</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                                <Phone size={20} />
                                            </div>
                                            <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-slate-400 text-sm font-medium">
                                                +91
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                maxLength={10}
                                                className="w-full bg-slate-800/80 border border-white/5 text-white rounded-xl py-3.5 pl-[5.5rem] pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500 shadow-inner"
                                                placeholder="9876543210"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>
                                )}

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
                                                Send SMS OTP <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
