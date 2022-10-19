import stripeSDK from 'stripe';
import { ApolloError, UserInputError, ForbiddenError } from 'apollo-server-core';
import { joinPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function startSubscription(planId, newQuantity, user, recurringInterval) {
  let errMsg;
  const { username, email, stripeCusId } = user;
  try {
    // check that user is NOT already subscribed to plan
    const { rows } = await joinPlan(username, planId);
    const {
      cycleFrequency, perCycleCost, startDate, prevPriceId, quantity, count
    } = rows[0];
    if (quantity > 0) {
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
        nextStartDate.setYear(today.getFullYear() + 1);
      }
      nextStartDate = Math.ceil(nextStartDate.valueOf()/1000);
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
    const {
      id: subscriptionId, items, pending_setup_intent
    } = await stripe.subscriptions.create({
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
    console.log(subscriptionId, '<------------- subscriptionId');
    const { id: setupIntentId, client_secret: clientSecret } = pending_setup_intent;
    console.log('-------------->', pending_setup_intent);
    const { id: subscriptionItemId } = items.data[0];
    console.log('------------> subscriptionItemId', subscriptionItemId);

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
}
