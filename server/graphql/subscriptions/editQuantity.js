import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import { getSubsItemIdAndProductInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function editQuantityResolver(
  subscriptionId,
  newQuantity,
  username,
  recurringInterval
) {
  // plan owner with quant = 0 will not be able to call this mutation b/c they don't have
  // a preexisting subscriptionId
  // (1) check that requesting user does own subscription, also query for necessary data to:
  // (2) create new stripe price ID
  // (3) and update this subscription

  // Validating quantity input
  if (newQuantity > 6 || newQuantity <= 0) {
    // upper limit for our system
    throw new UserInputError('Invalid quantity');
  }

  let rows;
  try {
    ({ rows } = await getSubsItemIdAndProductInfo(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot update quantity');
  }

  if (rows.length === 0) {
    throw new ForbiddenError("Subscription doesn't belong to user");
  }

  const {
    product, subscriptionItemId, cycleFrequency, perCycleCost, count, quantity, prevPriceId
  } = rows[0];

  if (quantity === newQuantity) {
    throw new UserInputError('No change in quantity');
  }

  const productTotalQuantity = count - quantity + newQuantity;

  try {
    const { id: price } = await stripe.prices.create({
      currency: 'usd',
      product,
      unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
      recurring: {
        interval: recurringInterval[cycleFrequency],
      },
      metadata: { deletePlan: false },
    });

    await stripe.subscriptions.update(
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
          // update new total, also save webhook 1 trip to db
          quantChanged: true,
          // marker for event type
          prevPriceId,
          // store prevPriceId here to save webhook trip to db
        },
        proration_behavior: 'none',
      }
    );
    return { planId: product, quantity: newQuantity };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot update quantity');
  }
}
