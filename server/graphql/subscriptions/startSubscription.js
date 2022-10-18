import stripeSDK from 'stripe';
import { ApolloError, UserInputError, ForbiddenError } from 'apollo-server-core';
import { isFuture } from 'date-fns';
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
}
