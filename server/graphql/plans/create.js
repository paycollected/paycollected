import stripeSDK from 'stripe';
import {
  ApolloError, UserInputError, ForbiddenError
} from 'apollo-server-core';
import { addPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function createPlanResolver(
  planName, cycleFrequency, perCycleCost, startDate, username
) {
  planName = planName.trim();
  cycleFrequency = cycleFrequency.toLowerCase();
  perCycleCost *= 100; // store in cents

  try {
    // create stripe product
    const { id: productId } = await stripe.products.create({
      name: planName
    });

    await addPlan(
      username,
      planName,
      cycleFrequency,
      perCycleCost,
      productId,
      startDate
    );

    return { productId };
  } catch (asyncError) {
    console.log(asyncError);
    throw new ApolloError('Unable to create new plan');
  }
}
