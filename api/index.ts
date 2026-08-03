import type { VercelRequest, VercelResponse } from '@vercel/node';

import bumpItem from '../api-handlers/bump-item';
import cancelTransaction from '../api-handlers/cancel-transaction';
import confirmReceipt from '../api-handlers/confirm-receipt';
import deliveryWebhook from '../api-handlers/delivery-webhook';
import dispatchCourier from '../api-handlers/dispatch-courier';
import mercadopagoOauth from '../api-handlers/mercadopago-oauth';
import mercadopagoWebhook from '../api-handlers/mercadopago-webhook';
import mpPreference from '../api-handlers/mp-preference';
import processPayout from '../api-handlers/process-payout';
import releaseFunds from '../api-handlers/release-funds';
import shippingQuote from '../api-handlers/shipping-quote';
import sitemap from '../api-handlers/sitemap';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const endpoint = req.query.endpoint as string;
    
    switch (endpoint) {
        case 'bump-item': return bumpItem(req, res);
        case 'cancel-transaction': return cancelTransaction(req, res);
        case 'confirm-receipt': return confirmReceipt(req, res);
        case 'delivery-webhook': return deliveryWebhook(req, res);
        case 'dispatch-courier': return dispatchCourier(req, res);
        case 'mercadopago-oauth': return mercadopagoOauth(req, res);
        case 'mercadopago-webhook': return mercadopagoWebhook(req, res);
        case 'mp-preference': return mpPreference(req, res);
        case 'process-payout': return processPayout(req, res);
        case 'release-funds': return releaseFunds(req, res);
        case 'shipping-quote': return shippingQuote(req, res);
        case 'sitemap': return sitemap(req, res);
        default: return res.status(404).json({ error: 'Endpoint not found: ' + endpoint });
    }
}
