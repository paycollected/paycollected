import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import {
  checkPlanOwnerUsingSubsId, checkPlanOwnerForCancel
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner
  let rows;
  try {
    ({ rows } = await checkPlanOwnerUsingSubsId(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }

  if (rows.length === 0) {
    throw new ForbiddenError('User not authorized to perform this action');
  }

  try {
    await stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true } });
    const { planId } = rows[0];
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }
};


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  if (username === newOwner) {
    // check that this user is not trying to transfer plan ownership to him/herself
    throw new UserInputError('User not authorized to perform this action');
  }

  let rows;
  try {
    ({ rows } = await checkPlanOwnerForCancel(username, planId, subscriptionId, newOwner));
    // checking that all inputs are valid combinations
  } catch (e) {
    console.log('Failure to perform check', e);
    throw new ApolloError('Cannot unsubscribe');
  }
  if (rows.length !== 2) {
    throw new ForbiddenError('User not authorized to perform this action');
  }

  try {
    await Promise.all([
      stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true, newOwner } })
      // mark this subscription for deletion by webhook
    ]);
    return { planId };
  } catch (e) {
    console.log(e);
    throw new ApolloError('Cannot unsubscribe');
  }
}
