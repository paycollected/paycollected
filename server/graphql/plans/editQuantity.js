import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import {
  getSubsItemId
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function (subscriptionId, newQuantity, username) {
  // Step 1:
  // (1) check that requesting user does own subscription, also query corresponding subscription item id,
  // (2) create new stripe price ID
  // Step 2:
  // (1) call stripe API to edit quantity and price ID for this subscription,
  // subs metadata: update totalQuantity
  // and (2) edit quantity of this subscription in our db
  // Webhook:
  // need to know that this is for an incoming quantity change
  // archive old price ID with Stripe
  // query all existing users on plan and
  // adjust their price (need to know new priceId, which is the same as incoming event)
  // metadata: totalQuantity will be equal to this incoming event's totalQuantity
  const { rows } = await getSubsItemId(subscriptionId, username);
  if (rows.length === 0) {
    throw new Error("Subscription doesn't belong to user");
  }

  const { subscriptionItemId } = rows[0];
  const { id: priceId } = await stripe.prices.create({
    currency: 'usd',
    product: planId,
    unit_amount: Math.ceil(perCycleCost / (count + newQuantity)),
    recurring: {
      interval: recurringInterval[cycleFrequency],
      // could consider allowing customers to do interval count in the future?
    },
  });
}
