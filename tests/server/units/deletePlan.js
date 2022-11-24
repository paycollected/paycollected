const { pgClient, stripe } = require('../client.js');
const { gql } = require('@apollo/client');

const mutation = gql`
mutation DeletePlan($planId: PlanID!) {
  deletePlan(planId: $planId) {
    planId
    status
  }
}
`;

async function delPlanErrors(apolloClient, planId, expectedError) {
  try {
    await apolloClient.mutate({ mutation, variables: { planId } });
  } catch (e) {
    expect(e.message).toBe(expectedError);
  }
}

async function delPlan(
  apolloClient, planId, priceId, testUser1, testUser2, testUser3, testUser4, testUser6,
  testClockId, currentTime,
) {
  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT plan_id FROM plans WHERE plan_id = $1`;

  // const before = await stripe.subscriptions.retrieve(testUser1.subscriptionId);

  // NOTE: The ideal test should get the status of all subscriptions from stripe BEFORE invoking
  // this mutation and shows that their status is "active". Then grab the status of these subs once
  // again AFTER the mutation and the status should be "cancelled".

  // However this is currently unachievable using Jest testing environment due to these events
  // being time-dependent. It takes an hour between an invoice being finalized on Stripe system
  // and a charge attempt being made (which will convert subs status to active). In theory, we could
  // mimic this time flow using Stripe test clock. However, advancing "fake time" using Stripe
  // test clocks also requires waiting a few seconds before time is advanced to the chosen point.
  // So test assertions made prior to the readiness of the test clock will be incorrect.
  // Jest and tests generally don't support waiting in real time using setTimeout or setIntervals.
  // The tests are done running before these setTimeouts are even finished.

  const { data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
    mutation, variables: { planId }
  });

  // const after = await stripe.subscriptions.retrieve(testUser1.subscriptionId);

  expect(resultPlanId).toBe(planId);
  expect(status).toBe('DELETED');

  const [
    { active: priceActive },
    { active: productActive },
    { rows: notiRows },
    { rows: planRows }
  ] = await Promise.all([
    stripe.prices.retrieve(priceId),
    stripe.products.retrieve(planId),
    pgClient.query(notificationsQuery, [
      testUser1.username, testUser2.username, testUser3.username, testUser4.username, testUser6.username
    ]),
    pgClient.query(planQuery, [planId]),
  ]);

  expect(priceActive).toBe(false);
  expect(productActive).toBe(false);
  expect(planRows).toHaveLength(0);
  expect(notiRows).toHaveLength(3);
  expect(notiRows.filter((row) => row.username === 'testUser2')[0].message).toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser3')[0].message).toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser4')[0].message).toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser1')).toHaveLength(0);
  expect(notiRows.filter((row) => row.username === 'testUser6')).toHaveLength(0);

  // reset subscription ID so that clean up function
  // will not call Stripe API to cancel nonexisting subscription IDs
  [testUser1, testUser2, testUser3, testUser4].forEach((user) => { user.subscriptionId = null; });
}


async function archivePlan(
  apolloClient, planId, priceId, testUser1, testUser2, testUser3, testUser4, testUser6
) {
  const addInvoice = `
    INSERT INTO invoices (invoice_id, username, plan_id, quantity, charge_date, paid_amount)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
  `;
  await pgClient.query(addInvoice, ['randomInvoiceId', testUser1.username, planId, testUser1.quantity, 105]);

  const { data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
    mutation, variables: { planId }
  });

  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT active FROM plans WHERE plan_id = $1`;

  expect(resultPlanId).toBe(planId);
  expect(status).toBe('ARCHIVED');

  const [
    { active: priceActive },
    { active: productActive },
    { rows: notiRows },
    { rows: planRows }
  ] = await Promise.all([
    stripe.prices.retrieve(priceId),
    stripe.products.retrieve(planId),
    pgClient.query(notificationsQuery, [
      testUser1.username, testUser2.username, testUser3.username, testUser4.username, testUser6.username
    ]),
    pgClient.query(planQuery, [planId]),
  ]);

  expect(priceActive).toBe(false);
  expect(productActive).toBe(false);
  expect(planRows).toHaveLength(1);
  expect(planRows[0].active).toBe(false);
  expect(notiRows).toHaveLength(3);
  expect(notiRows.filter((row) => row.username === 'testUser2')[0].message).toBe(
    'Test1 has archived plan Test Plan. This plan will no longer be available, but you can still access its past invoices and activity.');
  expect(notiRows.filter((row) => row.username === 'testUser3')[0].message).toBe(
    'Test1 has archived plan Test Plan. This plan will no longer be available, but you can still access its past invoices and activity.');
  expect(notiRows.filter((row) => row.username === 'testUser4')[0].message).toBe(
    'Test1 has archived plan Test Plan. This plan will no longer be available, but you can still access its past invoices and activity.');
  expect(notiRows.filter((row) => row.username === 'testUser1')).toHaveLength(0);
  expect(notiRows.filter((row) => row.username === 'testUser6')).toHaveLength(0);

  // reset subscription ID so that clean up function
  // will not call Stripe API to cancel nonexisting subscription IDs
  [testUser1, testUser2, testUser3, testUser4].forEach((user) => { user.subscriptionId = null; });
}

module.exports = { delPlanErrors, delPlan, archivePlan };
