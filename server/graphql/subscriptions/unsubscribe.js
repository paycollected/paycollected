import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { updateStripePrice } from '../../utils/helperFn.js';
import {
  getProductInfoAndInvoice,
  updatePriceIdDelSubs,
  updatePriceIdArchiveSubs,
  deleteSubscription,
  archiveSubs,
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);


export default async function unsubscribeResolver(subscriptionId, username) {
  let rows;
  try {
    ({ rows } = await getProductInfoAndInvoice(subscriptionId, username));
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError("Subscription doesn't belong to user", { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    product, invoiceId, interval, perCycleCost, count, quantity, prevPriceId, members,
    planActive, subsActive, planOwner
  } = rows[0];
  if (planOwner) {
    throw new GraphQLError('Plan owner cannot call this mutation', { extensions: { code: 'FORBIDDEN' } });
  } else if (!planActive) {
    throw new GraphQLError('Plan has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (!subsActive) {
    throw new GraphQLError('Subscription has already been archived', { extensions: { code: 'FORBIDDEN' } });
  }

  const productTotalQuantity = count - quantity;
  try {
    if (productTotalQuantity > 0) {
      // there are still active members on the plan
      const [{ id: price }] = await Promise.all([
        stripe.prices.create({
          currency: 'usd',
          product,
          unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
          recurring: { interval },
        }),
        stripe.prices.update(prevPriceId, { active: false }),
        stripe.subscriptions.del(subscriptionId),
      ]);

      if (invoiceId !== null) {
        // if there has been at least 1 active billing cycle for this subscription
        // archive in db
        await Promise.all([
          updatePriceIdArchiveSubs(price, product, subscriptionId),
          ...members.map((member) => updateStripePrice(member, price, productTotalQuantity)),
        ]);
      } else {
        // subscription never active
        // delete from db
        await Promise.all([
          updatePriceIdDelSubs(price, product, subscriptionId),
          ...members.map((member) => updateStripePrice(member, price, productTotalQuantity)),
        ]);
      }
    } else if (productTotalQuantity === 0 && invoiceId === null) {
      // this person is the last active member on plan
      // & subs has never been active
      // will NOT create a new price ID and does not have to update anybody else
      await Promise.all([
        stripe.subscriptions.del(subscriptionId),
        deleteSubscription(subscriptionId),
      ]);
    } else {
      // this person is the last active member on plan
      // & subs has had at least 1 active billing cycle
      await Promise.all([
        stripe.subscriptions.del(subscriptionId),
        archiveSubs(subscriptionId),
      ]);
    }

    return { planId: product };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
