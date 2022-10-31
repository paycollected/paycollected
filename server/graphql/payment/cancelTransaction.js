import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
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
    throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows[0].stripeCusId !== stripeCusId) {
    throw new GraphQLError('User not authorized to perform this action', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    await stripe.setupIntents.cancel(setupIntentId);
    return true;
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
