import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import * as models from '../db/models.js';
import authResolverWrapper from './authResolverWrapper';
import createAccount from './users/createAccount';
import loginResolver from './users/login';
import startSubscription from './subscriptions/startSubscription';
import {
  unsubscribe as unsubscribeResolver, unsubscribeAsOwner as unsubscribeAsOwnerResolver
} from './subscriptions/unsubscribe.js';
import editQuantityResolver from './subscriptions/editQuantity';
import {
  viewOnePlan as viewOnePlanResolver,
  viewAllPlans as viewAllPlansResolver,
  activeMembers as activeMembersResolver,
} from './plans/view.js';
import createPlanResolver from './plans/create.js';
import deletePlanResolver from './plans/delete.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

const recurringInterval = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};

export default {
  Query: {
    viewOnePlan: authResolverWrapper(async (_, { planId }, { user: { username } }) => {
      return await viewOnePlanResolver(planId, username);
    }),

    viewAllPlans: authResolverWrapper(async (_, __, { user: { username } }) => {
      return await viewAllPlansResolver(username);
    }),
  },

  Plan: {
    activeMembers: authResolverWrapper(async ({ planId }, _, { user: { username } }) => {
      return await activeMembersResolver(planId, username);
    }),
  },

  Mutation: {
    createUser: async (_, { firstName, lastName, username, password, email }) => {
      return await createAccount(firstName, lastName, username, password, email);
    },

    login: async (_, { username, password }) => {
      return await loginResolver(username, password);
    },

    createPlan: authResolverWrapper(async (_, {
      planName, cycleFrequency, perCycleCost, startDate
    }, { user: { username } }) => {
      return await createPlanResolver(planName, cycleFrequency, perCycleCost, startDate, username);
    }),

    joinPlan: authResolverWrapper(async (_, { planId, quantity }, { user }) => {
      return await startSubscription(planId, quantity, user, recurringInterval);
    }),

    editPayment: authResolverWrapper(async (_, __, { user }) => {
        const { username, stripeCusId: customer } = user;
        try {
          /* still debating whether we should store stripeCusId in JWT since it's public */
          // const { rows } = await models.getUserInfo(username);
          // const { stripeCusId: customer } = rows[0];
          /*
          Note that we're skipping programmatically configure the session here
          and did that manually in Stripe dev portal.
          */
          const { url } = await stripe.billingPortal.sessions.create({
            customer,
            return_url: 'http://localhost:5647/dashboard/',
          });
          return { portalSessionURL: url };
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to get customer portal link');
        }
    }),

    unsubscribe: authResolverWrapper(
      async (_, { subscriptionId }, { user: { username } }) => {
        return await unsubscribeResolver(subscriptionId, username);
    }),

    unsubscribeAsOwner: authResolverWrapper(
      async (_, { subscriptionId, planId, newOwner }, { user: { username } }) => {
        return await unsubscribeAsOwnerResolver(subscriptionId, planId, username, newOwner);
      }),

    editQuantity: authResolverWrapper(
      async (_, { subscriptionId, newQuantity }, { user: { username } }) => {
        return await editQuantityResolver(subscriptionId, newQuantity, username, recurringInterval);
    }),

    deletePlan: authResolverWrapper(
      async (_, { planId }, { user: { username } }) => {
        return await deletePlanResolver(planId, username);
    }),
  }
};
