import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { delPendingSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function cancelTransactionResolver(subscriptionId, username) {
  let rows;
  try {
    ({ rows } = await delPendingSubs(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot cancel transaction');
  }

  const { priceId } = rows[0];
  if (priceId) {
    try {
      await Promise.all([
        stripe.subscriptions.del(subscriptionId),
        stripe.prices.update(priceId, { active: false })
      ]);
      return { subscriptionId };
    } catch (e) {
      console.log(e);
      throw new ApolloError('Cannot cancel transaction');
    }
  } else {
    throw new ForbiddenError('User does not own this subscription');
  }
}
