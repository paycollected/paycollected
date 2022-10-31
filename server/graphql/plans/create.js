import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { addPlan } from '../../db/models.js';

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
  // check that date input string is between 2022-01-01 until 2099-12-31
  // perhaps move regex check to custom scalar if needs to incorporate date string
  // in other data fields arise in the future
  const dateStrRegEx = /^20(?:(2([^0-1]))|[3-9][0-9])-((?:(0[13578])|(1[02]))-(?:([0-2][1-9])|(30|31))|(?:(0[469])|(11))-(?:([0-2][1-9])|(30))|02-(?:([0-2][0-9])))$/;
  // this regex works BUT it's very verbose, specifying almost every single case
  // --> TODO if have time: rewrite to improve "regex"-ness
  if (!dateStrRegEx.test(startDate)) {
    throw new GraphQLError('Invalid start date', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  // just doing a simple input date validation using server's local time
  let startArr = startDate.split('-');
  startArr = startArr.map((ele) => Number(ele)); // convert str to number
  startArr[1] -= 1; // month is zeroth-indexed
  const start = new Date(...startArr); // will be at 00:00:00 local time

  const tomorrow = new Date();
  if (tomorrow.getHours() !== 0 || tomorrow.getMinutes() > 1) {
    // only set "tomorrow" to 00:00:00 of tomorrow if less than a minute past midnight
    // so that validation won't fail just because request was received a few (milli)seconds
    // past midnight
    // otherwise "tomorrow" for user who submitted this request (super close to midnight)
    // is actually today server's local time
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
  }
  const oneMonthFromTmr = new Date(tomorrow);
  oneMonthFromTmr.setMonth(tomorrow.getMonth() + 1);
  oneMonthFromTmr.setHours(0, 0, 0, 0);
  // set tmr + 1 month from then to also be at 00:00:00 local time
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
      metadata: { deletePlan: false },
    });

    const timeStr = `${startDate} 23:59:59 ${formatTimeZone[timeZone]}`;

    await addPlan(
      username,
      plan,
      freq,
      cost,
      planId,
      timeStr,
      priceId
    );

    return { planId };
  } catch (asyncError) {
    console.log(asyncError);
    throw new GraphQLError('Unable to create new plan', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
