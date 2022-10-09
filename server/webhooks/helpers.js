import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

async function archiveOldPriceId(sPriceId) {
  if (sPriceId) {
    await stripe.prices.update(sPriceId, { active: false });
  }
};

// 1. query for old price ID, then archive old price ID (on stripe system) & save new price ID (our db)
export async function processPriceId(productId, newPriceId) {
  const { rows } = await models.getPriceId(productId);
  const { sPriceId } = rows[0];
  /* Both archiveOldPriceId and saveNewPriceId MUST occur AFTER getPriceId
  because archiveOldPriceId needs price Id obtained from getPriceId
  and saveNewPriceId will overwrite old priceId in db
  */
  await Promise.all([archiveOldPriceId(sPriceId), models.saveNewPriceId(newPriceId, productId)]);
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


// 2. save subscription details (our db),
// query all other existing users on this same plan (db)
// and update their subscriptions with new price (stripe system)
export async function processSubscriptions(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const { rows } = await models.updatePriceOnJoining(productId, quantity, subscriptionId, subscriptionItemId, username);
  if (rows.length > 0) {
    await Promise.all(rows.map((row) => updateStripePrice(row, newPriceId)));
  }
}
