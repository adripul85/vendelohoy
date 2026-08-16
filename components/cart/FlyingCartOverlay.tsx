import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FlyingItemPayload {
    id: string;
    image: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
}

interface FlyingCartOverlayProps {
    items: FlyingItemPayload[];
    onComplete: (id: string) => void;
}

export const FlyingCartOverlay: React.FC<FlyingCartOverlayProps> = ({ items, onComplete }) => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
            <AnimatePresence>
                {items.map((item) => {
                    // Create an arched trajectory: mid-point rises higher than both start and target
                    const midX = (item.startX + item.targetX) / 2;
                    const peakY = Math.min(item.startY, item.targetY) - 90;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{
                                x: item.startX,
                                y: item.startY,
                                scale: 1,
                                opacity: 1,
                                rotate: 0,
                            }}
                            animate={{
                                x: [item.startX, midX, item.targetX],
                                y: [item.startY, peakY, item.targetY],
                                scale: [1, 0.85, 0.15],
                                opacity: [1, 0.95, 0.1],
                                rotate: [0, -18, 15],
                            }}
                            transition={{
                                duration: 0.75,
                                ease: [0.16, 1, 0.3, 1], // Smooth snappy curve
                                times: [0, 0.45, 1],
                            }}
                            onAnimationComplete={() => onComplete(item.id)}
                            className="absolute top-0 left-0 -ml-7 -mt-7 size-14 rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(16,185,129,0.4)] border-2 border-white/95 bg-white flex items-center justify-center pointer-events-none"
                        >
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt="Flying item"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                                </div>
                            )}

                            {/* Emerald aura & shine overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-white/40 pointer-events-none" />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

interface SparkleBurstProps {
    active: boolean;
}

export const SparkleBurst: React.FC<SparkleBurstProps> = ({ active }) => {
    if (!active) return null;

    const particles = [
        { x: -16, y: -16, delay: 0, color: '#10b981' },
        { x: 16, y: -16, delay: 0.05, color: '#059669' },
        { x: -18, y: 8, delay: 0.02, color: '#34d399' },
        { x: 18, y: 10, delay: 0.08, color: '#10b981' },
        { x: 0, y: -22, delay: 0.04, color: '#f59e0b' },
        { x: 0, y: 18, delay: 0.06, color: '#10b981' },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {particles.map((p, idx) => (
                <motion.div
                    key={idx}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                        x: p.x,
                        y: p.y,
                        scale: [0, 1.4, 0],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 0.5,
                        delay: p.delay,
                        ease: "easeOut"
                    }}
                    style={{ backgroundColor: p.color }}
                    className="absolute size-2 rounded-full shadow-sm"
                />
            ))}
        </div>
    );
};
