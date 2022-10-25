import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';
import { getUserInfo } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(
  paymentMethodId,
  setupIntentId,
  username
) {
  let paymentMethodCustomer;
  let setupIntentCustomer;
  let rows;
  try {
    [
      { customer: paymentMethodCustomer },
      { customer: setupIntentCustomer },
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
  console.log(username);
  console.log(rows);

  if (rows[0].stripeCusId !== paymentMethodCustomer
    || rows[0].stripeCusId !== setupIntentCustomer) {
    throw ForbiddenError('User not authorized to perform this action');
  }

  try {
    await stripe.setupIntents.confirm(setupIntentId, { payment_method: paymentMethodId });
    return true;
  } catch (e) {
    console.log(e);
    throw new ApolloError('Unable to cancel transaction');
  }
}
