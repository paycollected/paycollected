import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import { checkPlanOwner } from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner
  const { rows } = await checkPlanOwner(subscriptionId, username);
  console.log(rows);
  if (rows.length === 0) {
    // if signed-in user is not actually owner of this subscription, rows.length = 0
    throw new Error('Unauthorized request');
  } else if (rows[0].planOwner) {
    // if signed-in user is plan owner of this plan, will return true
    // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
    throw new Error ('Wrong mutation call');
  }
  return subscriptionId;
};
