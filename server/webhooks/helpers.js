import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as models from '../db/models.js';

dotenv.config();
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);


// archive old price ID (on stripe system)
async function archivePriceId(prevPriceId) {
  if (prevPriceId) {
    await stripe.prices.update(prevPriceId, { active: false });
  }
};


async function updateStripePrice(row, price, productTotalQuantity) {
  const {
    username,
    email,
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
      metadata: {
        productTotalQuantity,
      },
      proration_behavior: 'none',
    }
  );
};


// 2. save new subscription details (our db),
// update product w/ new price ID (our db)
// query all other existing users on this same plan (db)
// and update their subscriptions with new price (stripe system)
async function processQuantChange(
  productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId, productTotalQuantity,
  ) {
  const { rows } = await models.startSubscription(
    productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId
  );
  if (rows.length > 0) {
    await Promise.all(
      rows.map((row) => updateStripePrice(row, newPriceId, productTotalQuantity))
    );
  }
}


export async function handleSubscriptionStart(setupIntent) {
  const {
    subscriptionId, prevPriceId, newPriceId, subscriptionItemId, productId, username,
  } = setupIntent.metadata;
  const quantity = Number(setupIntent.metadata.quantity);
  const productTotalQuantity = Number(setupIntent.metadata.productTotalQuantity);
  try {
    // archivePriceId and processQuantChange don't depend on each other so we can await them simultaneously
    await Promise.all([
      archivePriceId(prevPriceId),
      processQuantChange(
        productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId, productTotalQuantity
      )
    ]);
  } catch (err) {
    console.log(err);
  };
}


export async function handleSubscriptionCancel(subscription) {
  // priceID --> archive that price
  // create a new price: need count of quantities, and total plan cost, frequency, product ID
  // --> update new price ID for product in db
  // query db for every subscription & item ID to update with new price ID + new totalQuantity (subtract cancelled from total)
  // delete this subscription from db
  const { id: subscriptionId, items } = subscription;
  const { price, quantity } = items.data[0];
  const { id: prevPriceId, product: productId } = price;
  const { cycleFrequency } = subscription.metadata;
  const productTotalQuantity = Number(subscription.metadata.productTotalQuantity);
  const perCycleCost = Number(subscription.metadata.perCycleCost);
  const newProductTotalQuantity = productTotalQuantity - quantity;

  try {
    const [{ id: newPriceId }, _] = await Promise.all([
      stripe.prices.create({
        currency: 'usd',
        product: productId,
        unit_amount: Math.ceil(perCycleCost / newProductTotalQuantity),
        recurring: {
          interval: cycleFrequency,
        },
      }),
      stripe.prices.update(prevPriceId, { active: false })
    ]);

    const { rows } = await models.updatePriceIdGetMembers(subscriptionId, newPriceId, productId);
    if (rows.length > 0) {
      await Promise.all(
        rows.map((row) => updateStripePrice(row, newPriceId, newProductTotalQuantity))
      );
    }

  } catch (err) {
    console.log(err);
  }
}


export async function handleSubscriptionQuantChange(subscription) {
  // need to know that this is for an incoming quantity change
  // query all existing users on plan and
  // adjust their price (need to know new priceId, which is the same as incoming event)
  // metadata: totalQuantity will be equal to this incoming event's totalQuantity
  const { id: subscriptionId, items, metadata } = subscription;


  if (JSON.parse(metadata.quantChanged)) {
    const productTotalQuantity = Number(metadata.productTotalQuantity);
    const { price, quantity } = items.data[0];
    const { id: priceId, product: productId } = price;

    try {
      const { rows } = await models.getMembersOnPlan(productId, subscriptionId);
      if (rows.length > 0) {
        await Promise.all([
          ...rows.map((row) => updateStripePrice(row, priceId, productTotalQuantity)),
          stripe.subscriptions.update(subscriptionId, { metadata: { quantChanged: false } })
        ]);
      }
    } catch (err) {
      console.log(err);
    }
  }
}
