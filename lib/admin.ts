import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, where, limit, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, Withdrawal } from "./users";

/**
 * Fetch all users from Firestore
 * Note: In a production app, you would implement pagination.
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data()
        } as UserProfile));
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Update a user's verification badges
 */
export const updateUserVerification = async (
    uid: string,
    badges: { identityVerified?: boolean; addressVerified?: boolean; phoneVerified?: boolean }
) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData: any = {};

        if (badges.identityVerified !== undefined) updateData["verificationBadges.identityVerified"] = badges.identityVerified;
        if (badges.addressVerified !== undefined) updateData["verificationBadges.addressVerified"] = badges.addressVerified;
        if (badges.phoneVerified !== undefined) updateData["verificationBadges.phoneVerified"] = badges.phoneVerified;

        updateData.updatedAt = serverTimestamp();

        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating user verification:", error);
        return { success: false, error };
    }
};

/**
 * Review user KYC evidence (Approve or Reject)
 */
export const reviewUserEvidence = async (
    uid: string,
    status: 'approved' | 'rejected',
    rejectionReason: string = ''
) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData: any = {
            "verificationEvidence.status": status,
            "verificationEvidence.rejectionReason": rejectionReason,
            "updatedAt": serverTimestamp()
        };

        // If approved, automatically grant the identity badge
        if (status === 'approved') {
            updateData["verificationBadges.identityVerified"] = true;
        } else {
            // If rejected, optionally remove the badge if it was there
            updateData["verificationBadges.identityVerified"] = false;
        }

        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error reviewing user evidence:", error);
        return { success: false, error };
    }
};

/**
 * Update a user's role
 */
export const updateUserRole = async (uid: string, role: 'admin' | 'moderator' | 'user') => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            role,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error };
    }
};

/**
 * Delete a user by admin - Deep clean ALL user data except email
 */
export const deleteUserByAdmin = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", uid)));
        const userEmail = userSnap.docs[0]?.data()?.email || 'deleted@unknown.com';

        // 1. Delete user's items
        const itemsSnap = await getDocs(query(collection(db, "items"), where("sellerId", "==", uid)));
        for (const d of itemsSnap.docs) await deleteDoc(d.ref);

        // 2. Delete user's wallet movements
        const movSnap = await getDocs(query(collection(db, "wallet_movements"), where("userId", "==", uid)));
        for (const d of movSnap.docs) await deleteDoc(d.ref);

        // 3. Delete user's reviews (given)
        const revSnap = await getDocs(query(collection(db, "reviews"), where("reviewerId", "==", uid)));
        for (const d of revSnap.docs) await deleteDoc(d.ref);

        // 4. Delete user's questions
        const qSnap = await getDocs(query(collection(db, "questions"), where("userId", "==", uid)));
        for (const d of qSnap.docs) await deleteDoc(d.ref);

        // 5. Delete user's reports
        const repSnap = await getDocs(query(collection(db, "reports"), where("reporterId", "==", uid)));
        for (const d of repSnap.docs) await deleteDoc(d.ref);

        // 6. Delete user's withdrawals
        const wSnap = await getDocs(query(collection(db, "withdrawals"), where("uid", "==", uid)));
        for (const d of wSnap.docs) await deleteDoc(d.ref);

        // 7. Delete user's chats
        const chatSnap = await getDocs(query(collection(db, "chats"), where("participants", "array-contains", uid)));
        for (const chatDoc of chatSnap.docs) {
            // Delete messages subcollection
            const msgsSnap = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
            for (const m of msgsSnap.docs) await deleteDoc(m.ref);
            await deleteDoc(chatDoc.ref);
        }

        // 8. Delete user's notifications subcollection
        const notiSnap = await getDocs(collection(db, "users", uid, "notifications"));
        for (const d of notiSnap.docs) await deleteDoc(d.ref);

        // 9. Delete user's reviews subcollection
        const userRevSnap = await getDocs(collection(db, "users", uid, "reviews"));
        for (const d of userRevSnap.docs) await deleteDoc(d.ref);

        // 10. Wipe user doc but KEEP email
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userRef, {
            email: userEmail,
            deleted: true,
            deletedAt: serverTimestamp(),
            displayName: '[Usuario Eliminado]',
            role: 'user'
        });

        const deletedCounts = {
            items: itemsSnap.size,
            movements: movSnap.size,
            reviews: revSnap.size,
            questions: qSnap.size,
            reports: repSnap.size,
            withdrawals: wSnap.size,
            chats: chatSnap.size
        };

        console.log(`[ADMIN] Deep-deleted user ${uid}. Preserved email: ${userEmail}. Counts:`, deletedCounts);
        return { success: true, deletedCounts };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error };
    }
};

