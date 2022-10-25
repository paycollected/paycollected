import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';
import { joinPlan, queuePendingSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function startSubscription(planId, newQuantity, user, recurringInterval) {
  let errMsg;
  if (newQuantity <= 0) {
    errMsg = 'Invalid input';
    throw new Error();
  }

  const { username, stripeCusId } = user;
  try {
    // check that user is NOT already subscribed to plan
    const { rows } = await joinPlan(username, planId);
    const {
      cycleFrequency, perCycleCost, startDate, priceId, quantity,
    } = rows[0];
    if (quantity > 0) {
      // front end will need to display a msg telling user
      // to use 'adjust quantity' in dashboard instead
      errMsg = 'User is already subscribed to this plan';
      throw new Error();
    }

    // create a Stripe subscription
    const [{
      id: subscriptionId, items, pending_setup_intent: pendingSetupIntent
    }, { data: paymentMethodsData }] = await Promise.all([
      stripe.subscriptions.create({
        customer: stripeCusId,
        items: [{
          price: priceId, // just use whatever latest priceId is in db
          // will have to recalculate at webhook anyway
          quantity: newQuantity,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['link', 'card'],
        },
        proration_behavior: 'none',
        trial_end: startDate,
        expand: ['pending_setup_intent'],
        metadata: {
          productTotalQuantity: newQuantity, // will need to get latest number from webhook
          cycleFrequency: recurringInterval[cycleFrequency],
          perCycleCost,
          quantChanged: false,
          cancelSubs: false,
        }
      }),
      stripe.customers.listPaymentMethods(stripeCusId, { type: 'card' })
    ]);


    const { id: setupIntentId, client_secret: clientSecret } = pendingSetupIntent;
    const { id: subscriptionItemId } = items.data[0];

    await Promise.all([
      // add this pending subscription to db
      // to keep track of whether payment was followed up in following 24 hrs
      queuePendingSubs(subscriptionId, username),
      // storing information needed for webhook in metadata for setupIntent
      // so we don't have to query db too often later
      stripe.setupIntents.update(
        setupIntentId,
        {
          metadata: {
            perCycleCost,
            subscriptionId,
            subscriptionItemId,
            username,
            planId,
            cycleFrequency: recurringInterval[cycleFrequency],
            quantity: newQuantity,
          }
        }
      )
    ]);

    const paymentMethods = paymentMethodsData.map((method) => ({
      id: method.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expiryMonth: method.card.exp_month,
      expiryYear: method.card.exp_year,
    }));

    return { clientSecret, subscriptionId, paymentMethods };
  } catch (asyncError) {
    if (errMsg === 'User is already subscribed to this plan') {
      throw new ForbiddenError(errMsg);
    } else if (errMsg === 'Invalid input') {
      throw new UserInputError(errMsg);
    }
    console.log(asyncError);
    throw new ApolloError('Unable to create subscription');
  }
}
