import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { getPriceFromPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function deletePlanResolve(planId, username) {
  let rows;
  try {
    ({ rows } = await getPriceFromPlan(planId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }

  if (rows.length === 0) {
    throw new ForbiddenError('User not authorized to perform this action');
  }
  const { priceId } = rows[0];
  try {
    await stripe.prices.update(priceId, { active: false, metadata: { deletePlan: true } });
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }
}
