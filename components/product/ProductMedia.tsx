import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    images: string[];
    videoUrl?: string;
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

// Utility: detect video type from URL
const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' | null => {
    if (!url) return null;
    if (url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i)) return 'youtube';
    if (url.match(/(?:vimeo\.com\/)/i)) return 'vimeo';
    if (url.match(/\.(mp4|webm|mov|ogg|m3u8)(\?.*)?$/i)) return 'direct';
    // If it's a URL but doesn't match known patterns, try as direct video
    if (url.startsWith('http')) return 'direct';
    return null;
};

// Extract YouTube video ID
const getYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
};

// Get YouTube thumbnail
const getYoutubeThumbnail = (videoId: string): string =>
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

// Get embed URL
const getEmbedUrl = (url: string, type: 'youtube' | 'vimeo'): string => {
    if (type === 'youtube') {
        const id = getYoutubeId(url);
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
    }
    if (type === 'vimeo') {
        const id = getVimeoId(url);
        return `https://player.vimeo.com/video/${id}`;
    }
    return url;
};


const ProductMedia: React.FC<Props> = ({
    images = [],
    videoUrl,
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
    
    // Build media items: images + video (if present)
    const videoType = useMemo(() => videoUrl ? getVideoType(videoUrl) : null, [videoUrl]);
    const hasVideo = !!videoUrl && !!videoType;
    
    // Total items = images + (1 video if exists). Video is the last item.
    const totalItems = validImages.length + (hasVideo ? 1 : 0);
    const videoIndex = hasVideo ? validImages.length : -1;
    const isShowingVideo = activeImg === videoIndex;
    
    // Ensure activeImg is within bounds
    const safeActiveImg = activeImg < totalItems ? activeImg : 0;

    // Video thumbnail for gallery strip
    const videoThumbnail = useMemo(() => {
        if (!videoUrl || !videoType) return '';
        if (videoType === 'youtube') {
            const id = getYoutubeId(videoUrl);
            return id ? getYoutubeThumbnail(id) : '';
        }
        // For vimeo and direct videos, use a generic video icon placeholder
        return '';
    }, [videoUrl, videoType]);

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
                
                {/* Video thumbnail in gallery */}
                {hasVideo && (
                    <button
                        onClick={() => setActiveImg(videoIndex)}
                        className={`shrink-0 w-16 h-16 md:w-full md:h-20 lg:h-24 rounded-lg overflow-hidden transition-all duration-300 border-2 relative group/vid ${safeActiveImg === videoIndex ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:border-outline-variant/30'}`}
                    >
                        {videoThumbnail ? (
                            <img src={videoThumbnail} className="w-full h-full object-cover" alt="Video" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">videocam</span>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/vid:bg-black/40 transition-colors">
                            <div className="size-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-primary text-sm ml-0.5">play_arrow</span>
                            </div>
                        </div>
                    </button>
                )}
            </div>

            {/* Primary Viewer */}
            <div
                ref={imageRef}
                className={`order-1 md:order-2 md:flex-1 w-full bg-surface-container-lowest md:rounded-2xl overflow-hidden relative group min-h-[320px] h-[320px] md:h-[500px] lg:h-[600px] max-h-[70vh] ${isShowingVideo ? '' : 'cursor-zoom-in'}`}
                onMouseEnter={() => !isShowingVideo && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={(e) => !isShowingVideo && onMouseMove(e)}
                onClick={() => !isShowingVideo && onFullscreen()}
            >
                {isShowingVideo && videoUrl ? (
                    // === VIDEO PLAYER ===
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        {videoType === 'youtube' || videoType === 'vimeo' ? (
                            <iframe
                                src={getEmbedUrl(videoUrl, videoType)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                title="Video del producto"
                                style={{ border: 'none' }}
                            />
                        ) : (
                            // Direct video (.mp4, .webm, .mov, CDN links, etc.)
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-contain"
                                controlsList="nodownload"
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Tu navegador no soporta la reproducción de video.
                            </video>
                        )}
                    </div>
                ) : (
                    // === IMAGE VIEWER ===
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductMedia;
