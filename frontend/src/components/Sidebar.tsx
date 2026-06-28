"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Settings2, History, Building2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Suppliers', href: '/suppliers', icon: Users },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Imports', href: '/operations/imports', icon: ArrowDownToLine },
        { name: 'Exports', href: '/operations/exports', icon: ArrowUpFromLine },
        { name: 'Transfers', href: '/operations/transfers', icon: ArrowRightLeft },
        { name: 'Adjustments', href: '/operations/adjustments', icon: Settings2 },
        { name: 'Move History', href: '/operations/history', icon: History },
        { name: 'Ports & Hubs', href: '/settings/warehouses', icon: Building2 },
    ];

    return (
        <aside className="w-72 glass-card my-4 ml-4 flex flex-col h-[calc(100vh-2rem)] shadow-2xl overflow-y-auto shrink-0 z-20">
            <div className="p-8 border-b border-white/5 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl shadow-inner border border-indigo-500/30">
                    <Package className="text-indigo-400" size={28} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gradient">
                    NexIMS
                </h1>
            </div>
            <nav className="flex-1 p-5 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Link key={link.name} href={link.href} className="block w-full">
                            <motion.div
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                        : 'hover:bg-white/5 text-slate-400 hover:text-slate-100 border border-transparent'
                                }`}
                            >
                                <Icon size={22} className={`${isActive ? 'text-indigo-400' : 'opacity-70'} transition-colors`} />
                                <span className="font-semibold tracking-wide text-sm">{link.name}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-6 border-t border-white/5 text-xs text-slate-500 text-center font-medium tracking-wider">
                IMS v2.0 &copy; {new Date().getFullYear()}
            </div>
        </aside>
    );
}
