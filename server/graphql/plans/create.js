import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { addPlan } from '../../db/models';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

const formatTimeZone = {
  EASTERN: 'America/New_York',
  CENTRAL: 'America/Chicago',
  MOUNTAIN: 'America/Phoenix',
  PACIFIC: 'America/Los_Angeles'
};

export default async function createPlanResolver(
  planName,
  cycleFrequency,
  perCycleCost,
  startDate,
  timeZone,
  username,
  recurringInterval
) {
  // INPUT VALIDATION
  const cost = perCycleCost * 100; // need in cents
  if (cost < 1000 || !Number.isInteger(cost)) {
    // make min $10
    throw new GraphQLError('Invalid cost', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  // just doing a simple input date validation
  const start = new Date(startDate);
  // will be at 00:00:00 UTC due to parsing action of custom scalar

  const offset = start.getTimezoneOffset();

  const tomorrow = new Date();
  tomorrow.setHours(0, -offset, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const oneMonthFromTmr = new Date(tomorrow);
  oneMonthFromTmr.setMonth(tomorrow.getMonth() + 1);
  oneMonthFromTmr.setHours(0, -offset, 0, 0);
  // set tmr + 1 month from then to also be at 00:00:00 UTC time
  // so we can just compare the DATE!
  if (start < tomorrow || start > oneMonthFromTmr) {
    throw new GraphQLError('Invalid start date', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const plan = planName.trim();
  const freq = cycleFrequency.toLowerCase();

  try {
    // create both a Stripe product ID & price ID in 1 API call
    const { id: priceId, product: planId } = await stripe.prices.create({
      currency: 'usd',
      unit_amount: cost,
      recurring: {
        interval: recurringInterval[freq],
        // could consider allowing customers to do interval count in the future?
        // meaning every 2 weeks, every 3 months etc.
      },
      product_data: { name: plan },
    });

    await addPlan(
      username,
      plan,
      freq,
      cost,
      planId,
      `${startDate.getUTCFullYear()}-${startDate.getUTCMonth() + 1}-${startDate.getUTCDate()} 23:59:59 ${formatTimeZone[timeZone]}`,
      priceId
    );

    return { planId, status: 'CREATED' };
  } catch (asyncError) {
    console.log(asyncError);
    throw new GraphQLError('Unable to create new plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
