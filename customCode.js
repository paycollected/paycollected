require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// const testClock = await stripe.testHelpers.testClocks.create({
//   frozen_time: new Date().valueOf() / 1000,
//   name: 'Simulation',
// });

// stripe.prices.update('price_1Luox4AJ5Ik974uerOqk66Fo', { active: false });
(async function anonymousFn() {
  // const paymentMethods = await stripe.customers.listPaymentMethods(
  //   'cus_Mf3oa7yUAjumcO',
  //   { type: 'card' }
  // );

  // console.log(paymentMethods);
  // paymentMethods.data.forEach((method) => {
  //   console.log('------------->', method.card);
  // });
  const { invoice_settings } = await stripe.customers.retrieve(
    'cus_MgQYPSdkrqi1z8'
  );

  const { default_payment_method } = invoice_settings;
  console.log(typeof 'default_payment_method');
}());
