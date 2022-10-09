import pool from '../db/pool.js';

export function checkUser(username, email) {
  const query = `SELECT
    username, email
    FROM users
    WHERE (username = $1)
    OR (email = $2)
    LIMIT 1`;

  return pool.query(query, [username, email]);
}


export function createUser(firstName, lastName, username, password, email, stripeCusId) {
  const query = `
    INSERT INTO users
      (first_name, last_name, username, password, email, s_cus_id)
    VALUES
      ($1, $2, $3, $4, $5, $6)
  `;
  const args = [firstName, lastName, username, password, email, stripeCusId];
  return pool.query(query, args);
}


export function addPlan(username, planName, cycleFrequency, perCycleCost, productId, startDate) {
  const query = `
    WITH first_insert AS
      (
        INSERT INTO plans
          (plan_name, cycle_frequency, per_cycle_cost, s_prod_id, start_date)
        VALUES
          ($2, $3, $4, $5, $6::BIGINT)
      )
    INSERT INTO user_plan
      (username, plan_id, plan_owner)
    VALUES
      ($1, $5, TRUE)
  `;
  const args = [username, planName, cycleFrequency, perCycleCost, productId, startDate];
  return pool.query(query, args);
}


export function viewOnePlan(planId) {
  const query = `
    SELECT
      p.plan_name AS name,
      UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
      p.per_cycle_cost AS "perCycleCost",
      json_build_object('firstName', u.first_name, 'lastName', u.last_name, 'username', u.username, 'stripeCusId', u.s_cus_id) AS owner
    FROM plans p
    JOIN user_plan up
    ON p.s_prod_id = up.plan_id
    JOIN users u
    ON up.username = u.username
    WHERE up.plan_owner = True AND p.s_prod_id = $1`;

  return pool.query(query, [planId]);
}


export function membersOnOnePlan(planId) {
  const query = `
    SELECT
      up.username AS username,
      u.s_cus_id AS "stripeCusId",
      u.first_name AS "firstName",
      u.last_name AS "lastName",
      up.quantity AS quantity
    FROM user_plan up
    JOIN users u
    ON up.username = u.username
    WHERE up.quantity > 0 AND up.plan_id = $1`;

  return pool.query(query, [planId]);
}


export function viewAllPlans(username) {
  const query = `
    WITH select1 AS
      (
        SELECT
          p.s_prod_id AS "planId",
          p.plan_name AS name,
          UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
          p.per_cycle_cost AS "perCycleCost"
        FROM plans p
        JOIN user_plan up
        ON p.s_prod_id = up.plan_id
        WHERE up.username = $1
      )
    SELECT
      "planId",
      name,
      "cycleFrequency",
      "perCycleCost",
      json_build_object('firstName', u.first_name, 'lastName', u.last_name, 'username', u.username, 'stripeCusId', u.s_cus_id) AS owner
    FROM select1
    JOIN user_plan up
    ON "planId" = up.plan_id
    JOIN users u
    ON up.username = u.username
    WHERE up.plan_owner = True`;

  return pool.query(query, [username]);
}


export function getUserInfo(username) {
  const query = `
    SELECT s_cus_id AS "stripeCusId", first_name AS "firstName", last_name AS "lastName", email, password
    FROM users
    WHERE username = $1`;
  return pool.query(query, [username]);
}


export function joinPlan(username, planId) {
  const query = `
    WITH p AS (
      SELECT cycle_frequency, per_cycle_cost, start_date
      FROM plans
      WHERE s_prod_id = $2
    ),
    u AS (
      SELECT email, s_cus_id FROM users WHERE username = $1
    ),
    up1 AS (
      SELECT quantity
      FROM user_plan
      WHERE plan_id = $2 AND username = $1
    ),
    up2 AS (
      SELECT SUM (quantity) AS count
      FROM user_plan
      WHERE plan_id = $2
    )
    SELECT * FROM (
      VALUES (
        (SELECT cycle_frequency FROM p),
        (SELECT per_cycle_cost FROM p),
        (SELECT start_date FROM p),
        (SELECT email FROM u),
        (SELECT s_cus_id FROM u),
        (SELECT quantity FROM up1),
        (SELECT count::INTEGER FROM up2)
      )
    ) AS t ("cycleFrequency", "perCycleCost", "startDate", email, "sCusId", quantity, count);
  `;

  return pool.query(query, [username, planId]);
}


export function updatePriceOnJoining(planId, quantity, subscriptionId, subscriptionItemId, username) {
  /*
  this query does 2 things:
  1) the INSERT / UPDATE clauses store information about a certain subscription plan in our datastore
  2) the SELECT clause return all the stripe subscriptions that are on the same product (plan),
  so we can call stripe API to update their prices later
  */
  const query = `
    WITH update_sub_id AS
    (
      INSERT INTO user_plan (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username, plan_id)
      DO UPDATE SET quantity = user_plan.quantity + $1, subscription_id = $2, subscription_item_id = $3
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
    )
    SELECT username, subscription_id AS "subscriptionId", subscription_item_id AS "subscriptionItemId", quantity
    FROM user_plan
    WHERE plan_id = $4 AND username != $5;
  `;

  return pool.query(query, [quantity, subscriptionId, subscriptionItemId, planId, username]);
}


export function getPriceId(planId) {
  return pool.query('SELECT s_price_id AS "sPriceId" FROM plans WHERE s_prod_id = $1', [planId]);
}


export function saveNewPriceId(newPriceId, planId) {
  return pool.query('UPDATE plans SET s_price_id = $1 WHERE s_prod_id = $2', [newPriceId, planId]);
}
