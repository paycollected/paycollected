import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { getUserInfo, planReturnAfterSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(
  paymentMethodId,
  setupIntentId,
  username
) {
  let paymentMethodCustomer;
  let setupIntentCustomer;
  let rows;
  let planId;
  let quantity;
  try {
    [
      { customer: paymentMethodCustomer },
      { customer: setupIntentCustomer, metadata: { quantity, planId } },
      { rows }
    ] = await Promise.all([
      stripe.paymentMethods.retrieve(paymentMethodId),
      stripe.setupIntents.retrieve(setupIntentId),
      getUserInfo(username)
    ]);
  } catch (e) {
    console.log(e);
    throw new ApolloError('Unable to cancel transaction');
  }

  if (rows[0].stripeCusId !== paymentMethodCustomer
    || rows[0].stripeCusId !== setupIntentCustomer) {
    throw ForbiddenError('User not authorized to perform this action');
  }

  try {
    const [{ rows: resultRows }, _] = await Promise.all([
      planReturnAfterSubs(planId, quantity),
      stripe.setupIntents.confirm(setupIntentId, { payment_method: paymentMethodId })
    ]);

    return resultRows[0];
  } catch (e) {
    console.log(e);
    throw new ApolloError('Unable to cancel transaction');
  }
}
