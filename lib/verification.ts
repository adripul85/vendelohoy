import * as faceapi from 'face-api.js';

// ============================================
// VERIFICACIÓN AUTOMÁTICA DE IDENTIDAD
// Todo se procesa en el navegador del usuario.
// No se envían datos a servidores externos.
// ============================================

let modelsLoaded = false;

// Load face-api.js models from CDN
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

export const loadFaceModels = async (): Promise<void> => {
    if (modelsLoaded) return;
    
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
};

// Helper: load an image from URL into an HTMLImageElement
const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error('No se pudo cargar la imagen'));
        img.src = url;
    });
};

// ============================================
// 1. OCR: Extract DNI number from image
// ============================================
export const extractDniFromImage = async (
    imageUrl: string,
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; extractedNumber: string; rawText: string }> => {
    try {
        // Dynamic import to avoid loading Tesseract until needed
        const Tesseract = await import('tesseract.js');
        
        const result = await Tesseract.recognize(imageUrl, 'spa', {
            logger: (m: any) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100));
                }
            }
        });
        
        const rawText = result.data.text;
        
        // Extract numbers that look like DNI (7-8 digits, possibly with dots)
        // Argentine DNI: 7 or 8 digits, sometimes formatted as XX.XXX.XXX
        const cleanText = rawText.replace(/\s+/g, ' ');
        
        // Try to find DNI patterns
        const patterns = [
            /(\d{2}\.?\d{3}\.?\d{3})/g,  // XX.XXX.XXX or XXXXXXXX
            /(\d{7,8})/g,                   // 7-8 consecutive digits
        ];
        
        let dniNumber = '';
        
        for (const pattern of patterns) {
            const matches = cleanText.match(pattern);
            if (matches) {
                // Take the first match and clean it
                dniNumber = matches[0].replace(/\./g, '');
                if (dniNumber.length >= 7 && dniNumber.length <= 8) {
                    break;
                }
            }
        }
        
        return {
            success: dniNumber.length >= 7,
            extractedNumber: dniNumber,
            rawText: cleanText
        };
    } catch (error) {
        console.error('OCR Error:', error);
        return { success: false, extractedNumber: '', rawText: '' };
    }
};

// ============================================
// 2. Detect face in an image
// ============================================
export const detectFace = async (
    imageUrl: string
): Promise<{ 
    success: boolean; 
    faceCount: number; 
    descriptor: Float32Array | null;
    message: string;
}> => {
    try {
        await loadFaceModels();
        const img = await loadImage(imageUrl);
        
        const detections = await faceapi
            .detectAllFaces(img)
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        if (detections.length === 0) {
            return {
                success: false,
                faceCount: 0,
                descriptor: null,
                message: 'No se detectó ningún rostro en la imagen.'
            };
        }
        
        if (detections.length > 1) {
            // For selfie we want exactly 1 face
            // For DNI we also want 1 face (the photo on the document)
            // We'll use the largest face detected as the primary
        }
        
        // Get the largest face (most prominent)
        const sorted = detections.sort((a, b) => {
            const areaA = a.detection.box.width * a.detection.box.height;
            const areaB = b.detection.box.width * b.detection.box.height;
            return areaB - areaA;
        });
        
        return {
            success: true,
            faceCount: detections.length,
            descriptor: sorted[0].descriptor,
            message: `Se detectó ${detections.length} rostro(s).`
        };
    } catch (error) {
        console.error('Face detection error:', error);
        return {
            success: false,
            faceCount: 0,
            descriptor: null,
            message: 'Error al procesar la imagen para detección facial.'
        };
    }
};

// ============================================
// 3. Compare two faces (DNI photo vs Selfie)
// ============================================
export const compareFaces = (
    descriptor1: Float32Array,
    descriptor2: Float32Array
): { match: boolean; distance: number; similarity: number } => {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    // distance < 0.6 is typically a match in face-api.js
    // We convert to a similarity percentage for user-friendliness
    const similarity = Math.max(0, Math.min(1, 1 - distance)) * 100;
    
    return {
        match: distance < 0.6, // 0.6 threshold = ~50% similarity
        distance,
        similarity: Math.round(similarity)
    };
};

// ============================================
// ORCHESTRATOR: Run all 3 validations
// ============================================
export interface VerificationStep {
    id: 'ocr' | 'face_detection' | 'face_comparison';
    label: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
    progress?: number;
}

