"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopNav() {
    const { user, logout } = useAuth();
    const [bgEnabled, setBgEnabled] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('3d_background_enabled');
        if (stored !== null) {
            setBgEnabled(stored === 'true');
        }
    }, []);

    const toggleBg = () => {
        const newValue = !bgEnabled;
        setBgEnabled(newValue);
        localStorage.setItem('3d_background_enabled', String(newValue));
        window.dispatchEvent(new CustomEvent('toggle_3d_background', { detail: { enabled: newValue } }));
    };

    return (
        <header className="h-20 glass mt-4 mx-6 rounded-2xl flex items-center justify-between px-8 shadow-2xl z-10 sticky top-4">
            <div className="flex items-center gap-4">
                <div className="text-slate-300 text-lg font-medium tracking-wide">
                    Welcome back, <span className="text-white font-bold">{user?.name?.split(' ')[0] || 'User'}</span> 👋
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-indigo-300">
                            <UserCircle size={24} />
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-slate-100">{user?.name || 'Loading...'}</p>
                        <p className="text-xs text-indigo-300 font-medium tracking-wider uppercase">{user?.role || '---'}</p>
                    </div>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleBg}
                    className={`transition-all p-3 rounded-xl border border-transparent shadow-sm ${
                        bgEnabled 
                            ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/20' 
                            : 'text-slate-500 hover:text-slate-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                    title={bgEnabled ? "Disable 3D Background" : "Enable 3D Background"}
                >
                    <Sparkles size={22} />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="text-slate-400 hover:text-rose-400 transition-all p-3 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 shadow-sm"
                    title="Logout"
                >
                    <LogOut size={22} />
                </motion.button>
            </div>
        </header>
    );
}
