import stripeSDK from 'stripe';
import { getExpiredPendingSubs } from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function() {
  const { rows } = await getExpiredPendingSubs();
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => stripe.subscriptions.del(row.subscriptionId)));
  }
}
