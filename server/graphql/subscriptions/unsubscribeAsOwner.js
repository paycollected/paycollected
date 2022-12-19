import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { updateStripePrice } from '../../utils';
import {
  getProductInfoAndInvoiceCheckNewOwner,
  updatePriceOwnerArchiveSubs,
  updatePriceOwnerDelSubs,
} from '../../db/models.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function unsubscribeAsOwnerResolver(
  subscriptionId,
  username,
  newOwner
) {
  if (username === newOwner) {
    throw new GraphQLError('Cannot transfer ownership to self', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  let rows;
  try {
    ({ rows } = await getProductInfoAndInvoiceCheckNewOwner(username, subscriptionId, newOwner));
  } catch (e) {
    console.log('Failure to perform check', e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  if (rows.length === 0) {
    throw new GraphQLError("Subscription doesn't belong to user", { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    product, invoiceId, interval, perCycleCost, count, quantity, prevPriceId, members,
    planActive, subsActive, planOwner, newOwnerCheck
  } = rows[0];
  if (!planOwner) {
    throw new GraphQLError('Non-plan owner cannot call this mutation', { extensions: { code: 'FORBIDDEN' } });
  } else if (!planActive) {
    throw new GraphQLError('Plan has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (!subsActive) {
    throw new GraphQLError('Subscription has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (newOwnerCheck === null) {
    throw new GraphQLError('New owner is not active member on plan', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  try {
    const productTotalQuantity = count - quantity;
    // confident that productTotalQuantity will always > 0
    // because otherwise there will be no new owner to call this mutation
    // quant = 0 only allowed for plan owner when plan first created, not non-members
    const [{ id: price }] = await Promise.all([
      stripe.prices.create({
        currency: 'usd',
        product,
        unit_amount: Math.round((Math.ceil(perCycleCost / productTotalQuantity)) * 1.05),
        recurring: { interval },
      }),
      stripe.prices.update(prevPriceId, { active: false }),
      stripe.subscriptions.del(subscriptionId),
    ]);

    let status;
    if (invoiceId !== null) {
      status = 'ARCHIVED';
      // if there has been at least 1 active billing cycle for this subscription
      // archive in db
      await Promise.all([
        updatePriceOwnerArchiveSubs(price, product, username, newOwner),
        ...members.map((member) => updateStripePrice(member, price, productTotalQuantity)),
      ]);
    } else {
      status = 'DELETED';
      // subscription never active
      // delete from db
      await Promise.all([
        updatePriceOwnerDelSubs(price, product, username, newOwner),
        ...members.map((member) => updateStripePrice(member, price, productTotalQuantity)),
      ]);
    }

    return { planId: product, status };
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot unsubscribe', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
