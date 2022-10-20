import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import {
  checkPlanOwnerUsingSubsId, delSubUpdatePlanOwner, checkNewOwner, checkSubOnPlan, deleteSubscription
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner
  let rows;
  try {
    ({ rows } = await checkPlanOwnerUsingSubsId(subscriptionId, username));
  } catch(e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }

  if (rows.length === 0) {
    // if signed-in user is not actually owner of this subscription, rows.length = 0
    throw new ForbiddenError("Subscription doesn't belong to user");
  } else if (rows[0].planOwner) {
    // if signed-in user is plan owner of this plan, will return true
    // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
    throw new ForbiddenError('Wrong mutation call');
  }

  try {
    await stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true }});
    const { planId } = rows[0];
    return { planId };
  } catch(e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }
};


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  if (username === newOwner) {
    // check that this user is not trying to transfer plan ownership to him/herself
    throw new UserInputError('Cannot transfer ownership to self');
  }

  let prevOwnerRows, newOwnerRows, planSubRows;
  try {
    [
      { rows: prevOwnerRows },
      { rows: newOwnerRows },
      { rows: planSubRows }
    ] = await Promise.all([
      checkPlanOwnerUsingSubsId(subscriptionId, username),
      // check that this user owns this subscription, and they are indeed owner of this plan
      checkNewOwner(newOwner, planId),
      // check that the declared new owner is already a member on the plan
      checkSubOnPlan(planId, subscriptionId)
      // check that the planId and subscriptionId combo is valid
    ]);
  } catch (e) {
    console.log('Failure to perform check', e);
    throw new ApolloError('Cannot unsubscribe');
  }

  switch(true) {
    case (prevOwnerRows.length === 0):
      throw new ForbiddenError("Subscription doesn't belong to user");
    case (!prevOwnerRows[0].planOwner):
      // have to call unsubscribe instead of this function
      throw new ForbiddenError('Wrong mutation call');
    case (planSubRows.length === 0):
      throw new UserInputError('Incorrect subscription and plan combination');
    case (newOwnerRows.length === 0):
      throw new UserInputError('New owner is not active member of this plan');
    default:
      break;
  }

  try {
    await Promise.all([
      delSubUpdatePlanOwner(newOwner, planId, subscriptionId),
      // delete this subscription in our db & update plan with new owner in db
      stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true }})
      // mark this subscription for deletion by webhook
    ]);
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }
}
