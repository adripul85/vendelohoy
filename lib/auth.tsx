import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { getUserProfile, createUserProfile, UserProfile } from './users';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    profileLoading: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    register: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<any>;
    resetPassword: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    // Fetch user profile
    const fetchUserProfile = async (currentUser: User) => {
        setProfileLoading(true);
        let profile = await getUserProfile(currentUser.uid);

        // If profile doesn't exist, create a basic one
        if (!profile) {
            await createUserProfile(currentUser.uid, {
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                avatar: currentUser.photoURL || '',
                phone: '',
                location: { city: '', state: '' },
                profileComplete: false
            });
            // Fetch again after creation
            profile = await getUserProfile(currentUser.uid);
        }

        // Ensure Custom Claims are synced if the user is an admin in Firestore
        if (profile && (profile.isAdmin || profile.role === 'admin')) {
            try {
                const tokenResult = await currentUser.getIdTokenResult();
                if (!tokenResult.claims.admin) {
                    const idToken = await currentUser.getIdToken();
                    const res = await fetch('/api/sync-admin-claim', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${idToken}` }
                    });
                    if (res.ok) {
                        // Force refresh token to apply the new claim immediately
                        await currentUser.getIdToken(true);
                        console.log("✅ Custom admin claim synced and applied.");
                    } else {
                        // Silently handle non-ok responses (e.g., 405 in dev mode).
                        // The isAdmin() Firestore rule has a fallback that checks the user document directly,
                        // so custom claims are an optimization, not a hard requirement.
                        console.warn(`⚠️ Admin claim sync returned ${res.status}. Using Firestore fallback for admin checks.`);
                    }
                }
            } catch (err) {
                // Network errors (e.g., dev proxy issues) — safe to ignore
                console.warn("⚠️ Admin claim sync unavailable (likely dev mode). Firestore rules will use document-level fallback.");
            }
        }

        setUserProfile(profile);
        setProfileLoading(false);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                await fetchUserProfile(currentUser);
            } else {
                setUserProfile(null);
                setProfileLoading(false);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

    const register = async (email: string, pass: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);
        if (credential.user) {
            await sendEmailVerification(credential.user);
        }
        return credential;
    };

    const logout = () => signOut(auth);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

    const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

    return (
        <AuthContext.Provider value={{ user, userProfile, profileLoading, loading, login, register, logout, loginWithGoogle, resetPassword, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
