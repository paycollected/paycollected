import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import * as models from '../db/models.js';
import {
  unsubscribe as unsubscribeResolver, unsubscribeAsOwner as unsubscribeAsOwnerResolver
} from './subscriptions/unsubscribe.js';
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
    viewOnePlan: async (_, { planId }, { user, err }) => {
      if (user) {
        const { username } = user;
        let errMsg;
        try {
          const { rows } = await models.viewOnePlan(planId, username);
          if (rows.length === 0) { // no match
            errMsg = 'No plan matched search';
            throw new Error();
          }
          const result = { ...rows[0], planId };
          result.perCycleCost /= 100;
          return result;
        } catch (asyncError) {
          if (errMsg) {
            throw new ApolloError(errMsg);
            // will need to handle this error in front end
            // where the join page will send this query request
          }
          console.log(asyncError);
          throw new ApolloError('Unable to retrieve plan information');
        }
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    viewAllPlans: async (_, __, { user, err }) => {
      if (user) {
        const { username } = user;
        try {
          const { rows } = await models.viewAllPlans(username);
          rows.forEach((row) => {
            row.perCycleCost /= 100;
          });
          return rows;
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to retrieve plans information');
        }
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },
  },

  Plan: {
    activeMembers: async ({ planId }, _, { user, err }) => {
      if (user) {
        const { username } = user;
        try {
          const { rows } = await models.membersOnOnePlan(planId, username);
          return rows;
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to retrieve plan information');
        }
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },
  },

  Mutation: {
    createUser: async (_, {
      firstName, lastName, username, password, email
    }) => {
      let errMsg;
      username = username.trim().toLowerCase();
      email = email.trim().toLowerCase();
      try {
        const { rows } = await models.checkUser(username, email);
        // username and email do not exist -> create user
        if (rows.length === 0) {
          const [
            { id: stripeCusId },
            hashedPass
          ] = await Promise.all([
            stripe.customers.create({
              name: `${firstName} ${lastName}`,
              email
            }),
            bcrypt.hash(password, saltRounds)
          ]);

          await models.createUser(firstName, lastName, username, hashedPass, email, stripeCusId);
          const token = jwt.sign({
            // expires after 2 weeks
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14),
            // storing user's info in token so we can easily obtain it from context in any resolver
            user: {
              username,
              email,
              stripeCusId,
            }
          }, process.env.SECRET_KEY);
          return { username, email, token };
        // username or email exist --> return error
        } else if (rows[0].username === username) {
          errMsg = 'This username already exists';
          throw new Error();
        } else {
          errMsg = 'This email already exists';
          throw new Error();
        }
      } catch (asyncError) {
        /*
        Because this entire process depends on many async operations
        (2 database queries + 1 bcrypt here),
        this catch block will catch ALL errors from any of these async operations
        and throw a generic error message.
        According to Apollo docs, this should generate an error with code 'INTERNAL_SERVER_ERROR'.
        */

        // if this is an anticipated bad input error
        if (errMsg) {
          throw new UserInputError(errMsg);
        } else {
        // catch all from the rest of async operations
          console.log(asyncError);
          throw new ApolloError('Unable to create user');
        }
      }
    },

    login: async (_, { username, password }) => {
      let errMsg;
      username = username.trim().toLowerCase();
      try {
        const { rows } = await models.getUserInfo(username);
        // if username does not exist, throw error
        if (rows.length === 0) {
          errMsg = 'This username does not exist';
          throw new Error();
        }
        // if username exists but password doesn't match, return null
        const { password: savedPass, stripeCusId, email } = rows[0];
        const result = await bcrypt.compare(password, savedPass);
        if (!result) {
          return null;
        }

        // if password is correct, return a signed token so user can sign in
        const token = jwt.sign({
          // expires after 2 weeks
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14),
          user: {
            username,
            email,
            stripeCusId,
          }
        }, process.env.SECRET_KEY);

        return {
          username,
          email,
          token
        };
      } catch (asyncError) {
        if (errMsg) {
          // if anticipated bad input error
          throw new UserInputError(errMsg);
        } else {
          // catch all from rest of async
          console.log(asyncError);
          throw new ApolloError('Unable to log in');
        }
      }
    },

    createPlan: async (_, {
      planName, cycleFrequency, perCycleCost, startDate
    }, { user, err }) => {
      if (user) {
        const { username } = user;
        try {
          planName = planName.trim();
          cycleFrequency = cycleFrequency.toLowerCase();

          // create stripe product
          perCycleCost *= 100; // store in cents
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
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    joinPlan: async (_, { planId, quantity: newQuantity }, { user, err }) => {
      let errMsg;
      if (user) {
        const { username, email, stripeCusId } = user;
        try {
          // check that user is NOT already subscribed to plan
          const { rows } = await models.joinPlan(username, planId);
          const { cycleFrequency, perCycleCost, startDate, prevPriceId, quantity, count } = rows[0];
          if (quantity) {
            // if owner and haven't joined plan, quantity = 0
            // if not owner and haven't joined plan, quantity is null
            // front end will need to display a msg telling user to use 'adjust quantity' in dashboard instead
            errMsg = 'User is already subscribed to this plan';
            throw new Error();
          }
          let nextStartDate = new Date(startDate * 1000);
          const today = new Date();
          // adjust startDate to be in the future based on subscription frequency
          if (nextStartDate < today) {
            if (cycleFrequency === 'weekly') {
              const targetDay = nextStartDate.getDay();
              const todayDay = today.getDay();
              // find the next occurrence of the target day
              nextStartDate.setDate(today.getDate() + (((7 - todayDay) + targetDay) % 7));
            } else if (cycleFrequency === 'monthly') {
              const targetDate = nextStartDate.getDate();
              // if current date is past the target, then set target to next month
              if (today.getDate() >= targetDate) {
                nextStartDate.setMonth(today.getMonth() + 1);
                nextStartDate.setDate(targetDate);
                // otherwise set the date with the current month
              } else {
                nextStartDate.setDate(targetDate);
              }
            } else { // cycleFrequency === yearly
              // set to next year if current date is past the start date
              nextStartDate.setYear(today.getYear() + 1);
            }
            console.log('next start date: ', nextStartDate);
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

      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    editPayment: async (_, __, { user, err }) => {
      if (user) {
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

      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    unsubscribe: async (_, { subscriptionId }, { user, err }) => {
      if (user) {
        const { username } = user;
        return await unsubscribeResolver(subscriptionId, username);
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    unsubscribeAsOwner: async (_, { subscriptionId, planId, newOwner }, { user, err }) => {
      if (user) {
        const { username } = user;
        return await unsubscribeAsOwnerResolver(subscriptionId, planId, username, newOwner);
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    editQuantity: async (_, { subscriptionId, newQuantity }, { user, err }) => {
      if (user) {
        const { username } = user;
        return await editQuantityResolver(subscriptionId, newQuantity, username);
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    deletePlan: async (_, { planId }, { user, err }) => {
      if (user) {
        const { username } = user;
        return await deletePlanResolver(planId, username);
      } else if (err === 'Incorrect token' || err === 'Token has expired') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    }
  }
};
