import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getUserInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function successfulPaymentResolver(setupIntentId, username) {
  let rows;
  let stripeCusId;
  // try {
  //   [{ customer: stripeCusId }, { rows }] = await Promise.all([
  //     stripe.setupIntents.retrieve(setupIntentId),
  //     getUserInfo(username)
  //   ]);
  // } catch (e) {
  //   console.log(e);
  //   throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  // }

  // if (rows[0].stripeCusId !== stripeCusId) {
  //   throw new GraphQLError('SetupIntent does not belong to user', { extensions: { code: 'FORBIDDEN' } });
  // }

  try {
    return {
      planName: 'Test Plan',
      personalCost: '$20.00',
      cycleFrequency: 'WEEKLY',
      nextBillDate: '2023-01-19',
      paymentMethod: {
        id: 'pm_1MHYR9AJ5Ik974ue8j633dfw',
        brand: 'visa',
        last4: '5967',
        expiryMonth: 11,
        expiryYear: 2024,
        default: true,
      }
    };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot cancel transaction', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
