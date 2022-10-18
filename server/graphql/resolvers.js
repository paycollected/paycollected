import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import { isFuture } from 'date-fns';
import * as models from '../db/models.js';
import authResolverWrapper from './authResolverWrapper';
import createAccount from './users/createAccount';
import loginResolver from './users/login';
import {
  unsubscribe as unsubscribeResolver, unsubscribeAsOwner as unsubscribeAsOwnerResolver
} from './subscriptions/unsubscribe.js';
import {
  viewOnePlan as viewOnePlanResolver,
  viewAllPlans as viewAllPlansResolver,
  activeMembers as activeMembersResolver,
} from './plans/view.js';
import editQuantityResolver from './subscriptions/editQuantity';
import deletePlanResolver from './plans/delete.js';

const saltRounds = 10;
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
      planName = planName.trim();
      cycleFrequency = cycleFrequency.toLowerCase();
      perCycleCost *= 100; // store in cents

      try {
        // create stripe product
        const { id: productId } = await stripe.products.create({
          name: planName
        });

        await models.addPlan(
          username,
          planName,
          cycleFrequency,
          perCycleCost,
          productId,
          startDate
        );

        return { productId };
      } catch (asyncError) {
        console.log(asyncError);
        throw new ApolloError('Unable to create new plan');
      }
    }),

    joinPlan: authResolverWrapper(async (_, { planId, quantity: newQuantity }, { user }) => {
      let errMsg;
      const { username, email, stripeCusId } = user;
      try {
        // check that user is NOT already subscribed to plan
        const { rows } = await models.joinPlan(username, planId);
        const { cycleFrequency, perCycleCost, startDate, prevPriceId, quantity, count } = rows[0];
        if (quantity > 0) {
          // front end will need to display a msg telling user to use 'adjust quantity' in dashboard instead
          errMsg = 'User is already subscribed to this plan';
          throw new Error();
        }

        let nextStartDate = Number(startDate);
        if (!isFuture(nextStartDate * 1000)) {
          // TO-DO!! adjust nextStartDate here

        }

        // create a stripe price ID
        const { id: priceId } = await stripe.prices.create({
          currency: 'usd',
          product: planId,
          unit_amount: Math.ceil(perCycleCost / (count + newQuantity)),
          recurring: {
            interval: recurringInterval[cycleFrequency],
            // could consider allowing customers to do interval count in the future?
          },
        });

        // create a Stripe subscription
        const { id: subscriptionId, items, pending_setup_intent } = await stripe.subscriptions.create({
          customer: stripeCusId,
          items: [{
            price: priceId,
            quantity: newQuantity,
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: {
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['link', 'card'],
          },
          proration_behavior: 'none',
          trial_end: nextStartDate,
          expand: ['pending_setup_intent'],
          metadata: {
            productTotalQuantity: count + newQuantity,
            cycleFrequency: recurringInterval[cycleFrequency],
            perCycleCost,
            quantChanged: false,
            cancelSubs: false,
            deletePlan: false,
          }
        });

        const { id: setupIntentId, client_secret: clientSecret } = pending_setup_intent;
        const { id: subscriptionItemId } = items.data[0];

        // storing information needed for webhook in metadata for setupIntent so we don't have to query db too often later
        await stripe.setupIntents.update(
          setupIntentId,
          {
            metadata: {
              prevPriceId,
              newPriceId: priceId,
              subscriptionId,
              subscriptionItemId,
              username,
              productId: planId,
              quantity: newQuantity,
              productTotalQuantity: count + newQuantity,
            }
          }
        );
        return { clientSecret, email };

      } catch (asyncError) {
        if (errMsg) {
          throw new ForbiddenError(errMsg);
        }
        console.log(asyncError);
        throw new ApolloError('Unable to create subscription');
      }
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

    unsubscribe: authResolverWrapper(async (_, { subscriptionId }, { user: { username } }) => {
      return await unsubscribeResolver(subscriptionId, username);
    }),

    unsubscribeAsOwner: authResolverWrapper(async (_, { subscriptionId, planId, newOwner }, { user: { username } }) => {
      return await unsubscribeAsOwnerResolver(subscriptionId, planId, username, newOwner);
    }),

    editQuantity: authResolverWrapper(async (_, { subscriptionId, newQuantity }, { user: { username } }) => {
      return await editQuantityResolver(subscriptionId, newQuantity, username);
    }),

    deletePlan: authResolverWrapper(async (_, { planId }, { user: { username } }) => {
      return await deletePlanResolver(planId, username);
    }),
  }
};
