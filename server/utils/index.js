import stripeSDK from 'stripe';
import sgMail from '@sendgrid/mail';


const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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

export function generateConfigEmailVerification(name, firstName, email, token) {
  return {
    from: {
      name: 'PayCollected',
      email: 'admin@paycollected.com',
    },
    to: { name, email },
    subject: 'Welcome to PayCollected!',
    html: `
    <div>
      <h3>Hi ${firstName}!</h3>
      <div>Thanks for signing up with PayCollected!</div>
      <div>To verify your email address, please click
        <a href="${process.env.HOST}/verify/${token}">here</a>.
      </div>
      <div>We look forward to serving you!</div>
    </div>`
  };
}
