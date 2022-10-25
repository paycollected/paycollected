require('dotenv').config();

const stripeSDK = require('stripe');
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

// const testClock = await stripe.testHelpers.testClocks.create({
//   frozen_time: new Date().valueOf() / 1000,
//   name: 'Simulation',
// });

// stripe.prices.update('price_1Luox4AJ5Ik974uerOqk66Fo', { active: false });
(async function anonymousFn() {
  const subscription = await stripe.subscriptions.retrieve(
    'sub_1LwGX0AJ5Ik974ueBqtgSHRx'
  );

  const { pending_setup_intent } = subscription;

  console.log(subscription);
  /*
    {
  id: 'sub_1LwGX0AJ5Ik974ueBqtgSHRx',
  object: 'subscription',
  application: null,
  application_fee_percent: null,
  automatic_tax: { enabled: false },
  billing_cycle_anchor: 1666594799,
  billing_thresholds: null,
  cancel_at: null,
  cancel_at_period_end: false,
  canceled_at: null,
  collection_method: 'charge_automatically',
  created: 1666579010,
  currency: 'usd',
  current_period_end: 1669273199,
  current_period_start: 1666594799,
  customer: 'cus_Mf3oa7yUAjumcO',
  days_until_due: null,
  default_payment_method: 'pm_1LwGXBAJ5Ik974uenx2zmGVZ',
  default_source: null,
  default_tax_rates: [],
  description: null,
  discount: null,
  ended_at: null,
  items: {
    object: 'list',
    data: [ [Object] ],
    has_more: false,
    total_count: 1,
    url: '/v1/subscription_items?subscription=sub_1LwGX0AJ5Ik974ueBqtgSHRx'
  },
  latest_invoice: 'in_1LwKg0AJ5Ik974ueJQVHYkzo',
  livemode: false,
  metadata: {
    cancelSubs: 'false',
    cycleFrequency: 'month',
    perCycleCost: '25000',
    productTotalQuantity: '5',
    quantChanged: 'false'
  },
  next_pending_invoice_item_invoice: null,
  pause_collection: null,
  payment_settings: {
    payment_method_options: null,
    payment_method_types: [ 'link', 'card' ],
    save_default_payment_method: 'on_subscription'
  },
  pending_invoice_item_interval: null,
  pending_setup_intent: null,
  pending_update: null,
  plan: {
    id: 'price_1LwcCmAJ5Ik974uefjlLebqr',
    object: 'plan',
    active: true,
    aggregate_usage: null,
    amount: 5000,
    amount_decimal: '5000',
    billing_scheme: 'per_unit',
    created: 1666662324,
    currency: 'usd',
    interval: 'month',
    interval_count: 1,
    livemode: false,
    metadata: { deletePlan: 'false' },
    nickname: null,
    product: 'prod_Mf5tKlhmr00SAn',
    tiers_mode: null,
    transform_usage: null,
    trial_period_days: null,
    usage_type: 'licensed'
  },
  quantity: 1,
  schedule: null,
  start_date: 1666579010,
  status: 'active',
  test_clock: null,
  transfer_data: null,
  trial_end: 1666594799,
  trial_start: 1666579010
}
  */
  console.log('------------> pendingSetupIntent', pending_setup_intent); // returns null
}());
