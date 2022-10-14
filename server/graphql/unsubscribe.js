import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import { checkPlanOwner } as models from '../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

async function unsubscribe(subscriptionId, username) {
  // check that user calling this function is actually subscription owner
  // also check whether this user is planOwner
  let errMsg;
  try {
    const { rows } = await checkPlanOwner(subscriptionId, username);
    if (rows.length === 0) {
      // if signed-in user is not actually owner of this subscription, rows.length = 0
      errMsg = 'Unauthorized request';
      throw new Error();
    } else if (rows[0].planOwner) {
      // if signed-in user is plan owner of this plan, will return true
      // --> cannot call this function but have to call unsubscribeAsOwner to transfer ownership
      errMsg = 'Wrong mutation call';
      throw new Error();
    } else {
      console.log('I got to here');
      // await stripe.subscriptions.del(subscriptionId);
      return true;
    }
  } catch (asyncError) {
    if (errMsg) {
      throw new ForbiddenError(errMsg);
    } else {
      console.log(asyncError);
      throw new ApolloError('Cannot unsubscribe');
    }
  }
};
