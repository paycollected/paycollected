import stripeSDK from 'stripe';
import { ApolloError, ForbiddenError, UserInputError } from 'apollo-server-core';
import { joinPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function joinPlanResolver(planId, newQuantity, username) {
  // create
  let errMsg;
  if (newQuantity <= 0) {
    errMsg = 'Invalid input';
    throw new Error();
  }

  try {
    const { rows } = await joinPlan(username, planId);
    const { quantity, stripeCusId, active } = rows[0];
    if (!active) {
      errMsg = 'This plan has already been archived';
      throw new Error();
    } else if (quantity > 0) {
      errMsg = 'User already subscribed';
      throw new Error();
    }

    // create a Stripe setup intent and get all user payment methods
    const [
      { id: setupIntentId, client_secret: clientSecret },
      { data: paymentMethodsData },
      { invoice_settings: { default_payment_method: defaultPaymentId } }
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
      stripe.customers.listPaymentMethods(stripeCusId, { type: 'card' }),
      stripe.customers.retrieve(stripeCusId)
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
