import React from 'react';

export default function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Image skeleton */}
            <div className="aspect-[5/4] bone-skeleton" />

            {/* Content skeleton */}
            <div className="p-5 space-y-3">
                {/* Category badge */}
                <div className="h-3.5 w-20 bone-skeleton rounded-md" />

                {/* Title */}
                <div className="h-4.5 bone-skeleton rounded-lg w-3/4" />

                {/* Price and trust */}
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="h-6 w-24 bone-skeleton rounded-lg" />
                    <div className="h-5 w-16 bone-skeleton rounded-md" />
                </div>
            </div>
        </div>
    );
}
