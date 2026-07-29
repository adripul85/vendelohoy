import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    link?: boolean;
}

export default function Logo({ className = '', size = 'md', link = true }: LogoProps) {
    const sizeClasses = {
        sm: { bolt: 'text-2xl sm:text-3xl', text: 'text-lg sm:text-xl', space: 'ml-1 sm:ml-1.5' },
        md: { bolt: 'text-3xl sm:text-4xl', text: 'text-xl sm:text-2xl', space: 'ml-1 sm:ml-1.5' },
        lg: { bolt: 'text-4xl sm:text-5xl', text: 'text-2xl sm:text-3xl', space: 'ml-1.5 sm:ml-2' },
        xl: { bolt: 'text-5xl sm:text-6xl', text: 'text-3xl sm:text-4xl', space: 'ml-2 sm:ml-2.5' }
    }[size];

    const content = (
        <span className={`inline-flex items-center gap-1 sm:gap-1.5 group select-none ${className}`}>
            <span className={`material-symbols-outlined text-lime-500 font-black group-hover:rotate-12 transition-transform drop-shadow-sm ${sizeClasses.bolt}`}>
                bolt
            </span>
            <span className={`font-black tracking-tighter uppercase font-display flex items-center ${sizeClasses.text}`}>
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 bg-clip-text text-transparent">VENDELO</span>
                <span className={`bg-gradient-to-r from-lime-500 to-green-500 bg-clip-text text-transparent ${sizeClasses.space}`}>HOY!</span>
            </span>
        </span>
    );

    if (!link) {
        return content;
    }

    return (
        <Link to="/" className="inline-flex items-center">
            {content}
        </Link>
    );
}