/**
 * Update user wallet balances manually
 */
export const updateUserWallet = async (uid: string, wallet: Partial<UserProfile['wallet']>) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData: any = {};

        if (wallet.available !== undefined) updateData["wallet.available"] = wallet.available;
        if (wallet.inEscrow !== undefined) updateData["wallet.inEscrow"] = wallet.inEscrow;
        if (wallet.pending !== undefined) updateData["wallet.pending"] = wallet.pending;

        updateData["wallet.lastUpdated"] = serverTimestamp();

        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating wallet:", error);
        return { success: false, error };
    }
};

/**
 * Get aggregate platform stats (Finance Tab)
 */
export const getPlatformStats = async () => {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        let totalAvailable = 0;
        let totalInEscrow = 0;
        let totalPending = 0;
        let totalUsers = snapshot.size;
        let newUsersToday = 0;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        snapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.wallet) {
                totalAvailable += data.wallet.available || 0;
                totalInEscrow += data.wallet.inEscrow || 0;
                totalPending += data.wallet.pending || 0;
            }
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                if (data.createdAt.toDate() >= startOfDay) {
                    newUsersToday++;
                }
            }
        });

        // Calculate Daily Sales
        const txRef = collection(db, "transactions");
        const startOfDayTimestamp = import("firebase/firestore").then(m => m.Timestamp.fromDate(startOfDay));
        const txSnap = await getDocs(query(txRef, orderBy("createdAt", "desc")));

        let dailySales = 0;
        txSnap.forEach(t => {
            const txData = t.data();
            if (txData.createdAt && typeof txData.createdAt.toDate === 'function') {
                if (txData.createdAt.toDate() >= startOfDay && (txData.status !== 'CANCELLED' && txData.status !== 'REFUNDED')) {
                    dailySales += txData.amount || 0;
                }
            }
        });

        return {
            totalAvailable,
            totalInEscrow,
            totalPending,
            totalSystemValue: totalAvailable + totalInEscrow + totalPending,
            totalUsers,
            dailySales,
            newUsersToday
        };
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return null;
    }
};

/**
 * Fetch all transactions in dispute
 */
