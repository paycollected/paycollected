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
  // subscription status before calling mutation is 'trialing'
  const [
    { status: user1SubsPreStatus }, { status: user2SubsPreStatus }, { status: user3SubsPreStatus },
    { status: user4SubsPreStatus }
  ] = await Promise.all([testUser1, testUser2, testUser3, testUser4].map((user) => (
    stripe.subscriptions.retrieve(user.subscriptionId)
  )));

  expect(user1SubsPreStatus).toBe('trialing');
  expect(user2SubsPreStatus).toBe('trialing');
  expect(user3SubsPreStatus).toBe('trialing');
  expect(user4SubsPreStatus).toBe('trialing');

  // calling mutation
  const { data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
    mutation, variables: { planId }
  });

  expect(resultPlanId).toBe(planId);
  expect(status).toBe('DELETED');


  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT plan_id FROM plans WHERE plan_id = $1`;

  const [
    { active: priceActive }, { active: productActive }, { rows: notiRows }, { rows: planRows },
    { status: user1SubsPostStatus }, { status: user2SubsPostStatus }, { status: user3SubsPostStatus },
    { status: user4SubsPostStatus }
  ] = await Promise.all([
    stripe.prices.retrieve(priceId),
    stripe.products.retrieve(planId),
    pgClient.query(notificationsQuery, [
      testUser1.username, testUser2.username, testUser3.username, testUser4.username,
      testUser6.username,
    ]),
    pgClient.query(planQuery, [planId]),
    ...[testUser1, testUser2, testUser3, testUser4].map((user) => (
      stripe.subscriptions.retrieve(user.subscriptionId)
    ))
  ]);

  // subscription status after calling mutation is 'cancelled'
  expect(user1SubsPostStatus).toBe('canceled');
  expect(user2SubsPostStatus).toBe('canceled');
  expect(user3SubsPostStatus).toBe('canceled');
  expect(user4SubsPostStatus).toBe('canceled');

  // price and product ID are archived on stripe system
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

  currentTime = currentTime + 60 * 60 * 24;
  try {
    await stripe.testHelpers.testClocks.advance(
      testClockId,
      { frozen_time: currentTime }
    );
  } catch (e) {
    console.log(e);
  }
await new Promise(resolve => setTimeout(resolve, 12000));

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
