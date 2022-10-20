require('dotenv').config();
const stripeSDK = require('stripe');
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

// const testClock = await stripe.testHelpers.testClocks.create({
//   frozen_time: new Date().valueOf() / 1000,
//   name: 'Simulation',
// });

stripe.prices.update('price_1Luox4AJ5Ik974uerOqk66Fo', { active: false });
