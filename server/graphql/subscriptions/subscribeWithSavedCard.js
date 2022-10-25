import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(paymentMethodId, subscriptionId, user) {
  try {
    await stripe.subscriptions.update(subscriptionId, { default_payment_method: paymentMethodId });
    return true;
  } catch (e) {
    console.log(e);
  }
}
