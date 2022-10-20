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

  const { ownerQuant, ownerSubsId, priceId, memberSubsId } = rows[0];
  if (ownerQuant === null) {
    throw new ForbiddenError('User is not owner of this plan');
  } else if (priceId === null) {
    // plan have never been used and therefore does not have a price ID
    // --> delete from both db & stripe
    try {
      console.log('aaaaa');
      await Promise.all([deletePlan(planId), stripe.products.del(planId)]);
      return { planId };
    } catch (e) {
      console.log(e);
      throw new ApolloError('Cannot delete plan');
    }
  } else if (memberSubsId === null) {
    try {
      if (!ownerSubsId) {
        // nobody is currently active on plan, but plan has been used in the past
        console.log('--------------------> bbbbb');
        await Promise.all([
          deletePlan(planId),
          stripe.products.update(planId, { active: false })]);
      } else {
      // owner is the only active member on plan
        console.log('--------------------> cccc');
        await Promise.all([
          deletePlan(planId),
          stripe.products.update(planId, { active: false }),
          stripe.subscriptions.del(ownerSubsId)
        ]);
      }
      return { planId };
    } catch (e) {
      console.log(e);
      throw new ApolloError('Cannot delete plan');
    }
  }

  // there are other active members on plan, including or not including owner
  try {
    console.log('--------------------> dddddd');
    await stripe.subscriptions.update(
      memberSubsId,
      { metadata: { deletePlan: true } }
    );
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot delete plan');
  }
}
