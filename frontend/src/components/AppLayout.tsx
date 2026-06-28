"use client";

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <LoadingScreen fullScreen={true} />;
    }

    return (
        <div className="flex h-screen overflow-hidden font-sans text-slate-200 selection:bg-indigo-500/30 print:h-auto print:overflow-visible print:bg-white print:text-black">
            <div className="print:hidden h-full shrink-0 flex">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible">
                <div className="print:hidden">
                    <TopNav />
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 pt-4 relative z-0 print:p-0 print:overflow-visible">
                    <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mx-auto max-w-7xl h-full pb-20 pt-4"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
