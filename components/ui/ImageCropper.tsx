import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/cropImage';

interface ImageCropperProps {
    imageSrc: string;
    aspectRatio?: number;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageSrc, aspectRatio = 16 / 9, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageFile) {
                onCropComplete(croppedImageFile);
            }
        } catch (e) {
            console.error(e);
        }
        setIsProcessing(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl h-[60vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={setCrop}
                    onCropComplete={onCropCompleteInternal}
                    onZoomChange={setZoom}
                    objectFit="contain"
                    showGrid={true}
                />
            </div>
            
            <div className="w-full max-w-xl mt-6 bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-6 items-center">
                <div className="w-full flex items-center gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant">zoom_out</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                    <span className="material-symbols-outlined text-on-surface-variant">zoom_in</span>
                </div>
                
                <div className="flex justify-end gap-3 w-full">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">crop</span>
                                Recortar y Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
