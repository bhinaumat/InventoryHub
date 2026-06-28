"use client";

import React from 'react';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ fullScreen = true }: { fullScreen?: boolean }) {
    return (
        <div className={`flex items-center justify-center pointer-events-none z-50 ${fullScreen ? 'min-h-screen bg-[#0f172a]' : 'h-full pt-32'}`}>
            <div className="relative flex items-center justify-center">
                {/* Splashing/Pulsing Waves */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-20 h-20 rounded-full border-2 border-indigo-500/50"
                        initial={{ opacity: 0.8, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 2.5 }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            delay: i * 0.6,
                            ease: "easeOut"
                        }}
                    />
                ))}
                
                {/* Logo Inner Splash */}
                <motion.div
                    className="absolute w-20 h-20 rounded-2xl bg-purple-500/30 blur-md"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                
                {/* Logo Container */}
                <motion.div 
                    className="relative z-10 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] border border-white/20"
                    animate={{ 
                        scale: [1, 1.05, 1],
                        y: [0, -5, 0]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "easeInOut" 
                    }}
                >
                    <Package className="text-white" size={36} strokeWidth={2.5} />
                </motion.div>
            </div>
        </div>
    );
}
