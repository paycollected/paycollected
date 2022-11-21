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

export function generateConfigEmailVerification(name, firstName, email, token, type, testClockId) {
  let greeting;
  let subject;
  let ending;
  switch (type) {
    case 'returning':
      greeting = "We've received your request to change email address.";
      subject = 'Email address change';
      ending = 'Thank you for being a valued customer of PayCollected.';
      break;
    default:
      greeting = 'Thank you for signing up with PayCollected!';
      subject = 'Welcome to PayCollected!';
      ending = 'We look forward to serving you!';
      break;
  }

  let url = `${process.env.HOST}/verify/?token=${token}`;
  if (testClockId) {
    url = url.concat(`&testClockId=${testClockId}`);
  }

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
        <a href="${url}">here</a>.
      </div>
      <div>${ending}</div>
    </div>`,
  };
}

export function generateConfigPwdReset(name, firstName, email, token) {
  return {
    from: {
      name: 'PayCollected',
      email: 'admin@paycollected.com',
    },
    to: { name, email },
    subject: 'PayCollected Password Reset',
    html: `
    <div>
      <h3>Hi ${firstName}!</h3>
      <div>We've received your request to reset your password.</div>
      <div>To reset your password, please click
        <a href="${process.env.HOST}/password-reset/?token=${token}">here</a>.
      </div>
      <div>If you didn't initiate this request, please log in and change your password immediately to secure your account.</div>
      <div>Thank you for being a valued customer of PayCollected.</div>
    </div>`,
  };
}