export const getDisputedTransactions = async () => {
    try {
        const { where, query } = await import("firebase/firestore");
        const txRef = collection(db, "transactions");
        const q = query(txRef, where("status", "==", "DISPUTED"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching disputes:", error);
        return [];
    }
};

/**
 * DEV TOOL: Reset Platform Data (Wipe Transactions, Reset Wallets, Restore Items)
 */
export const resetPlatformData = async () => {
    try {
        const { writeBatch, collection, getDocs, doc, query, where, serverTimestamp } = await import("firebase/firestore");
        const batch = writeBatch(db);
        let operationCount = 0;

        // 1. Delete ALL Transactions
        const txDocs = await getDocs(collection(db, "transactions"));
        txDocs.forEach((doc) => {
            batch.delete(doc.ref);
            operationCount++;
        });

        // 2. Reset ALL User Wallets
        const userDocs = await getDocs(collection(db, "users"));
        userDocs.forEach((userDoc) => {
            batch.update(userDoc.ref, {
                "wallet.available": 0,
                "wallet.inEscrow": 0,
                "wallet.pending": 0,
                "wallet.lastUpdated": serverTimestamp()
            });
            operationCount++;
        });

        // 3. Restore SOLD Items to AVAILABLE
        const itemsRef = collection(db, "items");
        const soldItemsQuery = query(itemsRef, where("status", "==", "SOLD"));
        const soldItemsDocs = await getDocs(soldItemsQuery);

        soldItemsDocs.forEach((itemDoc) => {
            batch.update(itemDoc.ref, {
                status: 'AVAILABLE',
                updatedAt: serverTimestamp()
            });
            operationCount++;
        });

        // Commit Batch
        if (operationCount > 0) {
            await batch.commit();
        }

        return { success: true, count: operationCount };
    } catch (error: any) {
        console.error("Error resetting platform:", error);
        return { success: false, error: error.message };
    }
};

export interface FinancialLog {
    id: string;
    transactionId: string;
    type: 'platform_fee' | 'cancellation_penalty';
    amount: number;
    currency: string;
    relatedUser: string;
    timestamp: any;
}

/**
 * Fetch financial operations history
 */
export const getFinancialLogs = async (): Promise<FinancialLog[]> => {
    try {
        const logsRef = collection(db, "financial_logs");
        const q = query(logsRef, orderBy("timestamp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FinancialLog));
    } catch (error) {
        console.error("Error fetching financial logs:", error);
        return [];
    }
};

/**
 * Fetch all pending withdrawal requests
 */
export const getWithdrawalRequests = async (): Promise<Withdrawal[]> => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        const q = query(withdrawalsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
    } catch (error) {
        console.error("Error fetching withdrawals:", error);
        return [];
    }
};

/**
 * Update withdrawal status (e.g., mark as completed)
 */
export const updateWithdrawalStatus = async (id: string, status: 'completed' | 'rejected') => {
    try {
        const docRef = doc(db, "withdrawals", id);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating withdrawal status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * DELETE ALL ITEMS (DANGER ZONE)
 */
export const clearAllItems = async () => {
    try {
        const { writeBatch, getDocs, collection } = await import("firebase/firestore");
        const itemsRef = collection(db, "items");
        const snapshot = await getDocs(itemsRef);

        if (snapshot.empty) return { success: true, count: 0 };

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        console.error("Error clearing items:", error);
        return { success: false, error: error.message };
    }
};

/**
 */
export const clearAllTransactionsHistory = async () => {
    try {
        const { writeBatch, getDocs, collection } = await import("firebase/firestore");

        const collectionsToClear = ["transactions", "withdrawals", "financial_logs"];
        let totalDeleted = 0;

        for (const colName of collectionsToClear) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);

            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
            }
        }

        return { success: true, count: totalDeleted };
    } catch (error: any) {
        console.error("Error clearing transaction history:", error);
        return { success: false, error: error.message };
    }
};

/**
 * DEV TOOL: Clear all wallet movements AND reset all user balances to 0
 */
export const clearAllWalletMovements = async () => {
    try {
        const { writeBatch, collection, getDocs } = await import("firebase/firestore");

        // 1. Delete all wallet_movements documents
        const movDocs = await getDocs(collection(db, "wallet_movements"));
        const batch1 = writeBatch(db);
        movDocs.forEach((d) => batch1.delete(d.ref));
        await batch1.commit();

        // 2. Reset ALL user wallets to 0
        const userDocs = await getDocs(collection(db, "users"));
        // Firestore batches have a limit of 500 writes
        const batchSize = 450;
        let batch2 = writeBatch(db);
        let count = 0;

        for (const userDoc of userDocs.docs) {
            batch2.update(userDoc.ref, {
                'wallet.available': 0,
                'wallet.inEscrow': 0,
                'wallet.pending': 0,
                'wallet.lastUpdated': serverTimestamp()
            });
            count++;
            if (count % batchSize === 0) {
                await batch2.commit();
                batch2 = writeBatch(db);
            }
        }
        if (count % batchSize !== 0) {
            await batch2.commit();
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error clearing wallet movements:", error);
        return { success: false, error: error.message };
    }
};

/**
 * DEV TOOL: Reset all user reputations
 */
export const resetAllUserReputations = async () => {
    try {
        const { writeBatch, collection, getDocs, serverTimestamp } = await import("firebase/firestore");
        const batch = writeBatch(db);
        const users = await getDocs(collection(db, "users"));
        users.forEach((doc) => {
            batch.update(doc.ref, {
                reputation: {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    lastUpdated: serverTimestamp()
                }
            });
        });
        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error("Error resetting reputations:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Get the System Admin ID for fee diversion
 */
export const getSystemAdminId = async (): Promise<string | null> => {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");
        const usersRef = collection(db, "users");
        // We find the FIRST user with role 'admin'
        const q = query(usersRef, where("role", "==", "admin"), orderBy("createdAt", "asc"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error finding system admin:", error);
        return null;
    }
};

/**
 * Generate a full platform audit report (downloads as JSON)
 */
export const generateAuditReport = async () => {
    try {
        const [usersSnap, itemsSnap, txSnap, logsSnap, withdrawalsSnap, movSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "items")),
            getDocs(collection(db, "transactions")),
            getDocs(collection(db, "financial_logs")),
            getDocs(collection(db, "withdrawals")),
            getDocs(collection(db, "wallet_movements"))
        ]);

        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const financialLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const withdrawals = withdrawalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const movements = movSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Calculate totals
        const totalAvailable = users.reduce((s: number, u: any) => s + (u.wallet?.available || 0), 0);
        const totalInEscrow = users.reduce((s: number, u: any) => s + (u.wallet?.inEscrow || 0), 0);
        const totalPending = users.reduce((s: number, u: any) => s + (u.wallet?.pending || 0), 0);
        const totalRevenue = financialLogs.reduce((s: number, l: any) => s + (l.amount || 0), 0);

        const report = {
            generatedAt: new Date().toISOString(),
            platform: 'Vendelo Hoy!',
            summary: {
                totalUsers: users.length,
                activeUsers: users.filter((u: any) => !u.deleted).length,
                deletedUsers: users.filter((u: any) => u.deleted).length,
                totalItems: items.length,
                soldItems: items.filter((i: any) => i.status === 'SOLD').length,
                activeItems: items.filter((i: any) => i.status !== 'SOLD').length,
                totalTransactions: transactions.length,
                completedTransactions: transactions.filter((t: any) => t.status === 'COMPLETED').length,
                disputedTransactions: transactions.filter((t: any) => t.status === 'DISPUTED').length,
                pendingTransactions: transactions.filter((t: any) => ['PENDING_PAYMENT', 'PAID_HELD', 'SHIPPED'].includes(t.status)).length,
                totalWithdrawals: withdrawals.length,
                pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'pending').length,
                totalWalletMovements: movements.length
            },
            financials: {
                totalAvailable,
                totalInEscrow,
                totalPending,
                totalSystemValue: totalAvailable + totalInEscrow + totalPending,
                totalRevenue,
                currency: 'ARS'
            },
            transactions: transactions.map((t: any) => ({
                id: t.id,
                status: t.status,
                amount: t.amount,
                buyerId: t.buyerId,
                sellerId: t.sellerId,
                createdAt: t.createdAt?.toDate?.()?.toISOString() || 'N/A'
            })),
            financialLogs: financialLogs.map((l: any) => ({
                id: l.id,
                type: l.type,
                amount: l.amount,
                transactionId: l.transactionId,
                timestamp: l.timestamp?.toDate?.()?.toISOString() || 'N/A'
            }))
        };

        // Download as JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, report: report.summary };
    } catch (error) {
        console.error("Error generating audit:", error);
        return { success: false, error };
    }
};

/**
 * Security Sync - Scan and fix data integrity issues
 */
export const runSecuritySync = async () => {
    try {
        const issues: string[] = [];
        let fixed = 0;

        // 1. Find stuck transactions (PAID_HELD for more than 7 days)
        const txSnap = await getDocs(collection(db, "transactions"));
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        for (const txDoc of txSnap.docs) {
            const tx = txDoc.data();

            // Check for stuck PAID_HELD
            if (tx.status === 'PAID_HELD' && tx.createdAt?.toDate) {
                const elapsed = now - tx.createdAt.toDate().getTime();
                if (elapsed > SEVEN_DAYS) {
                    issues.push(`TX ${txDoc.id.slice(0, 8)}: PAID_HELD hace ${Math.round(elapsed / (24 * 60 * 60 * 1000))} días`);
                }
            }

            // Check for stuck SHIPPED
            if (tx.status === 'SHIPPED' && tx.shippedAt?.toDate) {
                const elapsed = now - tx.shippedAt.toDate().getTime();
                if (elapsed > SEVEN_DAYS) {
                    issues.push(`TX ${txDoc.id.slice(0, 8)}: SHIPPED sin confirmar hace ${Math.round(elapsed / (24 * 60 * 60 * 1000))} días`);
                }
            }
        }

        // 2. Check for orphaned items (sellerId doesn't exist)
        const usersSnap = await getDocs(collection(db, "users"));
        const userIds = new Set(usersSnap.docs.map(d => d.id));

        const itemsSnap = await getDocs(collection(db, "items"));
        for (const itemDoc of itemsSnap.docs) {
            const item = itemDoc.data();
            if (item.sellerId && !userIds.has(item.sellerId)) {
                issues.push(`Item ${itemDoc.id.slice(0, 8)}: vendedor ${item.sellerId.slice(0, 8)} no existe`);
                // Auto-delete orphaned items
                await deleteDoc(itemDoc.ref);
                fixed++;
            }
        }

        // 3. Check for negative wallet balances
        for (const userDoc of usersSnap.docs) {
            const u = userDoc.data();
            if (u.wallet) {
                if ((u.wallet.available || 0) < 0) {
                    issues.push(`User ${userDoc.id.slice(0, 8)}: balance negativo $${u.wallet.available}`);
                    await updateDoc(userDoc.ref, { 'wallet.available': 0 });
                    fixed++;
                }
                if ((u.wallet.inEscrow || 0) < 0) {
                    issues.push(`User ${userDoc.id.slice(0, 8)}: escrow negativo $${u.wallet.inEscrow}`);
                    await updateDoc(userDoc.ref, { 'wallet.inEscrow': 0 });
                    fixed++;
                }
            }
        }

        // 4. Check for deleted users with active items
        for (const userDoc of usersSnap.docs) {
            const u = userDoc.data();
            if (u.deleted) {
                const userItemsSnap = await getDocs(query(collection(db, "items"), where("sellerId", "==", userDoc.id)));
                if (userItemsSnap.size > 0) {
                    issues.push(`User eliminado ${userDoc.id.slice(0, 8)} tiene ${userItemsSnap.size} items activos`);
                    for (const item of userItemsSnap.docs) {
                        await deleteDoc(item.ref);
                        fixed++;
                    }
                }
            }
        }

        console.log(`[SECURITY SYNC] Found ${issues.length} issues, auto-fixed ${fixed}`);
        return { success: true, issues, fixed, totalScanned: txSnap.size + itemsSnap.size + usersSnap.size };
    } catch (error) {
        console.error("Error in security sync:", error);
        return { success: false, error };
    }
};

/**
 * Suspend or Unsuspend a user
 */
export const suspendUser = async (uid: string, suspend: boolean) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            isSuspended: suspend,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error suspending user:", error);
        return { success: false, error };
    }
};

/**
 * Fetch recent transactions for Operations Table
 */
export const getRecentTransactions = async () => {
    try {
        const { query, orderBy, limit, collection, getDocs } = await import("firebase/firestore");
        const txRef = collection(db, "transactions");
        const q = query(txRef, orderBy("createdAt", "desc"), limit(100)); // Last 100 transactions
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching recent transactions:", error);
        return [];
    }
};

/**
 * Fetch monthly sales for reporting (Export CSV)
 */
export const fetchMonthlySales = async (month: string) => {
    try {
        const { query, orderBy, where, collection, getDocs } = await import("firebase/firestore");
        const txRef = collection(db, "transactions");
        const q = query(txRef, where("status", "==", "COMPLETED"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching monthly sales:", error);
        return [];
    }
};
/**
 * DEV TOOL: Hard Reset - Delete EVERYTHING except Admin accounts
 */
export const hardResetDatabase = async () => {
    try {
        const { writeBatch, collection, getDocs, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        let totalDeleted = 0;

        // 1. Delete all non-admin users and their subcollections
        const usersSnap = await getDocs(collection(db, "users"));
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            if (userData.role !== "admin") {
                // Delete user subcollections first
                const subCollections = ["reviews", "notifications", "following", "followers"];
                for (const sub of subCollections) {
                    const subSnap = await getDocs(collection(db, "users", userDoc.id, sub));
                    for (const subDoc of subSnap.docs) {
                        await deleteDoc(subDoc.ref);
                        totalDeleted++;
                    }
                }
                // Delete user doc
                await deleteDoc(userDoc.ref);
                totalDeleted++;
            }
        }

        // 2. Delete main collections
        const collectionsToClear = [
            "items", 
            "transactions", 
            "wallet_movements", 
            "withdrawals", 
            "financial_logs", 
            "reports", 
            "questions", 
            "reviews"
        ];

        for (const colName of collectionsToClear) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            
            // Delete in batches if there are many
            const batchSize = 450;
            let batch = writeBatch(db);
            let count = 0;

            for (const doc of snapshot.docs) {
                batch.delete(doc.ref);
                count++;
                totalDeleted++;

                if (count % batchSize === 0) {
                    await batch.commit();
                    batch = writeBatch(db);
                }
            }
            if (count % batchSize !== 0) {
                await batch.commit();
            }
        }

        // 3. Delete Chats and their messages
        const chatsSnap = await getDocs(collection(db, "chats"));
        for (const chatDoc of chatsSnap.docs) {
            const msgsSnap = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
            for (const m of msgsSnap.docs) {
                await deleteDoc(m.ref);
                totalDeleted++;
            }
            await deleteDoc(chatDoc.ref);
            totalDeleted++;
        }

        console.log(`[HARD RESET] Successfully deleted ${totalDeleted} documents.`);
        return { success: true, count: totalDeleted };
    } catch (error: any) {
        console.error("Error during hard reset:", error);
        return { success: false, error: error.message };
    }
};
