import pool from '../db/pool';

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
      json_build_object('firstName', u.first_name, 'lastName', u.last_name, 'username', u.username) AS owner
    FROM plans p
    JOIN user_plan up
    ON p.s_prod_id = up.plan_id
    JOIN users u
    ON up.username = u.username
    WHERE up.plan_owner = True AND p.s_prod_id = $1`;

  return pool.query(query, [planId]);
}


export function membersOnOnePlan(planId, username) {
  // does not include the user requesting this info
  const query = `
    SELECT
      username,
      first_name AS "firstName",
      last_name AS "lastName",
      quantity
    FROM user_on_plan
    WHERE quantity > 0 AND plan_id = $1 AND username != $2`;

  return pool.query(query, [planId, username]);
}


export function viewAllPlans(username) {
  const query = `
    WITH select1 AS
      (
        SELECT
          p.s_prod_id AS "planId",
          p.plan_name AS name,
          UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
          p.per_cycle_cost AS "perCycleCost",
          up.subscription_id AS "subscriptionId",
          up.quantity
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
      "subscriptionId",
      select1.quantity,
      json_build_object
      (
        'firstName', u.first_name,
        'lastName', u.last_name,
        'username', u.username
      ) AS owner
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
    WITH pup AS (
      SELECT p.cycle_frequency, p.per_cycle_cost, p.start_date, p.s_price_id, SUM (up.quantity) AS count
      FROM plans p
      JOIN user_plan up
      ON p.s_prod_id = up.plan_id
      WHERE p.s_prod_id = $2
      GROUP BY p.cycle_frequency, p.per_cycle_cost, p.start_date, p.s_price_id
    ),
    up AS (
      SELECT quantity
      FROM user_plan
      WHERE plan_id = $2 AND username = $1
    )
    SELECT * FROM (
      VALUES (
        (SELECT cycle_frequency FROM pup),
        (SELECT per_cycle_cost FROM pup),
        (SELECT start_date FROM pup),
        (SELECT s_price_id FROM pup),
        (SELECT count::INTEGER FROM pup),
        (SELECT quantity FROM up)
      )
    ) AS t ("cycleFrequency", "perCycleCost", "startDate", "prevPriceId", count, quantity)
  `;

  return pool.query(query, [username, planId]);
}


export function startSubscription(planId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const query = `
    WITH update_sub_id AS
    (
      INSERT INTO user_plan (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username, plan_id)
      DO UPDATE SET quantity = $1, subscription_id = $2, subscription_item_id = $3
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
    ),
    update_price_id AS
    (
      UPDATE plans SET s_price_id = $6 WHERE s_prod_id = $4
    )
    SELECT
      username,
      email,
      quantity
    FROM user_on_plan
    WHERE plan_id = $4 AND subscription_id != $2
  `;

  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, newPriceId];

  return pool.query(query, args);
}


export function updatePriceIdGetMembers(subscriptionId, newPriceId, productId) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET s_price_id = $2 WHERE s_prod_id = $3
    )
    SELECT
      username,
      email,
      subscription_id AS "subscriptionId",
      quantity
    FROM user_on_plan
    WHERE plan_id = $3 AND subscription_id != $1
  `;
  const args = [subscriptionId, newPriceId, productId];
  return pool.query(query, args);
}


export function deleteSubscription(subscriptionId) {
  return pool.query('DELETE FROM user_plan WHERE subscription_id = $1', [subscriptionId]);
}


export function checkPlanOwner(subscriptionId, username) {
  const query = `
    SELECT plan_owner AS "planOwner"
    FROM user_plan
    WHERE subscription_id = $1 AND username = $2`;
  return pool.query(query, [subscriptionId, username]);
}

export function checkNewOwner(newOwner, planId) {
  const query = `
    SELECT username FROM user_plan WHERE username = $1 AND plan_id = $2
  `;
  return pool.query(query, [newOwner, planId]);
}


export function checkSubOnPlan(planId, subscriptionId) {
  const query = `
    SELECT plan_id FROM user_plan WHERE plan_id = $1 AND subscription_id = $2
  `;
  return pool.query(query, [planId, subscriptionId]);
}


export function delSubUpdatePlanOwner(newOwner, planId, subscriptionId) {
  const query = `
    WITH del_sub AS (
      DELETE FROM user_plan WHERE subscription_id = $3
    )
    UPDATE user_plan
    SET plan_owner = True
    WHERE username = $1 AND plan_id =$2`;
  return pool.query(query, [newOwner, planId, subscriptionId]);
}
