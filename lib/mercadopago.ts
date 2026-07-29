// Mercado Pago integration service
// Using frontend SDK for test/demo purposes
// For production, move preference creation to backend (Cloud Function)

import { initMercadoPago } from '@mercadopago/sdk-react';

// Initialize Mercado Pago with test public key
const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

if (publicKey) {
    initMercadoPago(publicKey);
}

export interface PaymentPreferenceData {
    transactionId: string;
    itemTitle: string;
    itemPrice: number;
    platformFee: number;
    total: number;
}

// Create payment preference
export const createPaymentPreference = async (data: PaymentPreferenceData) => {
    try {
        const preference = {
            items: [
                {
                    id: data.transactionId,
                    title: data.itemTitle,
                    description: `Compra protegida con escrow - Vendelo Hoy!`,
                    quantity: 1,
                    unit_price: data.total,
                    currency_id: 'ARS'
                }
            ],
            back_urls: {
                success: `${window.location.origin}/payment/success`,
                failure: `${window.location.origin}/payment/failure`,
                pending: `${window.location.origin}/payment/pending`
            },
            auto_return: 'approved',
            external_reference: data.transactionId,
            statement_descriptor: 'VENDELO HOY',
            notification_url: undefined, // For production: add webhook URL
            metadata: {
                transaction_id: data.transactionId,
                platform_fee: data.platformFee,
                item_price: data.itemPrice
            }
        };

        // Call MP API to create preference
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicKey}` // Note: In production, use Access Token from backend
            },
            body: JSON.stringify(preference)
        });

        if (!response.ok) {
            throw new Error('Error creating payment preference');
        }

        const result = await response.json();
        return {
            success: true,
            preferenceId: result.id,
            initPoint: result.init_point, // URL to redirect user
            sandboxInitPoint: result.sandbox_init_point // URL for test mode
        };
    } catch (error) {
        console.error('Error creating MP preference:', error);
        return { success: false, error };
    }
};

// Get payment info (for verification)
export const getPaymentInfo = async (paymentId: string) => {
    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${publicKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Error fetching payment info');
        }

        const payment = await response.json();
        return {
            success: true,
            status: payment.status,
            statusDetail: payment.status_detail,
            transactionAmount: payment.transaction_amount,
            externalReference: payment.external_reference
        };
    } catch (error) {
        console.error('Error fetching payment info:', error);
        return { success: false, error };
    }
};
