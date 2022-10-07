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


export function createUser(firstName, lastName, username, password, email) {
  const query = `
    INSERT INTO users
      (first_name, last_name, username, password, email)
    VALUES
      ($1, $2, $3, $4, $5)
  `;
  const args = [firstName, lastName, username, password, email];
  return pool.query(query, args);
}


export function addPlan(username, planName, cycleFrequency, perCycleCost, sProdId, sPriceId, perCyclePerPersonCost, maxQuantity, startDate) {
  const query = `
    WITH first_insert AS
      (
        INSERT INTO plans
          (plan_name, cycle_frequency, per_cycle_cost, per_user_per_cycle_cost, s_prod_id, s_price_id, max_quantity, start_date)
        VALUES
          ($2, $3, $4, $5, $6, $7, $8, $9::BIGINT / 1000)
      )
    INSERT INTO user_plan
      (username, plan_id, plan_owner)
    VALUES
      ($1, $6, TRUE)
  `;
  const args = [username, planName, cycleFrequency, perCycleCost, perCyclePerPersonCost, sProdId, sPriceId, maxQuantity, startDate];
  return pool.query(query, args);
}


export function viewOnePlan(planId) {
  const query = `
    SELECT
      p.plan_name AS name,
      UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
      p.per_cycle_cost AS "perCycleCost",
      p.max_quantity AS "maxQuantity",
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


export function saveStripeCusId(username, sCusId) {
  const query = `
    UPDATE users
    SET s_cus_id = $1
    WHERE username = $2`;
  return pool.query(query, [sCusId, username]);
}


export function getPriceId(planId) {
  const query = `
    SELECT s_price_id AS "sPriceId"
    FROM plans
    WHERE s_prod_id = $1`;
  return pool.query(query, [planId]);
}


export function addSubscriptionId(planId, quantity, subscriptionId, username) {
  const query = `
    INSERT INTO user_plan (quantity, subscription_id, plan_id, username)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (username, plan_id)
    DO UPDATE SET quantity = user_plan.quantity + $1, subscription_id = $2
    WHERE user_plan.username = $4 AND user_plan.plan_id = $3
  `;

  return pool.query(query, [quantity, subscriptionId, planId, username]);
}
