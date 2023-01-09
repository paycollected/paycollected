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

async function delPlan(apolloClient, planId, priceId, testUser6, users) {
  // subscription status before calling mutation is 'trialing'
  let user1SubsPreStatus, user2SubsPreStatus, user3SubsPreStatus, user4SubsPreStatus;
  try {
    [
      { status: user1SubsPreStatus }, { status: user2SubsPreStatus }, { status: user3SubsPreStatus },
      { status: user4SubsPreStatus }
    ] = await Promise.all(users.map((user) => (stripe.subscriptions.retrieve(user.subscriptionId))));
  } catch (e) {
    console.log(e);
    return;
  }

  expect(user1SubsPreStatus).toBe('trialing');
  expect(user2SubsPreStatus).toBe('trialing');
  expect(user3SubsPreStatus).toBe('trialing');
  expect(user4SubsPreStatus).toBe('trialing');

  // calling mutation
  let resultPlanId, status;
  try {
    ({ data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
      mutation, variables: { planId }
    }));
  } catch (e) {
    console.log(e);
    return;
  }

  expect(resultPlanId).toBe(planId);
  expect(status).toBe('DELETED');

  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT plan_id FROM plans WHERE plan_id = $1`;

  let priceActive, productActive, notiRows, planRows;
  let user1SubsPostStatus, user2SubsPostStatus, user3SubsPostStatus, user4SubsPostStatus;
  try {
    [
      { active: priceActive }, { active: productActive }, { rows: notiRows }, { rows: planRows },
      { status: user1SubsPostStatus }, { status: user2SubsPostStatus },
      { status: user3SubsPostStatus }, { status: user4SubsPostStatus },
    ] = await Promise.all([
      stripe.prices.retrieve(priceId),
      stripe.products.retrieve(planId),
      pgClient.query(notificationsQuery, [...users.map((user) => user.username), testUser6.username]),
      pgClient.query(planQuery, [planId]),
      ...users.map((user) => (stripe.subscriptions.retrieve(user.subscriptionId)))
    ]);
  } catch (e) {
    console.log(e);
    return;
  }

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
  expect(notiRows.filter((row) => row.username === 'testUser2')[0].message)
    .toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser3')[0].message)
  .toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser4')[0].message)
    .toBe('Test1 has deleted plan Test Plan. This plan will no longer be available.');
  expect(notiRows.filter((row) => row.username === 'testUser1')).toHaveLength(0);
  expect(notiRows.filter((row) => row.username === 'testUser6')).toHaveLength(0);

  // reset subscription ID so that teardown function
  // will not call Stripe API to cancel nonexisting subscription IDs
  users.forEach((user) => { user.subscriptionId = null; });
}


async function archivePlan(apolloClient, planId, priceId, testUser6, users) {
  // convert subscription into "active" status from "trialing"
  // in our real application, this status transition occurs by the natural flow of time
  // once the trial end time approaches
  // but here we'll mimic this behavior by resetting the trial_end property of Stripe subscription

  // could technically use Stripe test clock here, though they don't allow
  // changing certain products related a customer subject during time simulation
  try {
    await Promise.all(users.map((user) => stripe.subscriptions.update(
      user.subscriptionId, { trial_end: 'now' })));
  } catch(e) {
    console.log(e);
    return;
  }

  let user1SubsPreStatus, user2SubsPreStatus, user3SubsPreStatus, user4SubsPreStatus
  try {
    [
      { status: user1SubsPreStatus }, { status: user2SubsPreStatus }, { status: user3SubsPreStatus },
      { status: user4SubsPreStatus }
    ] = await Promise.all(users.map((user) => (stripe.subscriptions.retrieve(user.subscriptionId))));
  } catch (e) {
    console.log(e);
    return;
  }


  expect(user1SubsPreStatus).toBe('active');
  expect(user2SubsPreStatus).toBe('active');
  expect(user3SubsPreStatus).toBe('active');
  expect(user4SubsPreStatus).toBe('active');

  // await new Promise(resolve => setTimeout(resolve, 3000));

  let resultPlanId, status;
  try {
    ({ data: { deletePlan: { planId: resultPlanId, status } } } = await apolloClient.mutate({
      mutation, variables: { planId }
    }));
  } catch (e) {
    console.log(e);
    return;
  }


  // NOTE THAT THIS TEST is MORE than a unit test - it is testing BOTH the deletePlan
  // mutation in this scenario (at least 1 active past billing cycle) AND our webhook
  // function for the invoice paid event (which writes to our invoice table)

  // One way to only test the mutation without involving the webhook is to use a setup in
  // which we artifically write to the invoices table (initial approach), and mock the
  // response from stripe API to produce 'active' status for the subscriptions prior to
  // calling the mutation.

  // However, at the moment our priority is in making sure that the server is doing
  // what it's supposed to do with regards to Stripe and our db, so we'll worry about
  // modularization later.

  expect(resultPlanId).toBe(planId);
  expect(status).toBe('ARCHIVED');

  const notificationsQuery = `
    SELECT username, message FROM notifications WHERE username in ($1, $2, $3, $4, $5)`;
  const planQuery = `SELECT active FROM plans WHERE plan_id = $1`;

  let priceActive, productActive, notiRows, planRows, user1SubsPostStatus, user2SubsPostStatus, user3SubsPostStatus, user4SubsPostStatus;
  try {
    [
      { active: priceActive }, { active: productActive }, { rows: notiRows }, { rows: planRows },
      { status: user1SubsPostStatus }, { status: user2SubsPostStatus },
      { status: user3SubsPostStatus }, { status: user4SubsPostStatus },
    ] = await Promise.all([
      stripe.prices.retrieve(priceId),
      stripe.products.retrieve(planId),
      pgClient.query(notificationsQuery, [...users.map((user) => user.username), testUser6.username]),
      pgClient.query(planQuery, [planId]),
      ...users.map((user) => (stripe.subscriptions.retrieve(user.subscriptionId)))
    ]);
  } catch (e) {
    console.log(e);
    return;
  }


  expect(user1SubsPostStatus).toBe('canceled');
  expect(user2SubsPostStatus).toBe('canceled');
  expect(user3SubsPostStatus).toBe('canceled');
  expect(user4SubsPostStatus).toBe('canceled');
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

  // reset subscription ID so that teardown function
  // will not call Stripe API to cancel nonexisting subscription IDs
  users.forEach((user) => { user.subscriptionId = null; });
}

module.exports = { delPlanErrors, delPlan, archivePlan };
