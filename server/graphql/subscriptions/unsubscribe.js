import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { checkPlanOwnerUsingSubsId, checkPlanOwnerForCancel } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

// remember to set subscription quantity = 0 and active = false

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner

  // need perCycleCost, current price Id, product Id, product count, quantity of this subscription
  // current active members, cycleFrequency, past invoice or not
  let rows;
  try {
    ({ rows } = await checkPlanOwnerUsingSubsId(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    // user not owner of this subscription ID,
    // or he/she is plan owner - in which case cannot call this mutation
    throw new GraphQLError('User not authorized to perform this action', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    await stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true } });
    const { planId } = rows[0];
    return { planId };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  if (username === newOwner) {
    // check that this user is not trying to transfer plan ownership to him/herself
    throw new GraphQLError('Cannot transfer ownership to self', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  let rows;
  try {
    ({ rows } = await checkPlanOwnerForCancel(username, planId, subscriptionId, newOwner));
    // checking that all inputs are valid combinations
  } catch (e) {
    console.log('Failure to perform check', e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
  if (rows.length !== 2) {
    // user is not a member on the plan, not owner of the plan, or does not own this subscription ID
    // or new owner is not active member on plan
    throw new GraphQLError('User not authorized to perform this action', { extensions: { code: 'FORBIDDEN' } });
  }

  try {
    await Promise.all([
      stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true, newOwner } })
      // mark this subscription for deletion by webhook
    ]);
    return { planId };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
