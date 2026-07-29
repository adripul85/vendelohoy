import React from 'react';
import { motion, Variants } from 'framer-motion';
import { AnimateIcon, AnimateIconProps } from './icon';

// --- 1. HEART ICON (Favorites / Likes) ---
export const HeartIcon: React.FC<AnimateIconProps & { filled?: boolean }> = ({ filled = false, ...props }) => {
    const variants: Variants = {
        normal: { scale: 1 },
        animate: {
            scale: [1, 1.25, 0.9, 1.15, 1],
            transition: { duration: 0.5, ease: 'easeInOut' }
        }
    };

    return (
        <AnimateIcon
            variants={variants}
            fill={filled ? 'currentColor' : 'none'}
            {...props}
        >
            <motion.path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                variants={{
                    normal: { pathLength: 1 },
                    animate: { pathLength: [1, 0.8, 1], transition: { duration: 0.4 } }
                }}
            />
        </AnimateIcon>
    );
};

// --- 2. STORE ICON (Shops / Vendedores) ---
export const StoreIcon: React.FC<AnimateIconProps> = (props) => {
    const variants: Variants = {
        normal: { y: 0 },
        animate: {
            y: [0, -3, 0],
            transition: { duration: 0.4, ease: 'easeInOut' }
        }
    };

    return (
        <AnimateIcon variants={variants} {...props}>
            <motion.path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <motion.path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <motion.path
                d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"
                variants={{
                    normal: { scaleY: 1 },
                    animate: { scaleY: [1, 1.2, 1], transition: { duration: 0.3 } }
                }}
            />
            <motion.path d="M2 7h20v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0a2 2 0 0 1-2 2V7Z" />
        </AnimateIcon>
    );
};

// --- 3. USER ICON (Profile / Follow) ---
export const UserIcon: React.FC<AnimateIconProps & { add?: boolean; remove?: boolean; check?: boolean }> = ({ add, remove, check, ...props }) => {
    const variants: Variants = {
        normal: { scale: 1 },
        animate: {
            scale: [1, 1.15, 0.95, 1],
            transition: { duration: 0.4 }
        }
    };

    return (
        <AnimateIcon variants={variants} {...props}>
            <motion.path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <motion.circle cx="12" cy="7" r="4" />
            {add && <motion.path d="M19 8v6m-3-3h6" variants={{ normal: { scale: 1 }, animate: { rotate: 90, scale: 1.2 } }} />}
            {remove && <motion.path d="M16 11h6" variants={{ normal: { scale: 1 }, animate: { scale: [1, 0.5, 1.2, 1] } }} />}
            {check && <motion.path d="m16 11 2 2 4-4" variants={{ normal: { pathLength: 1 }, animate: { pathLength: [0, 1], transition: { duration: 0.3 } } }} />}
        </AnimateIcon>
    );
};

// --- 4. CHECK ICON (Success / Verified) ---
export const CheckIcon: React.FC<AnimateIconProps> = (props) => {
    return (
        <AnimateIcon {...props}>
            <motion.path
                d="M20 6 9 17l-5-5"
                variants={{
                    normal: { pathLength: 1, opacity: 1 },
                    animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.4, ease: 'easeOut' } }
                }}
            />
        </AnimateIcon>
    );
};

// --- 5. SPARKLES ICON (VIP / Featured) ---
export const SparklesIcon: React.FC<AnimateIconProps> = (props) => {
    const variants: Variants = {
        normal: { rotate: 0, scale: 1 },
        animate: {
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
            transition: { duration: 0.6, ease: 'easeInOut' }
        }
    };

    return (
        <AnimateIcon variants={variants} {...props}>
            <motion.path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <motion.path d="M20 3v4" variants={{ normal: { opacity: 1 }, animate: { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } }} />
            <motion.path d="M22 5h-4" variants={{ normal: { opacity: 1 }, animate: { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } }} />
        </AnimateIcon>
    );
};

// --- 6. SHARE ICON (Share modal / Socials) ---
export const ShareIcon: React.FC<AnimateIconProps> = (props) => {
    return (
        <AnimateIcon {...props}>
            <motion.circle cx="18" cy="5" r="3" variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.3, 1] } }} />
            <motion.circle cx="6" cy="12" r="3" variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.3, 1], transition: { delay: 0.1 } } }} />
            <motion.circle cx="18" cy="19" r="3" variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.3, 1], transition: { delay: 0.2 } } }} />
            <motion.line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
            <motion.line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </AnimateIcon>
    );
};

// --- 7. FOLDER ICON (Lists / Favoritos) ---
export const FolderIcon: React.FC<AnimateIconProps> = (props) => {
    return (
        <AnimateIcon {...props}>
            <motion.path
                d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
                variants={{
                    normal: { scale: 1 },
                    animate: { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0], transition: { duration: 0.4 } }
                }}
            />
        </AnimateIcon>
    );
};

// --- 8. TRASH ICON (Delete / Remove) ---
export const TrashIcon: React.FC<AnimateIconProps> = (props) => {
    return (
        <AnimateIcon {...props}>
            <motion.path d="M3 6h18" />
            <motion.path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <motion.path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" variants={{ normal: { y: 0 }, animate: { y: -2 } }} />
            <motion.line x1="10" x2="10" y1="11" y2="17" />
            <motion.line x1="14" x2="14" y1="11" y2="17" />
        </AnimateIcon>
    );
};

// --- 9. BELL ICON (Notifications / Alerts) ---
export const BellIcon: React.FC<AnimateIconProps> = (props) => {
    return (
        <AnimateIcon {...props}>
            <motion.path
                d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                variants={{
                    normal: { rotate: 0 },
                    animate: { rotate: [0, 15, -15, 10, -10, 0], transition: { duration: 0.5 } }
                }}
            />
            <motion.path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </AnimateIcon>
    );
};
