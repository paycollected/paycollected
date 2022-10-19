import stripeSDK from 'stripe';
import { ApolloError, UserInputError, ForbiddenError } from 'apollo-server-core';
import { checkPlanOwnerUsingPlanIdAndDelSub } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function (planId, username) {
  // still need to consider when quantity = 0 (owner)
  // when there are and aren't other members on plan
  let rows;
  try {
    ({ rows } = await checkPlanOwnerUsingPlanIdAndDelSub(planId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }

  if (rows.length === 0) {
    throw new ForbiddenError('User is not owner of this plan');
  }

  const { subscriptionId } = rows[0];
  try {
    await stripe.subscriptions.update(
      subscriptionId,
      { metadata: { deletePlan: true } }
    );
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }
}
