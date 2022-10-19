import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import {
  getSubsItemIdAndProductInfo, updatePriceIdAndSubsQuant
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function (subscriptionId, newQuantity, username, recurringInterval) {
  // Step 1:
  // (1) check that requesting user does own subscription, also query corresponding subscription item id,
  // (2) create new stripe price ID, archive old price ID with Stripe
  // Step 2:
  // (1) call stripe API to edit quantity and price ID for this subscription,
  // subs metadata: update totalQuantity
  // and (2) edit quantity of this subscription in our db & update priceId

  // still need to perform check on quantity here to make sure conform to upper limit
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
  } else if (quantity === 0) {
    throw new ForbiddenError('Wrong mutation call');
    // have to call joinPlan mutation instead
  }

  const productTotalQuantity = count - quantity + newQuantity;

  try {
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
      // Any update in db related to this particular subscription MUST occur
      // in HTTP response w/ client as opposed to webhook because refetching queries
      // for UI display depends on db info.
      // If using webhook, client will fall out of sync and requires user refreshing browser for updates.
      // Alternative is, once client-side caching is figured out, return the mutated subscription and update client cache.
      // Only at this point can db update be moved to webhook.
      updatePriceIdAndSubsQuant(price, product, newQuantity, subscriptionId)
    ]);
    console.log(product);
    return { planId: product, quantity: newQuantity };
  }

  catch(e) {
    console.log(e);
    throw new ApolloError('Cannot update quantity');
  }
}
