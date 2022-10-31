import stripeSDK from 'stripe';
import * as models from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

// update all other active members' subscriptions
// will potentially email members re: change later
async function updateStripePrice(row, price, productTotalQuantity) {
  const {
    username,
    email,
    subscriptionId,
    subscriptionItemId,
    quantity
  } = row;

  if (subscriptionId) {
    // will be null if owner and not active member of plan
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
        metadata: { productTotalQuantity },
        proration_behavior: 'none',
      }
    );
  }
}


export async function handleSubscriptionCancel(subscription) {
  const { id: subscriptionId, items } = subscription;
  const { price, quantity } = items.data[0];
  const { id: prevPriceId, product: productId } = price;
  const { cycleFrequency, newOwner } = subscription.metadata;
  const productTotalQuantity = Number(subscription.metadata.productTotalQuantity);
  const perCycleCost = Number(subscription.metadata.perCycleCost);
  const newProductTotalQuantity = productTotalQuantity - quantity;

  try {
    if (newProductTotalQuantity > 0) {
      // if there are still active members even after this person has dropped out
      const [{ id: newPriceId }, _, __] = await Promise.all([
        stripe.prices.create({
          currency: 'usd',
          product: productId,
          unit_amount: Math.ceil(perCycleCost / newProductTotalQuantity),
          recurring: { interval: cycleFrequency },
          metadata: { deletePlan: false },
        }),
        stripe.prices.update(prevPriceId, { active: false }),
        stripe.subscriptions.del(subscriptionId)
      ]);

      let rows;
      if (!newOwner) {
        ({ rows } = await models.updatePriceIdDelSubsGetMembers(
          newPriceId,
          productId,
          subscriptionId
        ));
      } else {
        ({ rows } = await models.updatePriceOwnerDelSubsGetMembers(
          newPriceId,
          productId,
          subscriptionId,
          newOwner
        ));
      }

      if (rows.length > 0) {
        await Promise.all(
          rows.map((row) => updateStripePrice(row, newPriceId, newProductTotalQuantity))
        );
      }
    } else {
      // this is the last active member on plan, there is still a plan owner with quant 0 remaining
      await Promise.all([
        models.deleteSubscription(subscriptionId),
        stripe.subscriptions.del(subscriptionId)
        // we don't archive the price ID here in case more people will be joining in the future
        // which will archive the old price ID in db then
        // or if owner decide to delete plan, price ID is also archived then
      ]);
    }
  } catch (err) {
    console.log(err);
  }
}


async function cancelSubsAndNotify(row) {
  const {
    firstName,
    email,
    subscriptionId,
  } = row;

  if (subscriptionId) {
    await stripe.subscriptions.del(subscriptionId);
  }
}


export async function handlePlanDelete(price) {
  // archive product

  const { product: productId } = price;

  try {
    const [{ rows }, _] = await Promise.all([
      models.deletePlanGetAllSubs(productId),
      // cancel subscriptions for ALL members on plan
      // delete product in db
      stripe.products.update(productId, { active: false })
      // archive product
    ]);

    if (rows.length > 0) {
      await Promise.all(rows.map((row) => cancelSubsAndNotify(row)));
    }
  } catch (e) {
    console.log(e);
  }
}
