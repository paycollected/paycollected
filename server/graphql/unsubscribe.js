import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import { checkPlanOwner, updatePlanOwner, checkNewOwner } from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner

  const { rows } = await checkPlanOwner(subscriptionId, username);
  if (rows.length === 0) {
    // if signed-in user is not actually owner of this subscription, rows.length = 0
    throw new Error('Unauthorized request');
  } else if (rows[0].planOwner) {
    // if signed-in user is plan owner of this plan, will return true
    // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
    throw new Error ('Wrong mutation call');
  }
    await stripe.subscriptions.del(subscriptionId);
    return subscriptionId;
};


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  if (username === newOwner) {
    // check that this user is not trying to transfer plan ownership to him/herself
    throw new Error('Cannot transfer ownership to self');
  }

  const [
    { rows: prevOwnerRows },
    { rows: newOwnerRows }
  ] = await Promise.all([
    checkPlanOwner(subscriptionId, username),
    checkNewOwner(newOwner, planId)
  ]);

  if (prevOwnerRows.length === 0) {
    throw new Error('Unauthorized request');
  } else if (!prevOwnerRows[0].planOwner) {
    throw new Error ('Wrong mutation call');
  } else if (newOwnerRows.length === 0) {
    // also check that the declared new owner is already a member on the plan
    throw new Error ('New owner is not active member of this plan');
  }

  await Promise.all([updatePlanOwner(newOwner, planId), stripe.subscriptions.del(subscriptionId)]);
  return subscriptionId;
}
