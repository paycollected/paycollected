import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

async function updateStripePrice(row, price) {
  const {
    username,
    subscriptionId,
    subscriptionItemId,
    quantity
  } = row;

  const subscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      metadata: { username },
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


export async function processSubscriptions(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const { rows } = await models.updatePriceOnJoining(productId, quantity, subscriptionId, subscriptionItemId, username);
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => updateStripePrice(row, newPriceId)));
  }
}