/**
 * High-performance Client-Side Image Optimizer and Compressor using HTML5 Canvas
 * Reduces heavy camera/mobile photos (5MB - 12MB) down to ~150KB - 280KB WebP images
 * without noticeable loss of visual quality.
 */

export interface OptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.1 to 1.0
    format?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: OptimizationOptions = {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
    format: 'image/webp'
};

/**
 * Optimizes a single File object using HTML5 Canvas rendering.
 */
export const optimizeImage = async (
    file: File,
    options: OptimizationOptions = {}
): Promise<File> => {
    // If not an image or SVG/GIF, return original file
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    const { maxWidth, maxHeight, quality, format } = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = () => resolve(file);

        img.onload = () => {
            try {
                let { width, height } = img;

                // Calculate aspect ratio preserving dimensions
                if (width > maxWidth! || height > maxHeight!) {
                    if (width > height) {
                        height = Math.round((height * maxWidth!) / width);
                        width = maxWidth!;
                    } else {
                        width = Math.round((width * maxHeight!) / height);
                        height = maxHeight!;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                // Smooth rendering settings
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Helper to create File from Blob
                const targetFormat = format || 'image/webp';
                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size >= file.size) {
                            // If compression didn't save space or failed, return original
                            resolve(file);
                            return;
                        }

                        const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        const ext = targetFormat === 'image/webp' ? '.webp' : '.jpg';
                        const newFileName = `${originalNameWithoutExt}${ext}`;

                        const compressedFile = new File([blob], newFileName, {
                            type: targetFormat,
                            lastModified: Date.now()
                        });

                        resolve(compressedFile);
                    },
                    targetFormat,
                    quality
                );
            } catch (err) {
                console.warn('Image optimization canvas failed, using original:', err);
                resolve(file);
            }
        };

        img.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};

/**
 * Optimizes an array of File objects sequentially or concurrently.
 */
export const optimizeImages = async (
    files: File[],
    options: OptimizationOptions = {}
): Promise<File[]> => {
    if (!files || files.length === 0) return [];
    
    return Promise.all(files.map((file) => optimizeImage(file, options)));
};
