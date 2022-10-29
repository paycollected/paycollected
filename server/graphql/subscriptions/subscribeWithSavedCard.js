import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { subscriptionSetupSavedCard, startSubsNoPriceUpdateReturningPlan } from '../../db/models.js';

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
  let err;
  try {
    const [
      { customer: paymentMethodCustomer },
      { customer: setupIntentCustomer, metadata: { quantity: savedQuant, planId: planIdToSubscribe } },
      { rows }
    ] = await Promise.all([
      stripe.paymentMethods.retrieve(paymentMethodId),
      stripe.setupIntents.retrieve(setupIntentId),
      subscriptionSetupSavedCard(planId, username)
    ]);

    const quantity = Number(savedQuant);
    const {
      cycleFrequency, perCycleCost, count, prevPriceId, startDate, user, members
    } = rows[0];

    // input validation
    if (user.stripeCusId !== paymentMethodCustomer
      || user.stripeCusId !== setupIntentCustomer
      || rows[0].existingQuant > 0
      || planIdToSubscribe !== planId
    ) {
      err = 'User not authorized to perform this action';
      throw new Error();
    }
    console.log('aaaaaa');
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      err = 'User not authorized to perform this action';
      throw new Error();
    }
    console.log('bbbbb');

    // create new priceId if needbe
    // also archieve old price id if needbe
    // update all existing plan members
    // create subscription for this person
    // cancel setupIntent
    // save to db

    const productTotalQuantity = quantity + count;
    const subscription = {
      customer: user.stripeCusId,
      items: [{
        price: prevPriceId,
        quantity,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      proration_behavior: 'none',
      trial_end: startDate,
      default_payment_method: paymentMethodId,
      metadata: {
        productTotalQuantity,
        cycleFrequency,
        perCycleCost,
        quantChanged: false,
        cancelSubs: false,
      }
    };

    if (count === 0 && quantity === 1) {
      // this is the first subscription on this plan
      // --> no need to create a new price ID
      // also no need to archive current price ID
      // no other plan members to update
      // --> create subscription for this person
      // cancel setupIntent
      // --> only need to update db
      console.log('I got to here');
      const [{ id: subscriptionId, items }, _] = await Promise.all([
        stripe.subscriptions.create(subscription),
        stripe.setupIntents.cancel(setupIntentId),
      ]);
      const { id: subscriptionItemId } = items.data[0];
      console.log(planId, quantity, subscriptionId, subscriptionItemId, username, startDate);
      const { rows: resultRows } = await startSubsNoPriceUpdateReturningPlan(
        planId,
        quantity,
        subscriptionId,
        subscriptionItemId,
        username,
        startDate
      );
      console.log(resultRows[0]);
      return resultRows[0];
    }
  } catch (e) {
    if (err) {
      throw new ForbiddenError(err);
    }
    console.log(e);
    throw new ApolloError('Unable to start subscription');
  }
}
