import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getPriceFromPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function deletePlanResolver(planId, username) {
  let rows;
  try {
    ({ rows } = await getPriceFromPlan(planId, username));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to delete plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError('User not authorized to perform this action', { extensions: { code: 'FORBIDDEN' } });
  }
  const { priceId } = rows[0];
  try {
    await stripe.prices.update(priceId, { active: false, metadata: { deletePlan: true } });
    return { planId };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Unable to delete plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
