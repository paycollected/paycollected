import stripeSDK from 'stripe';
import { GraphQLError } from 'graphql';
import { getSubsItemIdAndProductInfo, updatePriceQuant } from '../../db/models.js';
import { updateStripePrice } from '../../utils/helperFn.js';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function editQuantityResolver(
  subscriptionId,
  newQuantity,
  username,
) {
  // plan owner with quant = 0 will not be able to call this mutation b/c they don't have
  // a preexisting subscriptionId

  // Validating quantity input
  if (newQuantity > 6 || newQuantity <= 0) {
    // upper limit for our system
    throw new GraphQLError('Invalid quantity', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  let rows;
  try {
    ({ rows } = await getSubsItemIdAndProductInfo(subscriptionId, username));
    console.log(rows[0]);
  } catch (e) {
    console.log(e);
    throw new GraphQLError('Cannot update quantity', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }

  // validating ownership
  if (rows.length === 0) {
    throw new GraphQLError("Subscription doesn't belong to user", { extensions: { code: 'FORBIDDEN' } });
  }

  const {
    product, subscriptionItemId, interval, perCycleCost, count, quantity, prevPriceId, members,
    planActive, subsActive,
  } = rows[0];

  // input validation that there is indeed a change in quant
  if (!planActive) {
    throw new GraphQLError('Plan has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (!subsActive) {
    throw new GraphQLError('Subscription has already been archived', { extensions: { code: 'FORBIDDEN' } });
  } else if (quantity === newQuantity) {
    throw new GraphQLError('No change in quantity', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const productTotalQuantity = count - quantity + newQuantity;

  try {
    const [{ id: price }] = await Promise.all([
      stripe.prices.create({
        currency: 'usd',
        product,
        unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
        recurring: { interval },
      }),
      stripe.prices.update(prevPriceId, { active: false }),
      // archive old price ID
    ]);

    const promises = [
      stripe.subscriptions.update(
        subscriptionId,
        {
          items: [{ id: subscriptionItemId, price, quantity: newQuantity }],
          proration_behavior: 'none',
        }
      ),
      // update this subscription with new price ID
      updatePriceQuant(product, subscriptionId, newQuantity, price),
      // save to db
    ];

    if (members === null) {
      await Promise.all(promises);
    } else {
      await Promise.all([
        ...promises,
        ...members.map((member) => updateStripePrice(member, price)),
      ]);
    }
    return { planId: product, quantity: newQuantity };
  } catch (e) {
    throw new GraphQLError('Cannot update quantity', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
