import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { DateTimeResolver, DateResolver, USCurrencyResolver } from 'graphql-scalars';
import authResolverWrapper from './authResolverWrapper';
import {
  planIdScalar, subscriptionIdScalar, emailScalar, usernameScalar, paymentMethodIdScalar,
  setupIntentIdScalar, testClockScalar,
} from './customScalarTypes';
import createAccount from './users/createAccount';
import loginResolver from './users/login';
import resetPasswordResolver from './users/resetPassword';
import resetPwdFromTokenResolver from './users/resetPwdFromToken';
import resendVerificationEmailResolver from './users/resendVerificationEmail';
import changeEmailResolver from './users/changeEmail';
import changeUsernameResolver from './users/changeUsername';
import changePasswordResolver from './users/changePassword';
import joinPlanResolver from './plans/join';
import unsubscribeResolver from './subscriptions/unsubscribe.js';
import unsubscribeAsOwnerResolver from './subscriptions/unsubscribeAsOwner';
import editQuantityResolver from './subscriptions/editQuantity';
import subscribeWithSavedCardResolver from './subscriptions/subscribeWithSavedCard';
import {
  viewOnePlan as viewOnePlanResolver,
  viewAllPlans as viewAllPlansResolver,
  activeMembers as activeMembersResolver,
} from './plans/view.js';
import createPlanResolver from './plans/create.js';
import deletePlanResolver from './plans/delete.js';
import cancelTransactionResolver from './payment/cancelTransaction';
import { retrieveNotificationsResolver, deleteNotificationResolver } from './users/notifications';
import transferOwnershipResolver from './plans/transferOwnership';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

const recurringInterval = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};

const saltRounds = 10;

export default {
  Username: usernameScalar,

  Email: emailScalar,

  PlanID: planIdScalar,

  SubscriptionID: subscriptionIdScalar,

  SetupIntentID: setupIntentIdScalar,

  PaymentMethodID: paymentMethodIdScalar,

  TestClockID: testClockScalar,

  DateTime: DateTimeResolver,

  Date: DateResolver,

  USCurrency: USCurrencyResolver,

  Query: {
    viewOnePlan: authResolverWrapper((_, { planId }, { user: { username } }) => (
      viewOnePlanResolver(planId, username)
    )),

    viewAllPlans: authResolverWrapper((_, __, { user: { username } }) => (
      viewAllPlansResolver(username)
    )),

    retrieveNotifications: authResolverWrapper((_, __, { user: { username } }) => (
      retrieveNotificationsResolver(username)
    )),
  },


  Mutation: {
    createUser: (_, {
      firstName, lastName, username, password, email, testClockId,
    }) => (
      createAccount(firstName, lastName, username, password, email, saltRounds, testClockId)
    ),

    login: (_, { usernameOrEmail, password }) => (loginResolver(usernameOrEmail, password)),

    resetPassword: (_, { usernameOrEmail }) => (resetPasswordResolver(usernameOrEmail)),

    resetPasswordFromToken: (_, { token, newPassword }) => (
      resetPwdFromTokenResolver(token, newPassword, saltRounds)
    ),

    resendVerificationEmail: (_, { email, testClockId }) => (
      resendVerificationEmailResolver(email, testClockId)
    ),

    changeEmail: authResolverWrapper((_, { newEmail, password }, { user: { username } }) => (
      changeEmailResolver(username, password, newEmail)
    )),

    changeUsername: authResolverWrapper((_, { newUsername, password }, { user: { username } }) => (
      changeUsernameResolver(username, password, newUsername)
    )),

    changePassword: authResolverWrapper(
      (_, { newPassword, currentPassword }, { user: { username } }) => (
        changePasswordResolver(username, currentPassword, newPassword, saltRounds)
      )
    ),

    createPlan: authResolverWrapper((_, {
      planName, cycleFrequency, perCycleCost, startDate,
    }, { user: { username } }) => (
      createPlanResolver(
        planName,
        cycleFrequency,
        perCycleCost,
        startDate,
        username,
        recurringInterval
      )
    )),

    joinPlan: authResolverWrapper((_, { planId, quantity }, { user: { username } }) => (
      joinPlanResolver(planId, quantity, username)
    )),

    editPayment: authResolverWrapper(async (_, __, { user }) => {
      const { stripeCusId } = user;
      try {
        const { url } = await stripe.billingPortal.sessions.create({
          customer: stripeCusId,
          return_url: `${process.env.HOST}/dashboard/`,
        });
        return { portalSessionURL: url };
      } catch (asyncError) {
        console.log(asyncError);
        throw new GraphQLError('Unable to get customer portal link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }),

    unsubscribe: authResolverWrapper((_, { subscriptionId }, { user: { username } }) => (
      unsubscribeResolver(subscriptionId, username)
    )),

    unsubscribeAsOwner: authResolverWrapper(
      (_, { subscriptionId, newOwner }, { user: { username } }) => (
        unsubscribeAsOwnerResolver(subscriptionId, username, newOwner)
      )
    ),

    editQuantity: authResolverWrapper(
      (_, { subscriptionId, newQuantity }, { user: { username } }) => (
        editQuantityResolver(subscriptionId, newQuantity, username)
      )
    ),

    deletePlan: authResolverWrapper(
      (_, { planId }, { user: { username } }) => (
        deletePlanResolver(planId, username)
      )
    ),

    cancelTransaction: authResolverWrapper(
      (_, { setupIntentId, }, { user: { username } }) => (
        cancelTransactionResolver(setupIntentId, username)
      )
    ),

    subscribeWithSavedCard: authResolverWrapper(
      (_, {
        paymentMethodId, setupIntentId, password, planId
      }, { user: { username } }) => (
        subscribeWithSavedCardResolver(paymentMethodId, setupIntentId, password, planId, username)
      )
    ),

    deleteNotification: authResolverWrapper((_, { notificationId }, { user: { username } }) => (
      deleteNotificationResolver(notificationId, username)
    )),

    transferOwnership: authResolverWrapper((_, { planId, newOwner }, { user: { username }}) => (
      transferOwnershipResolver(planId, newOwner, username)
    )),
  }
};
