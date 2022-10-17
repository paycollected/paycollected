import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import {
  checkPlanOwner, delSubUpdatePlanOwner, checkNewOwner, checkSubOnPlan, deleteSubscription
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner
  try {
    const { rows } = await checkPlanOwner(subscriptionId, username);
    if (rows.length === 0) {
      // if signed-in user is not actually owner of this subscription, rows.length = 0
      throw new Error("Subscription doesn't belong to user");
    } else if (rows[0].planOwner) {
      // if signed-in user is plan owner of this plan, will return true
      // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
      throw new Error ('Wrong mutation call');
    }

    await Promise.all([
      stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true }}),
      // Mark this subscription for delete by webhook instead of at client-serving step here
      // because we don't want to trigger price recalculation and update for all members
      // if subscription cancellation is part of plan deletion by plan owner.
      // Alternative is to update metadata for this subscription before deleting it on stripe system here (2 API calls)
      // but that will double the number of API calls to use this same webhook event in user account deletion scenario.
      deleteSubscription(subscriptionId)]);
    // delete this subscription in our db
    return subscriptionId;
  }

  catch (e) {
    if (e.message === "Subscription doesn't belong to user" || e.message === 'Wrong mutation call') {
      throw new ForbiddenError(e.message);
    } else {
      console.log(e);
      throw new ApolloError('Cannot unsubscribe');
    }
  }
};


export async function unsubscribeAsOwner(subscriptionId, planId, username, newOwner) {
  try {
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
      stripe.subscriptions.update(subscriptionId, { metadata: { cancelSubs: true }})
      // mark this subscription for deletion by webhook
    ]);
    return subscriptionId;
  }

  catch (e) {
    if (e.message === "Subscription doesn't belong to user"
    || e.message === 'Wrong mutation call') {
      throw new ForbiddenError(e.message);
    } else if (e.message === 'New owner is not active member of this plan'
    || e.message === 'Incorrect subscription and plan combination'
    || e.message === 'Cannot transfer ownership to self') {
      throw new UserInputError(e.message);
    } else {
      console.log(e);
      throw new ApolloError('Cannot unsubscribe');
    }
  }
}
