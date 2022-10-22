import stripeSDK from 'stripe';
import { ApolloError, UserInputError } from 'apollo-server-core';
import { addPlan } from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function createPlanResolver(
  planName,
  cycleFrequency,
  perCycleCost,
  startDate,
  timeZone,
  username,
  recurringInterval
) {
  if (perCycleCost <= 10 || !Number.isInteger(perCycleCost *= 100)) {
    // make min $10
    throw new UserInputError('Invalid input');
  }

  // just doing a simple input date validation using server's local time
  const today = new Date();
  let startArr = startDate.split('-');
  startArr = startArr.map((ele) => Number(ele)); // convert str to number
  startArr[1] -= 1; // month is zeroth-indexed
  const start = new Date(...startArr.split('-')); // will be at 00:00:00 local time

  const tomorrow = (new Date()).setDate(today.getDate() + 1).setHours(0, 0, 0);
  const oneMonthFromTmr = (new Date(tomorrow)).setMonth(tomorrow.getMonth() + 1).setHours(0, 0, 0);
  // set tmr + 1 month from then to also be at 00:00:00 local time
  // so we can just compare the DATE!
  if (start < tomorrow || start > oneMonthFromTmr) {
    // start could = tomorrow if plan created very close to midnight server time
    throw new UserInputError('Invalid input');
  }

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
      product_data: { name: planName },
      metadata: { deletePlan: false },
    });

    let timeZoneStr;
    switch (timeZone) {
      case 'EASTERN':
        timeZoneStr = 'America/New_York';
        break;
      case 'CENTRAL':
        timeZoneStr = 'America/Chicago';
        break;
      case 'MOUNTAIN':
        timeZoneStr = 'America/Phoenix';
        break;
      case 'PACIFIC':
        timeZoneStr = 'America/Los_Angeles';
        break;
      default:
        break;
    }

    const timeStr = `${startDate} 23:59:59 ${timeZoneStr}`;

    await addPlan(
      username,
      planName,
      cycleFrequency,
      perCycleCost,
      productId,
      timeStr,
      priceId
    );

    return { productId };
  } catch (asyncError) {
    console.log(asyncError);
    throw new ApolloError('Unable to create new plan');
  }
}
