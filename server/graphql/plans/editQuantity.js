import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import {
  getSubsItemIdAndProductInfo, updatePriceIdAndSubsQuant
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
const recurringInterval = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};

export default async function (subscriptionId, newQuantity, username) {
  // Step 1:
  // (1) check that requesting user does own subscription, also query corresponding subscription item id,
  // (2) create new stripe price ID, archive old price ID with Stripe
  // Step 2:
  // (1) call stripe API to edit quantity and price ID for this subscription,
  // subs metadata: update totalQuantity
  // and (2) edit quantity of this subscription in our db & update priceId
  const { rows } = await getSubsItemIdAndProductInfo(subscriptionId, username);
  if (rows.length === 0) {
    throw new Error("Subscription doesn't belong to user");
  }

  const {
    product, subscriptionItemId, cycleFrequency, perCycleCost, count, quantity, prevPriceId
  } = rows[0];

  if (quantity === newQuantity) {
    throw new Error('No change in quantity');
  }

  const productTotalQuantity = count - quantity + newQuantity;

  const [{ id: price }, _] = await Promise.all([
    stripe.prices.create({
      currency: 'usd',
      product,
      unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
      recurring: {
        interval: recurringInterval[cycleFrequency],
      },
    }),
    stripe.prices.update(prevPriceId, { active: false })
  ]);

  await Promise.all([
    stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price,
            quantity: newQuantity,
          }
        ],
        metadata: {
          productTotalQuantity,
          quantChanged: true,
        },
        proration_behavior: 'none',
      }
    ),
    // any update in db related to this particular subscription MUST occur
    // in HTTP response w/ client as opposed to webhook because refetching queries
    // for UI display depends on db info
    // if using webhook, client will fall out of sync and requires user refreshing browser for updates
    updatePriceIdAndSubsQuant(price, product, newQuantity, subscriptionId)
  ]);

  return subscriptionId;
}
