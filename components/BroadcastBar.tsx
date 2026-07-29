import React, { useEffect, useState } from 'react';
import { getGlobalBroadcast, Broadcast } from '../lib/marketing';
import { Link } from 'react-router-dom';

export const BroadcastBar = () => {
    const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        getGlobalBroadcast().then(data => {
            if (data && data.active) {
                setBroadcast(data);
            }
        });
    }, []);

    if (!broadcast || hidden) return null;

    const styles = {
        info: 'bg-dark-800 text-white',
        promo: 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/10',
        warning: 'bg-rose-600 text-white shadow-xl shadow-rose-500/10'
    };

    return (
        <div className={`w-full relative z-[110] py-4 px-6 md:px-12 flex items-center justify-between animate-in slide-in-from-top duration-700 ${styles[broadcast.type]}`}>
            <div className="flex-1 flex items-center justify-center gap-4 text-center">
                <span className="material-symbols-outlined text-sm font-black hidden sm:block">
                    {broadcast.type === 'warning' ? 'warning' : 'campaign'}
                </span>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-tight">
                    {broadcast.message}
                </p>
                {broadcast.btnText && (
                    <Link 
                        to={broadcast.btnLink || '/'} 
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md transition-all ml-2"
                    >
                        {broadcast.btnText}
                    </Link>
                )}
            </div>
            <button 
                onClick={() => setHidden(true)}
                className="size-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    );
};
