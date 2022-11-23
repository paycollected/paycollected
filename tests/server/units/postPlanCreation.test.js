const { pgClient, stripe } = require('../client.js');
const { gql, ApolloClient, InMemoryCache } = require('@apollo/client');
const jwt = require('jsonwebtoken');
const { deletePlanTests } = require('./deletePlan.js');

class TestUser {
  constructor(firstName, lastName, username, email, quantity = 0, owner = false) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = `${firstName} ${lastName}`;
    this.username = username;
    this.email = email;
    this.stripeId = null;
    this.quantity = quantity;
    this.subscriptionId = null;
    this.subscriptionItemId = null;
    this.owner = owner;
    this.pmntMethod = null;
  }

  getPgParamsForUsers() {
    return [this.username, this.firstName, this.lastName, this.email, this.stripeId];
  }

  getPgParamsForUserPlan() {
    return [this.username, this.owner, this.quantity, this.subscriptionId, this.subscriptionItemId];
  }
}

const testUser1 = new TestUser('Test1', 'User1', 'testUser1', 'test-user1@email.com', 2, true);
const testUser2 = new TestUser('Test2', 'User2', 'testUser2', 'test-user2@email.com', 1, false);
const testUser3 = new TestUser('Test3', 'User3', 'testUser3', 'test-user3@email.com', 3, false);
const testUser4 = new TestUser('Test4', 'User4', 'testUser4', 'test-user4@email.com', 2, false);
const users = [testUser1, testUser2, testUser3, testUser4];
let priceId, planId;

beforeAll(async () => {
  const createStripeCustomers = users.map((user) => (
    stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { username: user.username }
    })
  ));

  const resolvedPromises = await Promise.all([
      ...createStripeCustomers,
      stripe.prices.create({
        currency: 'usd', unit_amount: 525, recurring: { interval: 'week' },
        product_data: { name: 'Test Plan'},
      })
  ]);

  const { id, product } = resolvedPromises[4];
  priceId = id;
  planId = product;

  users.forEach((user, i) => { user.stripeId = resolvedPromises[i].id });

  const query = `
    WITH insert_users AS (
      INSERT INTO users
      (username, first_name, last_name, password, email, s_cus_id, verified)
    VALUES
      ($1, $2, $3, 'secure', $4, $5, True),
      ($6, $7, $8, 'secure', $9, $10, True),
      ($11, $12, $13, 'secure', $14, $15, True),
      ($16, $17, $18, 'secure', $19, $20, True)
    )
    INSERT INTO plans (
      plan_id, price_id, plan_name, cycle_frequency, per_cycle_cost, start_date, active
    ) VALUES (
      $21, $22, 'Test Plan', 'weekly', 4000, CURRENT_TIMESTAMP, True
    )
  `;
  await pgClient.connect();
  await pgClient.query(query, [
    ...testUser1.getPgParamsForUsers(),
    ...testUser2.getPgParamsForUsers(),
    ...testUser3.getPgParamsForUsers(),
    ...testUser4.getPgParamsForUsers(),
    product, priceId,
  ]);
});

afterAll(async () => {
  const delStripeCustomers = users.map((user) => stripe.customers.del(user.stripeId));
  const query = `
    WITH del AS (DELETE FROM plans WHERE plan_id = $1)
    DELETE FROM users WHERE username LIKE 'testUser_'
  `;
  await Promise.all([
    ...delStripeCustomers,
    pgClient.query(query, [planId]),
    stripe.prices.update(priceId, { active: false }),
    stripe.products.update(planId, { active: false }),
  ]);
  await pgClient.end();
});

describe('After users have joined plan', () => {
  beforeAll(async () => {
    const generateSubsObj = (customer, quantity, paymentMethodId) => ({
      customer,
      items: [{ price: priceId, quantity }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      proration_behavior: 'none',
      default_payment_method: paymentMethodId,
    });

    const pmntMethods = await Promise.all(
      [
        stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: '4242424242424242',
            exp_month: 11,
            exp_year: 2025,
            cvc: '314',
          },
        }),
        stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: '5555555555554444',
            exp_month: 5,
            exp_year: 2025,
            cvc: '947',
          },
        }),
        stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: '6011111111111117',
            exp_month: 3,
            exp_year: 2024,
            cvc: '826',
          },
        }),
        stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: '378282246310005',
            exp_month: 6,
            exp_year: 2023,
            cvc: '0715',
          },
        }),
      ]
    );

    const attachPmntMethods = users.map((user, i) => stripe.paymentMethods.attach(
      pmntMethods[i].id, { customer: user.stripeId }
    ));

    await Promise.all(attachPmntMethods);

    users.forEach((user, i) => { user.pmntMethod = pmntMethods[i].id });

    const createSubs = users.map((user, i) => (stripe.subscriptions.create(
      generateSubsObj(user.stripeId, user.quantity, user.pmntMethod)
    )));

    const subs = await Promise.all(createSubs);

    users.forEach((user, i) => {
      user.subscriptionId = subs[i].id;
      user.subscriptionItemId = subs[i].items.data[0].id;
    });

    const query = `
      INSERT INTO user_plan (
        username, plan_id, plan_owner, quantity, subscription_id, subscription_item_id
      ) VALUES
        ($1, $21, $2, $3, $4, $5),
        ($6, $21, $7, $8, $9, $10),
        ($11, $21, $12, $13, $14, $15),
        ($16, $21, $17, $18, $19, $20)
    `;

    await pgClient.query(query, [
      ...testUser1.getPgParamsForUserPlan(),
      ...testUser2.getPgParamsForUserPlan(),
      ...testUser3.getPgParamsForUserPlan(),
      ...testUser4.getPgParamsForUserPlan(),
      planId,
    ]);
  });

  afterAll(async () => {
    const cancelSubs = users.map((user) => stripe.subscriptions.del(user.subscriptionId));
    const detachPmntMethods = users.map((user) => stripe.paymentMethods.detach(user.pmntMethod));
    await Promise.all([...cancelSubs, ...detachPmntMethods]);
  });

  describe ('deletePlan mutation', deletePlanTest);
});