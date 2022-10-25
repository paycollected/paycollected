import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(paymentMethodId, subscriptionId, user) {

}
