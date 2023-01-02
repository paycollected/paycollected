import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getUserInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function successfulPaymentResolver(setupIntentId, username) {
  let rows;
  let stripeCusId;
  let metadata;
  try {
    [{ customer: stripeCusId, metadata }, { rows }] = await Promise.all([
      stripe.setupIntents.retrieve(setupIntentId),
      getUserInfo(username)
    ]);
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows[0].stripeCusId !== stripeCusId) {
    throw new GraphQLError('SetupIntent does not belong to user', { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    planName, cycleFrequency, nextBillDate, personalCost,
    paymentMethod: {
      brand, expiryMonth, expiryYear, last4, id, default: isDefault
    }
  } = metadata;

  try {
    await stripe.setupIntents.cancel(setupIntentId);
    return {
      planName,
      personalCost: Number(personalCost),
      cycleFrequency,
      nextBillDate,
      paymentMethod: {
        id,
        brand,
        last4,
        expiryMonth: Number(expiryMonth),
        expiryYear: Number(expiryYear),
        default: JSON.parse(isDefault),
      }
    };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
