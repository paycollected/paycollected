import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);


// 1. archive old price ID (on stripe system)
export async function archivePriceId(prevPriceId) {
  if (prevPriceId) {
    await stripe.prices.update(prevPriceId, { active: false });
  }
};


async function updateStripePrice(row, price) {
  const {
    username,
    subscriptionId,
    subscriptionItemId,
    quantity
  } = row;

  await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscriptionItemId,
          price,
          quantity
        }
      ],
      proration_behavior: 'none',
    }
  );
};


// 2. save new subscription details (our db),
// update product w/ new price ID (our db)
// query all other existing users on this same plan (db)
// and update their subscriptions with new price (stripe system)
export async function processQuantChange(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const { rows } = await models.updateOnQuantChange(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId);
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => updateStripePrice(row, newPriceId)));
  }
}
