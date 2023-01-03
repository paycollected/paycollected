import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getUserInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function managePaymentResolver(username) {
  try {
    const { rows: [{ stripeCusId }] } = await getUserInfo(username);
    const { url } = await stripe.billingPortal.sessions.create({
      customer: stripeCusId,
      return_url: `${process.env.HOST}/dashboard/`,
    });
    return { portalSessionURL: url };
  } catch (asyncError) {
    console.log(asyncError);
    throw new GraphQLError('Unable to get customer portal link', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
}
