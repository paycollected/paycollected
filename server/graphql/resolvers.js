import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, AuthenticationError, ForbiddenError
} from 'apollo-server-core';
import * as models from '../db/models.js';

const saltRounds = 10;
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

const recurringInterval = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};

export default {
  Query: {
    viewOnePlan: async (_, { planId }, { username, err }) => {
      if (username) {
        let errMsg;
        try {
          const { rows } = await models.viewOnePlan(planId);
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
      } else if (err === 'Incorrect token') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    viewAllPlans: async (_, __, { username, err }) => {
      if (username) {
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
      } else if (err === 'Incorrect token') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },
  },

  Plan: {
    activeMembers: async ({ planId }, _, { username, err }) => {
      if (username) {
        try {
          const { rows } = await models.membersOnOnePlan(planId);
          return rows;
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to retrieve plan information');
        }
      } else if (err === 'Incorrect token') {
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
          const hashedPass = await bcrypt.hash(password, saltRounds);
          await models.createUser(firstName, lastName, username, hashedPass, email);
          const token = jwt.sign({
            // expires after 2 weeks
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14),
            data: username
          }, process.env.SECRET_KEY);
          return {
            username,
            email,
            token
          };
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
        const { password: savedPass} = rows[0];
        const result = await bcrypt.compare(password, savedPass);
        if (!result) {
          return null;
        }

        // if password is correct, return a signed token so user can sign in
        const token = jwt.sign({
          // expires after 2 weeks
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14),
          data: username
        }, process.env.SECRET_KEY);

        const { rows: userInfoRows } = await models.getUserInfo(username);
        const { email } = userInfoRows[0];
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
      planName, cycleFrequency, perCycleCost, maxQuantity
    }, { username, err }) => {
      if (username) {
        try {
          planName = planName.trim();
          cycleFrequency = cycleFrequency.toLowerCase();
          // creates stripe product object
          const product = await stripe.products.create({
            name: planName
          });
          const { id: sProdId } = product;

          // creates stripe price object
          perCycleCost *= 100; // store in cents
          const perCyclePerPersonCost = Math.ceil(perCycleCost / maxQuantity); // in cents
          const price = await stripe.prices.create({
            product: sProdId,
            unit_amount: perCyclePerPersonCost,
            currency: 'usd',
            recurring: {
              interval: recurringInterval[cycleFrequency]
            },
          });
          const { id: sPriceId } = price;

          await models.addPlan(username, planName, cycleFrequency, perCycleCost, sProdId, sPriceId, perCyclePerPersonCost, maxQuantity);
          return { productId: sProdId };
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to create new plan');
        }
      } else if (err === 'Incorrect token') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    pay: async (_, { planId, quantity }, { username, err }) => {
      /*
      1. check whether this user has a stripe Id or not, if not create a Stripe cus for them
      2. create subscription (need price id + cus id, quantity)
      3. save subscription id in user_plan table
      */

      /* right now assuming that nobody extra is joining plan compared to originally declared
      # of members when plan was created. will still need to check for # of people already on plan
      and compare with originally declared value --> adjust pricing later.
      */
      if (username) {
        try {
          let sCusId;
          const { rows } = await models.getUserInfo(username);
          const {
            stripeCusId, firstName, lastName, email
          } = rows[0];
          if (stripeCusId === null) { // create a customer
            const { id } = await stripe.customers.create({
              name: `${firstName} ${lastName}`,
              email
            });
            sCusId = id;
            await models.saveStripeCusId(username, sCusId);
          } else {
            sCusId = stripeCusId;
          }
          // at this point user will have stripeCusId
          // create subscription with stripe
          const { rows: getPriceIdRows } = await models.getPriceId(planId);
          const { sPriceId } = getPriceIdRows[0];
          const { id: subscriptionId, latest_invoice } = await stripe.subscriptions.create({
            customer: sCusId,
            items: [
              { price: sPriceId, quantity }
            ],
            payment_behavior: 'default_incomplete',
            payment_settings: {
              save_default_payment_method: 'on_subscription',
              payment_method_types: ['link', 'card'],
            },
            expand: ['latest_invoice.payment_intent']
          });
          const clientSecret = latest_invoice.payment_intent.client_secret;

          // save subscriptionId in database
          /*  Right now is not the right time to update this subscription info in our db yet
          because customer hasn't paid and db is updated already. This db query will need to be
          run only after successful payment (webhook).
          */
          await models.addSubscriptionId(planId, quantity, subscriptionId, username);
          return { clientSecret };
        } catch (asyncError) {
          console.log(asyncError);
          throw new ApolloError('Unable to create subscription');
        }

      } else if (err === 'Incorrect token') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

    editPayment: async (_, __, { username, err }) => {
      if (username) {
        try {
          const { rows } = await models.getUserInfo(username);
          const { stripeCusId: customer } = rows[0];
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

      } else if (err === 'Incorrect token') {
        throw new AuthenticationError(err);
      } else if (err === 'Unauthorized request') {
        throw new ForbiddenError(err);
      }
    },

  }
};
