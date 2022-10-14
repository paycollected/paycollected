import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import {
  checkPlanOwner, delSubUpdatePlanOwner, checkNewOwner, checkSubOnPlan, deleteSubscription
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function () {

}
