import stripeSDK from 'stripe';
import { ApolloError } from 'apollo-server-core';
import { addPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function createPlanResolver(
  planName,
  cycleFrequency,
  perCycleCost,
  startDate,
  username,
  recurringInterval
) {
  planName = planName.trim();
  cycleFrequency = cycleFrequency.toLowerCase();
  perCycleCost *= 100; // store in cents

  try {
    // create both a Stripe product ID & price ID in 1 API call
    const { id: priceId, product: productId } = await stripe.prices.create({
      currency: 'usd',
      unit_amount: perCycleCost,
      recurring: {
        interval: recurringInterval[cycleFrequency],
        // could consider allowing customers to do interval count in the future?
        // meaning every 2 weeks, every 3 months etc.
      },
      product_data: {
        name: planName,
      }
    });

    await addPlan(
      username,
      planName,
      cycleFrequency,
      perCycleCost,
      productId,
      startDate,
      priceId
    );

    return { productId };
  } catch (asyncError) {
    console.log(asyncError);
    throw new ApolloError('Unable to create new plan');
  }
}
