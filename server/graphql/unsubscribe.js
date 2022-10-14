import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import {
  checkPlanOwner, delSubUpdatePlanOwner, checkNewOwner, checkSubOnPlan, deleteSubscription
} from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner

  const { rows } = await checkPlanOwner(subscriptionId, username);
  if (rows.length === 0) {
    // if signed-in user is not actually owner of this subscription, rows.length = 0
    throw new Error("Subscription doesn't belong to user");
  } else if (rows[0].planOwner) {
    // if signed-in user is plan owner of this plan, will return true
    // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
    throw new Error ('Wrong mutation call');
  }
    await Promise.all([stripe.subscriptions.del(subscriptionId), deleteSubscription(subscriptionId)]);
    // delete this subscription in both Stripe system and in our db
    return subscriptionId;
};


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  if (username === newOwner) {
    // check that this user is not trying to transfer plan ownership to him/herself
    throw new Error('Cannot transfer ownership to self');
  }

  const [
    { rows: prevOwnerRows },
    { rows: newOwnerRows },
    { rows: planSubRows }
  ] = await Promise.all([
    checkPlanOwner(subscriptionId, username),
    // check that this user owns this subscription, and they are indeed owner of this plan
    checkNewOwner(newOwner, planId),
    // check that the declared new owner is already a member on the plan
    checkSubOnPlan(planId, subscriptionId)
    // check that the planId and subscriptionId combo is valid
  ]);

  if (prevOwnerRows.length === 0) {
    throw new Error ("Subscription doesn't belong to user");
  } else if (!prevOwnerRows[0].planOwner) {
    // have to call unsubscribe instead of this function
    throw new Error ('Wrong mutation call');
  } else if (planSubRows.length === 0) {
    throw new Error ('Incorrect subscription and plan combination');
  } else if (newOwnerRows.length === 0) {
    throw new Error ('New owner is not active member of this plan');
  }

  await Promise.all([
    delSubUpdatePlanOwner(newOwner, planId, subscriptionId),
    // delete this subscription in our db & update plan with new owner in db
    stripe.subscriptions.del(subscriptionId)
    // delete this subscription in Stripe system
  ]);
  return subscriptionId;
}
