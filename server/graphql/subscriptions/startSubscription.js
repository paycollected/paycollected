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
        nextStartDate.setYear(today.getFullYear() + 1);
      }
    }
    nextStartDate = Math.ceil(nextStartDate.valueOf() / 1000);

    // create a Stripe subscription
    const {
      id: subscriptionId, items, pending_setup_intent: pendingSetupIntent
    } = await stripe.subscriptions.create({
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
      trial_end: nextStartDate,
      expand: ['pending_setup_intent'],
      metadata: {
        productTotalQuantity: newQuantity, // will need to get latest number from webhook
        cycleFrequency: recurringInterval[cycleFrequency],
        perCycleCost,
        quantChanged: false,
        cancelSubs: false,
      }
    });

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
    return { clientSecret, subscriptionId };
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
