import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { subscriptionSetupSavedCard, planReturnAfterSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(
  paymentMethodId,
  setupIntentId,
  password,
  planId,
  username
) {
  // info needed from db: cycleFreq, total count, perCycleCost, startDate for this person,
  // everyone else already on plan
  // also potential create a new price ID
  // API calls: start subscription for this person
  // change subscriptions for existing plan members
  let paymentMethodCustomer;
  let setupIntentCustomer;
  let rows;
  let planIdToSubscribe;
  let quantity;
  try {
    [
      { customer: paymentMethodCustomer },
      { customer: setupIntentCustomer, metadata: { quantity, planId: planIdToSubscribe } },
      { rows }
    ] = await Promise.all([
      stripe.paymentMethods.retrieve(paymentMethodId),
      stripe.setupIntents.retrieve(setupIntentId),
      subscriptionSetupSavedCard(planId, username)
    ]);
  } catch (e) {
    console.log(e);
    throw new ApolloError('Unable to start subscription');
  }

  if (rows[0].stripeCusId !== paymentMethodCustomer
    || rows[0].stripeCusId !== setupIntentCustomer
    || rows[0].existingQuant > 0) {
    throw ForbiddenError('User not authorized to perform this action');
  }

  const result = await bcrypt.compare(password, rows[0].password);
  if (!result) {
    throw ForbiddenError('User not authorized to perform this action');
  }

  try {
    const [{ rows: resultRows }, _] = await Promise.all([
      // planReturnAfterSubs(planId, quantity),
      stripe.setupIntents.confirm(setupIntentId, { payment_method: paymentMethodId })
    ]);

    return resultRows[0];
  } catch (e) {
    console.log(e);
    throw new ApolloError('Unable to start subscription');
  }
}
