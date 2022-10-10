import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);


// 1. archive old price ID (on stripe system) & save new price ID (our db)
export async function processPriceId(productId, prevPriceId, newPriceId) {
  if (prevPriceId) {
    await Promise.all([stripe.prices.update(prevPriceId, { active: false }), models.saveNewPriceId(newPriceId, productId)]);
    return;
  }
  await models.saveNewPriceId(newPriceId, productId);
  return;
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


// 2. save subscription details (our db),
// query all other existing users on this same plan (db)
// and update their subscriptions with new price (stripe system)
export async function processSubscriptions(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const { rows } = await models.updateOnQuantChange(productId, quantity, subscriptionId, subscriptionItemId, username);
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => updateStripePrice(row, newPriceId)));
  }
}
