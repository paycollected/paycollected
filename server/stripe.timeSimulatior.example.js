require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const time = Math.floor(new Date().valueOf() / 1000);

/* SOME NOTES TO PREP FOR TESTING THE API USING TIME SIMULATION */
(async () => {
  // CREATE A STRIPE TEST CLOCK
  const { id: testClockId } = await stripe.testHelpers.testClocks.create({
    frozen_time: time,
    name: 'Simulation',
  });
  console.log(testClockId);

  // THEN GO AHEAD AND USE THIS TEST CLOCK ID
  // pass test clock ID as an argument to the create account mutation
  // (or resend email verification mutation - note: MUST BE A NEW, UNVERIFIED USER)
  // web client is not set up to use test clock (which is only meant for testing
  // & not production anyway)
  // all subscriptions that these test clock customers made will be automatically attached to
  // the test clock

  // Constraints of the test clock:
  // 1) only 3 Stripe customers max per test clock
  // 2) each test clock customer can only have max 3 subscriptions
  // 3) test clock must be attached at Stripe customer creation, not after
  // 4) test clock can only go forward in time, starting from currently frozen time
  // 5) can only go forward max 2 intervals at a time (1 interval = shortest recurring frequency
  // of a subscription associated with the test clock)

  // Still need some refactoring of the joinPlan mutation so that a test clock customer
  // can join a plan after it has started for the group

  // ADVANCE THE CLOCK IN TIME
  await stripe.testHelpers.testClocks.advance(
    testClockId,
    { frozen_time: 1669179599 + 60 * 60 * 24 * 3 }
  );
  // base number for the 1st frozen time should be taken from the start date of test plan in the db
  // using the following SQL command:
  // SELECT ROUND (EXTRACT (EPOCH FROM start_date)) FROM plans WHERE plan_id = $;

  // Once test clock has advanced to this point, webhook events such as subscriptions trial will
  // end, or new invoices are created will be sent to the server. The invoices are only finalized
  // and a payment attempt is made an hour after the invoice has been made.
  // So continue to advance the test clock an hour or two from the base to receive these webhook
  // events, which will write to our invoices table in the db.


  // CLEAN UP AFTER SIMULATION COMPLETE
  await stripe.testHelpers.testClocks.del(testClockId);
  // deleting a test clock will also delete all associated customers on Stripe
  // still need to clean up db


  // RETRIEVE TEST CLOCKS
  // const testClocks = await stripe.testHelpers.testClocks.list({
  //   limit: 3,
  // });
  // console.log(testClocks);


  // RETRIEVE A PARTICULAR TEST CLOCK
  const testClock = await stripe.testHelpers.testClocks.retrieve(testClockId);
  console.log(testClock);
})();
