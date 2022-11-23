const { pgClient, stripe } = require('../client.js');
const { gql, ApolloClient, InMemoryCache } = require('@apollo/client');
const jwt = require('jsonwebtoken');
const { formatInTimeZone } = require('date-fns-tz');

let customerId;
let apolloClient;
let status;

const mutation = gql`
  mutation CreatePlanMutation (
    $planName: String!, $cycleFrequency: CycleFrequency!, $perCycleCost: Float!, $startDate: Date!) {
    createPlan(planName: $planName, cycleFrequency: $cycleFrequency, perCycleCost: $perCycleCost, startDate: $startDate) {
      planId
      status
    }
  }`;

beforeAll(async () => {
  ({ id: customerId } = await stripe.customers.create({
    email: 'test-user@email.com',
    name: 'Test User',
    metadata: { username: 'testUser' },
  }));

  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 5),
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
});

describe('createPlan mutation', () => {
  let planId;
  let priceId;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  afterAll(async () => {
    const promises = [pgClient.query('DELETE FROM plans WHERE plan_id = $1', [planId])];
    if (planId) promises.push(stripe.products.update(planId, { active: false }));
    if (priceId) promises.push(stripe.prices.update(priceId, { active: false }));
    await Promise.all(promises);
  });

  it('Should create a new test plan', async () => {
    ({ data: { createPlan: { planId, status } }} = await apolloClient.mutate({
      mutation,
      variables: {
        planName: 'Test Plan',
        cycleFrequency: 'WEEKLY',
        perCycleCost: 49.87,
        startDate: `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${(tomorrow.getDate()).toString().padStart(2, '0')}`,
      }
    }));

    expect(status).toBe('CREATED');

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
        up.subscription_item_id AS "subscriptionItemId",
        ph.start_date AS "priceStartDate",
        ph.end_date AS "priceEndDate",
        ph.plan_cost AS "pricePerCycleCost"
      FROM plans p
      JOIN user_plan up
      ON p.plan_id = up.plan_id
      JOIN plans_history ph
      ON up.plan_id = ph.plan_id
      WHERE p.plan_id = $1
    `;

    const { rows } = await pgClient.query(query, [planId]);

    expect(rows).toHaveLength(1);

    const {
      planName, cycleFrequency, perCycleCost, startDate, planActive, quantity, planOwner,
      subscriptionActive, subscriptionId, subscriptionItemId, priceStartDate, priceEndDate,
      pricePerCycleCost,
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
    expect(subscriptionId).toBeNull();
    expect(subscriptionItemId).toBeNull();
    expect(perCycleCost).toBe(pricePerCycleCost);
    expect(priceEndDate).toBe(Infinity);
    expect(priceStartDate).toBeInstanceOf(Date);
    expect(priceStartDate).toMatchObject(startDate);
    expect(startDate).toMatchObject(priceStartDate);
    expect(formatInTimeZone(startDate, 'America/New_York', 'yyyy-MM-dd HH:mm:ss zzz')).toBe(`${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()} 23:59:59 EST`);
  });

  it('Should throw an error if start date is before tomorrow', async () => {
    const today = new Date();
    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: 'WEEKLY',
          perCycleCost: 49.87,
          startDate: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${(today.getDate()).toString().padStart(2, '0')}`,
        }
      });
    } catch (e) {
      expect(e.message).toBe('Invalid start date');
    }
  });

  it('Should throw an error if start date is after a month from tomorrow', async () => {
    const day = new Date();
    day.setMonth(day.getMonth() + 2);
    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: 'WEEKLY',
          perCycleCost: 49.87,
          startDate: `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${(day.getDate()).toString().padStart(2, '0')}`,
        }
      });
    } catch (e) {
      expect(e.message).toBe('Invalid start date');
    }
  });

  it('Should throw an error if startDate is not the correct type', async () => {
    const random = 'some random string';
    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: 'WEEKLY',
          perCycleCost: 49.87,
          startDate: random,
        }
      });
    } catch (e) {
      expect(e.message).toBe(`Variable "$startDate" got invalid value "${random}"; Date cannot represent an invalid date-string ${random}.`)
    }
  });

  it('Should throw an error if cycleFrequency is not the correct type', async () => {
    const randomStr = 'some random string';

    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: randomStr,
          perCycleCost: 49.87,
          startDate: `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${(tomorrow.getDate()).toString().padStart(2, '0')}`,
        }
      });
    } catch (e) {
      expect(e.message).toBe(`Variable "$cycleFrequency" got invalid value "${randomStr}"; Value "${randomStr}" does not exist in "CycleFrequency" enum.`);
    }
  });

  it('Should throw an error if plan cost is less than $10', async () => {
    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: 'WEEKLY',
          perCycleCost: 9.75,
          startDate: `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${(tomorrow.getDate()).toString().padStart(2, '0')}`,
        }
      });
    } catch (e) {
      expect(e.message).toBe('Invalid cost');
    }
  });

  it('Should throw an error if plan cost is not a full number in cents', async () => {
    try {
      await apolloClient.mutate({
        mutation,
        variables: {
          planName: 'Test Plan',
          cycleFrequency: 'WEEKLY',
          perCycleCost: 12.75982,
          startDate: `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${(tomorrow.getDate()).toString().padStart(2, '0')}`,
        }
      });
    } catch (e) {
      expect(e.message).toBe('Invalid cost');
    }
  });
});
