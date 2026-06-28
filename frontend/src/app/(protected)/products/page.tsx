"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../../utils/swrFetcher';
import api from '../../../utils/api';
import { Plus, Search, Edit2, Trash2, Package, ShoppingCart, MessageCircle, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', sku: '', category: '', unitOfMeasure: 'Units', reorderLevel: 0, price: 0 });

    const { data: productsData, isLoading: prodLoading, mutate: mutateProducts } = useSWR<any[]>('/products', fetcher);
    const { data: categoriesData, isLoading: catLoading } = useSWR<any[]>('/categories', fetcher);

    const loading = prodLoading || catLoading;
    const products = productsData || [];
    const categories = categoriesData || [];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/products', formData);
            setIsModalOpen(false);
            setFormData({ name: '', sku: '', category: '', unitOfMeasure: 'Units', reorderLevel: 0, price: 0 });
            mutateProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to create product');
        }
    };

    const handleInquire = (product: any) => {
        setSelectedProduct(product);
        setIsBuyerModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setFormData({
            name: product.name,
            sku: product.sku,
            category: product.category?.id || product.categoryId || '',
            unitOfMeasure: product.unitOfMeasure || 'Units',
            reorderLevel: product.reorderLevel || 0,
            price: product.price || 0
        });
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${productId}`);
            mutateProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Animation Variants
    const containerVariants = {
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decorative Abstract Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 w-full md:w-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-4 border border-indigo-500/20">
                        <Package size={16} /> Global Catalog
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-tight">
                        Import & Export Goods
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg max-w-xl">
                        Browse our premium selection of raw materials, electronics, and agricultural commodities ready for global shipping.
                    </p>
                </div>

                <div className="relative z-10 flex w-full md:w-auto flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search commodities..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/10 bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 text-white placeholder:text-slate-500 transition-all shadow-inner backdrop-blur-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] font-bold tracking-wide border border-white/10"
                    >
                        <Plus size={20} /> List Product
                    </motion.button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-medium">Loading catalog...</p>
                    </div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-16 text-center backdrop-blur-sm">
                    <Package size={64} className="opacity-20 mb-6 mx-auto text-indigo-400" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Products Found</h3>
                    <p className="text-slate-400">Try adjusting your search terms or add a new commodity to the catalog.</p>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredProducts.map(product => (
                        <motion.div 
                            key={product._id || product.id}
                            variants={itemVariants}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 transition-all duration-300 flex flex-col"
                        >
                            {/* Admin Actions Overlay */}
                            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button onClick={() => handleEdit(product)} className="p-2 bg-slate-900/80 backdrop-blur text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-indigo-500/50 transition-colors shadow-lg shadow-black/50">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 bg-slate-900/80 backdrop-blur text-slate-300 hover:text-rose-400 rounded-xl border border-white/10 hover:border-rose-500/50 transition-colors shadow-lg shadow-black/50">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Product Visual Placeholder */}
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden p-6 flex flex-col justify-between border-b border-white/5">
                                {/* Abstract Background shape */}
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors"></div>
                                <div className="absolute top-5 left-5 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <span className="px-3 py-1 bg-slate-950/50 backdrop-blur-md rounded-lg text-xs font-bold text-slate-300 uppercase tracking-wider border border-white/5">
                                        {product.category?.name || 'Uncategorized'}
                                    </span>
                                    {product.reorderLevel > 0 && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-bold border border-amber-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                            Low Stock
                                        </span>
                                    )}
                                </div>

                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <p className="text-slate-400 text-xs font-mono mb-1">{product.sku}</p>
                                        <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                                            {product.name}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6 flex-grow flex flex-col justify-between bg-slate-900/40 relative z-10">
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-end pb-4 border-b border-white/5">
                                        <div>
                                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Pricing</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-emerald-400">${(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <span className="text-slate-500 text-sm font-medium">/ {product.unitOfMeasure}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Info size={16} className="text-indigo-400" />
                                        <span>Min Order Qty: {Math.max(1, product.reorderLevel)} {product.unitOfMeasure}</span>
                                    </div>
                                </div>

                                {/* Buyer Actions */}
                                <div className="flex gap-3 mt-auto pt-2">
                                    <button 
                                        onClick={() => handleInquire(product)}
                                        className="flex-1 bg-white/5 hover:bg-indigo-500 hover:text-white text-indigo-300 border border-white/10 hover:border-indigo-500 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" /> 
                                        Inquire Quote
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Standard Admin Create Modal (Kept for functionality but restyled) */}
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
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Listing</h2>
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Commodity Name</label>
                                    <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Premium Silk Threads" />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">SKU Code</label>
                                        <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="IMP-1001" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                        <select required className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="" className="bg-slate-800">Select Category</option>
                                            {categories.map(c => (
                                                <option key={c._id || c.id} value={c._id || c.id} className="bg-slate-800">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Unit of Measure</label>
                                        <input type="text" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={formData.unitOfMeasure} onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })} placeholder="e.g. Tons, Pallets" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Market Price ($)</label>
                                        <input type="number" step="0.01" min="0" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Min Order Quantity (Reorder Lvl)</label>
                                    <input type="number" min="0" required className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })} />
                                </div>
                                <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-white/5">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/30">Save Listing</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Buyer Interaction Modal */}
            <AnimatePresence>
                {isBuyerModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsBuyerModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl w-full max-w-lg p-1 shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-50"></div>
                            
                            <div className="bg-slate-900 rounded-[22px] p-8 relative z-10 h-full w-full">
                                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                                    <div>
                                        <p className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-1">Request Quote</p>
                                        <h2 className="text-2xl font-bold text-white leading-tight">{selectedProduct.name}</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-bold text-xl">${(selectedProduct.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        <p className="text-slate-500 text-xs">per {selectedProduct.unitOfMeasure}</p>
                                    </div>
                                </div>
                                
                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Quote Request Sent! A representative will contact you shortly.'); setIsBuyerModalOpen(false); }}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Target Quantity</label>
                                            <input type="number" min={selectedProduct.reorderLevel || 1} defaultValue={selectedProduct.reorderLevel || 1} required className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Delivery Port</label>
                                            <input type="text" placeholder="e.g. Port of Los Angeles" required className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                                        <input type="text" placeholder="Your Business Corp." required className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Additional Specifications</label>
                                        <textarea rows={3} placeholder="Please provide any specific requirements..." className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none"></textarea>
                                    </div>
                                    
                                    <div className="mt-8 flex gap-4 pt-4 border-t border-white/5">
                                        <button type="button" onClick={() => setIsBuyerModalOpen(false)} className="flex-1 py-3.5 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors font-medium border border-white/5 hover:border-white/10">Back to Catalog</button>
                                        <button type="submit" className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                                            Send Secure Inquiry <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