export interface VerificationResult {
    approved: boolean;
    steps: VerificationStep[];
    rejectionReason?: string;
}

export const autoVerifyIdentity = async (
    dniFrontUrl: string,
    selfieUrl: string,
    expectedDni: string,
    onStepUpdate: (steps: VerificationStep[]) => void
): Promise<VerificationResult> => {
    
    const steps: VerificationStep[] = [
        { id: 'ocr', label: 'Leyendo DNI', status: 'pending', message: 'Esperando...' },
        { id: 'face_detection', label: 'Detectando rostros', status: 'pending', message: 'Esperando...' },
        { id: 'face_comparison', label: 'Comparando identidad', status: 'pending', message: 'Esperando...' },
    ];
    
    const updateStep = (id: string, update: Partial<VerificationStep>) => {
        const step = steps.find(s => s.id === id);
        if (step) Object.assign(step, update);
        onStepUpdate([...steps]);
    };
    
    // Clean the expected DNI (remove dots, spaces)
    const cleanExpectedDni = expectedDni.replace(/[.\s-]/g, '');
    
    // === STEP 1: OCR ===
    updateStep('ocr', { status: 'running', message: 'Analizando imagen del DNI...' });
    
    const ocrResult = await extractDniFromImage(dniFrontUrl, (progress) => {
        updateStep('ocr', { progress, message: `Leyendo documento... ${progress}%` });
    });
    
    if (!ocrResult.success) {
        updateStep('ocr', { 
            status: 'error', 
            message: 'No se pudo leer el número de DNI de la imagen. Intentá con una foto más nítida.' 
        });
        return {
            approved: false,
            steps,
            rejectionReason: 'No se pudo leer el número de DNI de la imagen. Subí una foto más nítida y centrada.'
        };
    }
    
    // Compare extracted DNI with expected
    if (ocrResult.extractedNumber !== cleanExpectedDni) {
        updateStep('ocr', { 
            status: 'error', 
            message: `El DNI leído (${ocrResult.extractedNumber}) no coincide con el ingresado (${cleanExpectedDni}).` 
        });
        return {
            approved: false,
            steps,
            rejectionReason: `El número de DNI de la foto no coincide con el ingresado en tu perfil.`
        };
    }
    
    updateStep('ocr', { 
        status: 'success', 
        message: `DNI verificado: ${ocrResult.extractedNumber}`,
        progress: 100 
    });
    
    // === STEP 2: Face Detection ===
    updateStep('face_detection', { status: 'running', message: 'Cargando modelos de reconocimiento facial...' });
    
    const [dniFaceResult, selfieFaceResult] = await Promise.all([
        detectFace(dniFrontUrl),
        detectFace(selfieUrl)
    ]);
    
    if (!dniFaceResult.success || !dniFaceResult.descriptor) {
        updateStep('face_detection', { 
            status: 'error', 
            message: 'No se detectó un rostro en la foto del DNI. Intentá con una imagen más clara.' 
        });
        return {
            approved: false,
            steps,
            rejectionReason: 'No se detectó un rostro en la foto del DNI.'
        };
    }
    
    if (!selfieFaceResult.success || !selfieFaceResult.descriptor) {
        updateStep('face_detection', { 
            status: 'error', 
            message: 'No se detectó un rostro en la selfie. Asegurate de que tu cara sea visible.' 
        });
        return {
            approved: false,
            steps,
            rejectionReason: 'No se detectó un rostro claro en la selfie.'
        };
    }
    
    updateStep('face_detection', { 
        status: 'success', 
        message: 'Rostros detectados correctamente en ambas imágenes.' 
    });
    
    // === STEP 3: Face Comparison ===
    updateStep('face_comparison', { status: 'running', message: 'Comparando rostros...' });
    
    const comparison = compareFaces(dniFaceResult.descriptor, selfieFaceResult.descriptor);
    
    if (!comparison.match) {
        updateStep('face_comparison', { 
            status: 'error', 
            message: `Similitud: ${comparison.similarity}%. Los rostros no coinciden lo suficiente.` 
        });
        return {
            approved: false,
            steps,
            rejectionReason: `El rostro de la selfie no coincide con el del DNI (similitud: ${comparison.similarity}%).`
        };
    }
    
    updateStep('face_comparison', { 
        status: 'success', 
        message: `Similitud: ${comparison.similarity}%. ¡Identidad confirmada!` 
    });
    
    // === ALL PASSED ===
    return {
        approved: true,
        steps
    };
};
