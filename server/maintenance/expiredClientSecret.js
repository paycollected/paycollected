import stripeSDK from 'stripe';
import { getExpiredPendingSubs } from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

async function deleteExpiredSubsArchivePrice(row) {
  const { subscriptionId, priceId } = row;
  await Promise.all([
    stripe.subscriptions.del(subscriptionId),
    stripe.prices.update(priceId, { active: false })
  ]);
}

export default async function() {
  const { rows } = await getExpiredPendingSubs();
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => deleteExpiredSubsArchivePrice(row)));
  }
}
