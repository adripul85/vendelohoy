import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    images: string[];
    activeImg: number;
    setActiveImg: (idx: number) => void;
    isHovered: boolean;
    setIsHovered: (val: boolean) => void;
    mousePos: { x: number; y: number };
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onFullscreen: () => void;
    onShare: () => void;
    imageRef: React.RefObject<HTMLDivElement>;
}


const ProductMedia: React.FC<Props> = ({
    images = [],
    activeImg,
    setActiveImg,
    isHovered,
    setIsHovered,
    mousePos,
    onMouseMove,
    onFullscreen,
    imageRef
}) => {
    const validImages = Array.isArray(images) && images.length > 0 ? images : ['https://via.placeholder.com/800x600?text=Sin+Imagen'];
    // Ensure activeImg is within bounds
    const safeActiveImg = activeImg < validImages.length ? activeImg : 0;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Gallery Strip - Vertical on Desktop, Horizontal on Mobile */}
            <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-hide py-1 md:py-0 w-full md:w-20 lg:w-24 shrink-0">
                {validImages.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImg(idx)}
                        className={`shrink-0 w-16 h-16 md:w-full md:h-20 lg:h-24 rounded-lg overflow-hidden transition-all duration-300 border-2 ${safeActiveImg === idx ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:border-outline-variant/30'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt={`Vista ${idx + 1}`} />
                    </button>
                ))}
            </div>

            {/* Primary Viewer */}
            <div
                ref={imageRef}
                className="order-1 md:order-2 md:flex-1 w-full bg-surface-container-lowest md:rounded-2xl overflow-hidden cursor-zoom-in relative group min-h-[320px] h-[320px] md:h-[500px] lg:h-[600px] max-h-[70vh]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={onMouseMove}
                onClick={onFullscreen}
            >
                <AnimatePresence mode="wait">
                    <motion.img
                        key={safeActiveImg}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={validImages[safeActiveImg]}
                        alt="Producto Principal"
                        className="w-full h-full object-contain absolute inset-0"
                        style={{
                            transform: isHovered ? `scale(1.5)` : 'scale(1)',
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                        }}
                    />
                </AnimatePresence>

                <button 
                    onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-primary hover:bg-white hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl leading-none">zoom_in</span>
                </button>
            </div>
        </div>
    );
};

export default ProductMedia;
