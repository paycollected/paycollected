import stripeSDK from 'stripe';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export function updateStripePrice(member, price) {
  const {
    subscriptionId,
    subscriptionItemId,
    quantity
  } = member;

  return stripe.subscriptions.update(
    subscriptionId,
    {
      items: [{ id: subscriptionItemId, price, quantity }],
      proration_behavior: 'none',
    }
  );
}

export function cancelSubs(member) {
  const { subscriptionId } = member;
  return stripe.subscriptions.del(subscriptionId);
}

export function generateConfigEmailVerification(name, firstName, email, token, type = 'firstTime') {
  const greeting = type === 'returning'
    ? "We've received your request to change email address."
    : 'Thanks for signing up with PayCollected!';
  const subject = type === 'returning'
    ? 'Email address change'
    : 'Welcome to PayCollected!';

  return {
    from: {
      name: 'PayCollected',
      email: 'admin@paycollected.com',
    },
    to: { name, email },
    subject,
    html: `
    <div>
      <h3>Hi ${firstName}!</h3>
      <div>${greeting}</div>
      <div>To verify this email account, please click
        <a href="${process.env.HOST}/verify/${token}">here</a>.
      </div>
      <div>We look forward to serving you!</div>
    </div>`
  };
}
