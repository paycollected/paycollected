import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { joinPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function joinPlanResolver(planId, newQuantity, username) {
  // create
  let errMsg;
  if (newQuantity <= 0) {
    errMsg = 'Invalid quantity';
    throw new Error();
  }

  try {
    const { rows } = await joinPlan(username, planId);
    // What abt case when user used to be active on plan, but not anymore?
    // with this current setup, they can rejoin by calling this mutation!
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
        metadata: { planId, quantity: newQuantity }
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
    if (errMsg === 'User already subscribed' || errMsg === 'This plan has already been archived') {
      throw new GraphQLError(errMsg, { extensions: { code: 'FORBIDDEN' } });
    } else if (errMsg === 'Invalid quantity') {
      throw new GraphQLError(errMsg, { extensions: { code: 'BAD_USER_INPUT' } });
    }
    console.log(asyncError);
    throw new GraphQLError('Unable to create subscription', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
