import stripeSDK from 'stripe';
import { ApolloError, UserInputError, ForbiddenError } from 'apollo-server-core';
import { checkPlanOwnerUsingPlanIdGetOneSub, deletePlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function (planId, username) {
  let rows;
  try {
    ({ rows } = await checkPlanOwnerUsingPlanIdGetOneSub(planId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }

  const { ownerQuantity, subscriptionId } = rows[0];
  if (ownerQuantity === null) {
    throw new ForbiddenError('User is not owner of this plan');
  } else if (subscriptionId === null) {
    // case when plan was just created with no subscribers
    // --> just delete from db && archive on stripe
    try {
      await Promise.all([deletePlan(planId), stripe.products.update(planId, { active: false })]);
      return { planId };
    } catch (e) {
      console.log(e);
      throw new ApolloError('Cannot delete plan');
    }
  }

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
