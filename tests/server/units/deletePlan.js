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
  apolloClient, planId, priceId, testUser1, testUser2, testUser3, testUser4, testUser6
) {
  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT plan_id FROM plans WHERE plan_id = $1`;

  const { data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
    mutation, variables: { planId }
  });

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

module.exports = { delPlanErrors, delPlan };
