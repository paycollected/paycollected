import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { delPendingSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function cancelTransactionResolver(subscriptionId, username) {
  let rows;
  try {
    // ({ rows } = await delPendingSubs(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot cancel transaction');
  }

  if (rows.length === 0) {
    throw new ForbiddenError('User does not own this subscription');
  }

  try {
    await stripe.subscriptions.del(subscriptionId);
    return { subscriptionId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot cancel transaction');
  }
}
