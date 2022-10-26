import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { getUserInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function cancelTransactionResolver(setupIntentId, username) {
  let rows;
  let stripeCusId;
  try {
    [{ customer: stripeCusId }, { rows }] = await Promise.all([
      stripe.setupIntents.retrieve(setupIntentId),
      getUserInfo(username)
    ]);
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot cancel transaction');
  }

  if (rows[0].stripeCusId !== stripeCusId) {
    throw new ForbiddenError('User does not own this setupIntent');
  }

  try {
    await stripe.setupIntents.cancel(setupIntentId);
    return true;
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot cancel transaction');
  }
}
