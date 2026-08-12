import React from 'react';
import { UserProfile } from '../../lib/users';

interface Props {
    seller: UserProfile;
    showName?: boolean;
    compact?: boolean;
}

export default function SellerBadge({ seller, showName = true, compact = false }: Props) {
    const isVerified = seller.trustLevel === 'Alto' || seller.trustLevel === 'Premium' || seller.verificationEvidence?.status === 'approved';
    const rating = seller.reputation?.averageRating || 0;
    const salesCount = seller.successfulSales || 0;

    if (compact) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md border ${seller.trustLevel === 'Bajo' ? 'bg-white/90 border-slate-100 text-slate-400' : 'bg-primary-vibrant/90 border-primary-400 text-white'} shadow-sm`}>
                <span className="material-symbols-outlined text-[10px] font-black">
                    {seller.trustLevel === 'Bajo' ? 'shield' : 'verified'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter">
                    {seller.trustLevel || 'Bajo'}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-surface-container/50 px-3 py-2 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
            <div className="relative">
                <div className="size-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                    <img
                        src={seller.avatar || `https://ui-avatars.com/api/?name=${seller.displayName}&background=random`}
                        alt={seller.displayName}
                        className="size-full object-cover"
                    />
                </div>
                {isVerified && (
                    <div className="absolute -right-1 -bottom-1 size-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[8px] text-white font-black">check</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                {showName && (
                    <p className="text-[10px] font-black text-slate-900 leading-none mb-1 flex items-center gap-1">
                        {seller.displayName}
                        {isVerified && <span className="text-[8px] text-blue-500 font-bold uppercase tracking-tighter">Verificado</span>}
                    </p>
                )}
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                        <span className="material-symbols-outlined text-[10px] font-fill">star</span>
                        <span className="text-[9px] font-black text-slate-700 ml-0.5">{rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        {salesCount} Ventas
                    </span>
                </div>
            </div>
        </div>
    );
}
