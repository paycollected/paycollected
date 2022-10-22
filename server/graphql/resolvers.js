import stripeSDK from 'stripe';
import { ApolloError } from 'apollo-server-core';
import authResolverWrapper from './authResolverWrapper';
import { planIdScalar, subscriptionIdScalar, emailScalar, usernameScalar } from './customScalarTypes';
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
import cancelTransactionResolver from './payment/cancelTransaction';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

const recurringInterval = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};


export default {
  Username: usernameScalar,

  Email: emailScalar,

  PlanID: planIdScalar,

  SubscriptionID: subscriptionIdScalar,

  Query: {
    viewOnePlan: authResolverWrapper((_, { planId }, { user: { username } }) => (
      viewOnePlanResolver(planId, username)
    )),

    viewAllPlans: authResolverWrapper((_, __, { user: { username } }) => (
      viewAllPlansResolver(username)
    )),
  },

  Plan: {
    activeMembers: authResolverWrapper(({ planId }, _, { user: { username } }) => (
      activeMembersResolver(planId, username)
    )),
  },

  Mutation: {
    createUser: (_, {
      firstName, lastName, username, password, email
    }) => (
      createAccount(firstName, lastName, username, password, email)
    ),

    login: (_, { username, password }) => (loginResolver(username, password)),

    createPlan: authResolverWrapper((_, {
      planName, cycleFrequency, perCycleCost, startDate, timeZone
    }, { user: { username } }) => (
      createPlanResolver(
        planName,
        cycleFrequency,
        perCycleCost,
        startDate,
        timeZone,
        username,
        recurringInterval
      )
    )),

    joinPlan: authResolverWrapper((_, { planId, quantity }, { user }) => (
      startSubscription(planId, quantity, user, recurringInterval)
    )),

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

    unsubscribe: authResolverWrapper((_, { subscriptionId }, { user: { username } }) => (
      unsubscribeResolver(subscriptionId, username)
    )),

    unsubscribeAsOwner: authResolverWrapper(
      (_, { subscriptionId, planId, newOwner }, { user: { username } }) => (
        unsubscribeAsOwnerResolver(subscriptionId, planId, username, newOwner)
      )
    ),

    editQuantity: authResolverWrapper(
      (_, { subscriptionId, newQuantity }, { user: { username } }) => (
        editQuantityResolver(subscriptionId, newQuantity, username, recurringInterval)
      )
    ),

    deletePlan: authResolverWrapper(
      (_, { planId }, { user: { username } }) => (
        deletePlanResolver(planId, username)
      )
    ),

    cancelTransaction: authResolverWrapper(
      (_, { subscriptionId, }, { user: { username }}) => (
        cancelTransactionResolver(subscriptionId, username)
      )
    ),
  }
};
