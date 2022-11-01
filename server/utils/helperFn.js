import stripeSDK from 'stripe';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export function updateStripePrice(member, price, productTotalQuantity) {
  const {
    subscriptionId,
    subscriptionItemId,
    quantity
  } = member;

  return stripe.subscriptions.update(
    subscriptionId,
    {
      items: [{ id: subscriptionItemId, price, quantity }],
      metadata: { productTotalQuantity },
      proration_behavior: 'none',
    }
  );
}

export function cancelSubs(member) {
  const { subscriptionId } = member;
  return stripe.subscriptions.del(subscriptionId);
}
