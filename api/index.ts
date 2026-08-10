import type { VercelRequest, VercelResponse } from '@vercel/node';

import adminRefund from '../api-handlers/admin-refund';
import bumpItem from '../api-handlers/bump-item';
import cancelTransaction from '../api-handlers/cancel-transaction';
import confirmReceipt from '../api-handlers/confirm-receipt';
import confirmReturnReceipt from '../api-handlers/confirm-return-receipt';
import deliveryWebhook from '../api-handlers/delivery-webhook';
import dispatchCourier from '../api-handlers/dispatch-courier';
import mercadopagoOauth from '../api-handlers/mercadopago-oauth';
import mercadopagoWebhook from '../api-handlers/mercadopago-webhook';
import mpPreference from '../api-handlers/mp-preference';
import processPayout from '../api-handlers/process-payout';
import releaseFunds from '../api-handlers/release-funds';
import requestCourier from '../api-handlers/request-courier';
import shippingQuote from '../api-handlers/shipping-quote';
import sitemap from '../api-handlers/sitemap';
import submitReview from '../api-handlers/submit-review';
import syncAdminClaim from '../api-handlers/sync-admin-claim';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const endpoint = req.query.endpoint as string;
    
    switch (endpoint) {
        case 'admin-refund': return adminRefund(req, res);
        case 'bump-item': return bumpItem(req, res);
        case 'cancel-transaction': return cancelTransaction(req, res);
        case 'confirm-receipt': return confirmReceipt(req, res);
        case 'confirm-return-receipt': return confirmReturnReceipt(req, res);
        case 'delivery-webhook': return deliveryWebhook(req, res);
        case 'dispatch-courier': return dispatchCourier(req, res);
        case 'mercadopago-oauth': return mercadopagoOauth(req, res);
        case 'mercadopago-webhook': return mercadopagoWebhook(req, res);
        case 'mp-preference': return mpPreference(req, res);
        case 'process-payout': return processPayout(req, res);
        case 'release-funds': return releaseFunds(req, res);
        case 'request-courier': return requestCourier(req, res);
        case 'shipping-quote': return shippingQuote(req, res);
        case 'sitemap': return sitemap(req, res);
        case 'submit-review': return submitReview(req, res);
        case 'sync-admin-claim': return syncAdminClaim(req, res);
        default: return res.status(404).json({ error: 'Endpoint not found: ' + endpoint });
    }
}
