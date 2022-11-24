const jwt = require('jsonwebtoken');
const { ApolloClient, InMemoryCache } = require('@apollo/client');
const { pgClient, stripe } = require('../client.js');
const { delPlanErrors, delPlan, archivePlan } = require('./deletePlan.js');

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

/* testUser1 = owner of plan;
testUsers 2 - 4 are active members;
testUser5 is NOT member; but former member of an ARCHIVED plan
testUser6 used to be a member of active plan but subscription has been archived
*/
const testUser1 = new TestUser('Test1', 'User1', 'testUser1', 'test-user1@email.com', 2, true);
const testUser2 = new TestUser('Test2', 'User2', 'testUser2', 'test-user2@email.com', 1);
const testUser3 = new TestUser('Test3', 'User3', 'testUser3', 'test-user3@email.com', 3);
const testUser4 = new TestUser('Test4', 'User4', 'testUser4', 'test-user4@email.com', 2);
const testUser5 = new TestUser('Test5', 'User5', 'testUser5', 'test-user5@email.com');
const testUser6 = new TestUser('Test6', 'User6', 'testUser6', 'test-user6@email.com');
const users = [testUser1, testUser2, testUser3, testUser4];
let priceId, planId, testClockId, currentTime;

beforeAll(async () => {
  currentTime = new Date();
  currentTime = Math.ceil(currentTime.valueOf() / 1000);

  ({ id: testClockId } = await stripe.testHelpers.testClocks.create({
    frozen_time: currentTime,
    name: 'Simulation',
  }));

  const createStripeCustomers = users.map((user) => (
    stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: { username: user.username },
      test_clock: testClockId,
    })
  ));

  const resolvedPromises = await Promise.all([
      ...createStripeCustomers,
      stripe.prices.create({
        currency: 'usd', unit_amount: 525, recurring: { interval: 'week' },
        product_data: { name: 'Test Plan'},
      }),
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
      ($16, $17, $18, 'secure', $19, $20, True),
      ($21, $22, $23, 'secure', $24, null, True),
      ($25, $26, $27, 'secure', $28, null, True)
    )
    INSERT INTO plans (
      plan_id, price_id, plan_name, cycle_frequency, per_cycle_cost, start_date, active
    ) VALUES
    ( $29,
      $30,
      'Test Plan',
      'weekly',
      4000,
      CURRENT_TIMESTAMP,
      True
    ),
    ( 'prod_archivedPlanId',
      'archivedPriceId',
      'Some Archived Plan',
      'monthly',
      7489,
      CURRENT_TIMESTAMP - interval '1 year',
      False
    )
  `;
  await pgClient.connect();
  await pgClient.query(query, [
    ...testUser1.getPgParamsForUsers(),
    ...testUser2.getPgParamsForUsers(),
    ...testUser3.getPgParamsForUsers(),
    ...testUser4.getPgParamsForUsers(),
    ...testUser5.getPgParamsForUsers().slice(0, -1),
    ...testUser6.getPgParamsForUsers().slice(0, -1),
    product, priceId,
  ]);
});

afterAll(async () => {
  const delStripeCustomers = users.map((user) => stripe.customers.del(user.stripeId));
  const query = `
    WITH del AS (DELETE FROM plans WHERE plan_id IN ($1, 'prod_archivedPlanId'))
    DELETE FROM users WHERE username LIKE 'testUser_'
  `;
  await Promise.all([
    ...delStripeCustomers,
    pgClient.query(query, [planId]),
    stripe.prices.update(priceId, { active: false }),
    stripe.products.update(planId, { active: false }),
    stripe.testHelpers.testClocks.del(testClockId),
  ]);
  await pgClient.end();
});

describe('deletePlan mutation', () => {
  let generateApolloClient;
  let generateToken;

  const beforeSetup = async () => {
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

    try {
      await Promise.all(attachPmntMethods);
    } catch (e) {
      console.log(e);
    }

    const createSetupIntents = users.map((user, i) => stripe.setupIntents.create({
      customer: user.stripeId,
      confirm: true,
      payment_method: pmntMethods[i].id,
    }));

    const setupIntents = await Promise.all(createSetupIntents);

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
        username, plan_id, plan_owner, quantity, subscription_id, subscription_item_id, active
      ) VALUES
        ($1, $24, $2, $3, $4, $5, True),
        ($6, $24, $7, $8, $9, $10, True),
        ($11, $24, $12, $13, $14, $15, True),
        ($16, $24, $17, $18, $19, $20, True),
        ($21, $24, $22, $23, null, null, False),
        ($25, 'prod_archivedPlanId', True, 0, null, null, False)
    `;

    try {
      await pgClient.query(query, [
        ...testUser1.getPgParamsForUserPlan(),
        ...testUser2.getPgParamsForUserPlan(),
        ...testUser3.getPgParamsForUserPlan(),
        ...testUser4.getPgParamsForUserPlan(),
        ...testUser6.getPgParamsForUserPlan().slice(0, -2),
        planId,
        testUser5.username,
      ]);
    } catch (e) {
      console.log(e);
    }

    // currentTime = currentTime + 60 * 60;
    // try {
    //   await stripe.testHelpers.testClocks.advance(
    //     testClockId,
    //     { frozen_time: currentTime }
    //   );
    // } catch (e) {
    //   console.log(e);
    // }

    generateToken = (user) => (
      jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 5),
        user: { username: user.username, stripeCusId: user.stripeId },
      },
      process.env.SIGNIN_SECRET_KEY)
    );

    generateApolloClient = (authHeader) => (new ApolloClient({
      uri: 'http://localhost:5647/graphql',
      headers: {
        'Authorization': authHeader,
      },
      cache: new InMemoryCache(),
    }));
  };

  const afterSetup = async () => {
    let promises = users.map((user) => stripe.paymentMethods.detach(user.pmntMethod));
    const insertPlan = `
    INSERT INTO plans (
      plan_id, price_id, plan_name, cycle_frequency, per_cycle_cost, start_date, active
    ) VALUES
    ($1, $2, 'Test Plan', 'weekly', 4000, CURRENT_TIMESTAMP, True)
    ON CONFLICT (plan_id) DO NOTHING
  `;
    if (users.every((user) => user.subscriptionId === null)) {
      // if previous test has successfully deleted/archived plan
      // want to reset up stripe + our db
      promises = [
        ...promises,
        stripe.prices.update(priceId, { active: true }),
        stripe.products.update(planId, { active: true }),
        pgClient.query(insertPlan, [planId, priceId]),
      ];
    } else {
      promises = [
        ...promises,
        ...users.map((user) => stripe.subscriptions.del(user.subscriptionId))
      ]
    }
    const deleteUserPlanAndNotifications = `
    WITH del_noti AS (DELETE FROM notifications WHERE username LIKE 'testUser_')
      DELETE FROM user_plan WHERE username LIKE 'testUser_'
    `;
    try {
      await Promise.all([...promises, pgClient.query(deleteUserPlanAndNotifications)]);
    } catch (e) {
      console.log(e);
    }
  };

  describe('should handle error input', () => {
    beforeAll(beforeSetup);
    afterAll(afterSetup);

    it('should throw an error if a member tries to delete the plan', () =>
    delPlanErrors(generateApolloClient(generateToken(testUser2)), planId,
      'Non-plan owner cannot perform this action')
    );

    it('should throw an error if a non-member tries to delete the plan', () =>
      delPlanErrors(generateApolloClient(generateToken(testUser5)), planId,
        'User is not on plan')
      );

    it(`should throw an error if a former member whose subscription has already
    been archived tries to delete plan`, () =>
      delPlanErrors(generateApolloClient(generateToken(testUser6)), planId,
        'Subscription has already been archived')
      );

    it('should throw an error if an owner tries to delete an archived plan', () =>
      delPlanErrors(generateApolloClient(generateToken(testUser5)), 'prod_archivedPlanId',
        'Plan has already been archived')
      );
  });

  describe('should delete or archive a plan correctly', () => {
    beforeEach(beforeSetup);
    afterEach(afterSetup);

    it('should delete a plan if the plan has never had an active billing cycle', () =>
      delPlan(generateApolloClient(generateToken(testUser1)), planId, priceId, testUser1, testUser2, testUser3, testUser4, testUser6, testClockId, currentTime)
    );

    it('should archive a plan if the plan has had at least one active billing cycle', () =>
      archivePlan(generateApolloClient(generateToken(testUser1)), planId, priceId, testUser1, testUser2, testUser3, testUser4, testUser6)
    );
  });
});
