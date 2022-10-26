import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';
import { joinPlan as joinPlanModel, queuePendingSubs } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function joinPlan(planId, newQuantity, user) {
  // create
  let errMsg;
  if (newQuantity <= 0) {
    errMsg = 'Invalid input';
    throw new Error();
  }

  const { username } = user;
  try {
    // check that user is NOT already subscribed to plan
    // minimum info needed at webhook: planID, newQuantity, username

    // db hit will need to grab: quantity for this user on this plan, stripe cus ID, default pmt ID

    const { rows } = await joinPlanModel(username, planId);
    const {
      quantity, stripeCusId, defaultPaymentId
    } = rows[0];
    if (quantity > 0) {
      // front end will need to display a msg telling user
      // to use 'adjust quantity' in dashboard instead
      errMsg = 'User is already subscribed to this plan';
      throw new Error();
    }

    // create a Stripe setup intent and get all user payment methods
    const [
      { id: setupIntentId, client_secret: clientSecret },
      { data: paymentMethodsData }
    ] = await Promise.all([
      stripe.setupIntents.create({
        payment_method_types: ['card'],
        customer: stripeCusId,
        metadata: {
          planId,
          quantity: newQuantity,
          username,
        }
      }),
      stripe.customers.listPaymentMethods(stripeCusId, { type: 'card' })
    ]);


    const paymentMethods = paymentMethodsData.map((method) => ({
      id: method.id,
      brand: method.card.brand,
      last4: method.card.last4,
      expiryMonth: method.card.exp_month,
      expiryYear: method.card.exp_year,
      default: method.id === defaultPaymentId
    }));

    return { clientSecret, setupIntentId, paymentMethods };
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
