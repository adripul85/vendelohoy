import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface PlatformSettings {
    escrowFeePercentage: number;
    paymentProcessingFeePercentage: number;
    featuredExtraPercentage: number;
    featuredDurationHours: number;
    escrowFixedFee?: number;
    useFixedEscrowFee?: boolean;
    showHero: boolean;
    updatedAt?: any;
}

const DEFAULT_SETTINGS: PlatformSettings = {
    escrowFeePercentage: 0.05, // 5%
    paymentProcessingFeePercentage: 0.06, // 6% (Mercado Pago/Modo)
    featuredExtraPercentage: 0.05, // 5% Extra for Featured
    featuredDurationHours: 48,
    escrowFixedFee: 2500,
    useFixedEscrowFee: false,
    showHero: true
};

/**
 * Fetch platform settings from Firestore
 * Returns default settings if regular user or doc doesn't exist
 */
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
    try {
        const settingsRef = doc(db, "platform", "config");
        const snapshot = await getDoc(settingsRef);

        if (snapshot.exists()) {
            return { ...DEFAULT_SETTINGS, ...snapshot.data() } as PlatformSettings;
        }

        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        return DEFAULT_SETTINGS;
    }
};

/**
 * Update platform settings
 * (Admin only - verified by Firestore Rules usually, but frontend check applies too)
 */
export const updatePlatformSettings = async (settings: Partial<PlatformSettings>) => {
    try {
        const settingsRef = doc(db, "platform", "config");
        await setDoc(settingsRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating settings:", error);
        return { success: false, error: error.message };
    }
};
