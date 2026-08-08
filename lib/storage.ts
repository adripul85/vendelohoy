import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { optimizeImages } from "./imageOptimizer";

export const MAX_PRODUCT_IMAGES = 6;

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'items/unique-id.jpg')
 */
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    
    // Explicitly set content type from the file/blob
    const metadata = {
        contentType: (file as any).type || 'image/webp'
    };
    
    await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(storageRef);
};

/**
 * Uploads multiple image files for a specific user to Firebase Storage.
 * Automatically optimizes and compresses images before upload, enforcing max 6 limit.
 * @param files Array of files to upload
 * @param userId The ID of the user uploading the files
 */
export const uploadImages = async (files: File[], userId: string): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    
    // Enforce maximum 6 images limit per upload
    const limitedFiles = files.slice(0, MAX_PRODUCT_IMAGES);
    
    // Client-side optimization: convert heavy photos to lightweight WebP/JPG
    const optimizedFiles = await optimizeImages(limitedFiles);

    const uploadPromises = optimizedFiles.map(async (file) => {
        // Generate a unique path for each image
        const extension = file.name.split('.').pop() || 'webp';
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const path = `items/${userId}/${Date.now()}-${uniqueId}.${extension}`;
        
        return uploadFile(file, path);
    });

    return Promise.all(uploadPromises);
};
