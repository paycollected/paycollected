const { pgClient, stripe } = require('../client.js');
const { gql, ApolloClient, InMemoryCache } = require('@apollo/client');
const jwt = require('jsonwebtoken');

let customerId;
let apolloClient;

beforeAll(async () => {
  ({ id: customerId } = await stripe.customers.create({
    email: 'test-user@email.com',
    name: 'Test User',
    metadata: { username: 'testUser' },
  }));

  const token = jwt.sign({
    // expires after 30 mins
    exp: Math.floor(Date.now() / 1000) + (60 * 30),
    user: {
      username: 'testUser',
      stripeCusId: customerId,
    }
  }, process.env.SIGNIN_SECRET_KEY);

  apolloClient = new ApolloClient({
    uri: 'http://localhost:5647/graphql',
    headers: {
      'Authorization': token,
    },
    cache: new InMemoryCache(),
  });

  const query = `
    INSERT INTO users
      (username, first_name, last_name, password, email, s_cus_id, verified)
    VALUES ('testUser', 'Test', 'User', 'secure', 'test-user@email.com', $1, True)`;
  await pgClient.connect();
  await pgClient.query(query, [customerId]);
});

afterAll(async () => {
  await Promise.all([
    stripe.customers.del(customerId),
    pgClient.query("DELETE FROM users WHERE username = 'testUser'"),
  ]);
  await pgClient.end();
})

describe('createPlan mutation', () => {
  let planId;
  let priceId;

  afterAll(async() => {
    const promises = [pgClient.query('DELETE FROM plans WHERE plan_id = $1', [planId])];
    if (planId) promises.push(stripe.products.update(planId, { active: false }));
    if (priceId) promises.push(stripe.prices.update(priceId, { active: false }));
    await Promise.all(promises);
  });

  it('Should create a new test plan', async () => {
    ({ data: { createPlan: { planId } }} = await apolloClient.mutate({
      mutation: gql`
        mutation CreatePlanMutation (
          $planName: String!, $cycleFrequency: CycleFrequency!, $perCycleCost: Float!, $startDate: Date!, $timeZone: TimeZone!) {
          createPlan(planName: $planName, cycleFrequency: $cycleFrequency, perCycleCost: $perCycleCost, startDate: $startDate, timeZone: $timeZone) {
            planId
          }
        }
      `,
      variables: {
        planName: 'Test Plan',
        cycleFrequency: 'WEEKLY',
        perCycleCost: 49.87,
        startDate: '2022-11-23',
        timeZone: 'EASTERN',
      }
    }));

    expect(1).toBe(1);

    const query = `
      SELECT
        p.price_id AS "priceId",
        p.plan_name AS "planName",
        CASE
          WHEN p.cycle_frequency = 'weekly' THEN 'week'
          WHEN p.cycle_frequency = 'monthly' THEN 'month'
          ELSE 'year'
        END AS "cycleFrequency",
        p.per_cycle_cost AS "perCycleCost",
        p.start_date AS "startDate",
        p.active AS "planActive",
        up.quantity,
        up.plan_owner AS "planOwner",
        up.active AS "subscriptionActive",
        up.subscription_id AS "subscriptionId",
        up.subscription_item_id AS "subscriptionItemId"
      FROM plans p
      JOIN user_plan up
      ON p.plan_id = up.plan_id
      WHERE p.plan_id = $1;
    `;
    const { rows } = await pgClient.query(query, [planId]);
    expect(rows.length).toBe(1);
    const {
      planName, cycleFrequency, perCycleCost, startDate, planActive, quantity, planOwner,
      subscriptionActive, subscriptionId, subscriptionItemId
    } = rows[0];
    priceId = rows[0].priceId;
    const [product, price] = await Promise.all([stripe.products.retrieve(planId), stripe.prices.retrieve(priceId)]);
    expect(price.product).toBe(planId);
    expect(price.unit_amount).toBe(perCycleCost);
    expect(price.unit_amount).toBe(4987);
    expect(price.billing_scheme).toBe('per_unit');
    expect(price.type).toBe('recurring');
    expect(price.unit_amount).toBe(perCycleCost);
    expect(price.active).toBe(true);
    expect(price.recurring.interval).toBe(cycleFrequency);
    expect(price.recurring.interval).toBe('week');
    expect(price.recurring.interval_count).toBe(1);
    expect(product.active).toBe(true);
    expect(product.name).toBe(planName);
    expect(product.name).toBe('Test Plan');
    expect(planOwner).toBe(true);
    expect(quantity).toBe(0);
    expect(planActive).toBe(true);
    expect(subscriptionActive).toBe(true);
    expect(subscriptionId).toBe(null);
    expect(subscriptionItemId).toBe(null);
  });

  // test('Should throw an error if cycleFrequency is not the correct type', () => {

  // });

  // test('Should throw an error if startDate is not the correct type', () => {

  // })
});
