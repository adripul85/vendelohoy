import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'items/unique-id.jpg')
 */
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    
    // Explicitly set content type from the file/blob
    const metadata = {
        contentType: (file as any).type || 'image/jpeg'
    };
    
    await uploadBytes(storageRef, file, metadata);
    return getDownloadURL(storageRef);
};

/**
 * Uploads multiple image files for a specific user to Firebase Storage.
 * @param files Array of files to upload
 * @param userId The ID of the user uploading the files
 */
export const uploadImages = async (files: File[], userId: string): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
        // Generate a unique path for each image
        const extension = file.name.split('.').pop();
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const path = `items/${userId}/${Date.now()}-${uniqueId}.${extension}`;
        
        return uploadFile(file, path);
    });

    return Promise.all(uploadPromises);
};
