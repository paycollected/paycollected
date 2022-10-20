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


export function viewOnePlan(planId, username) {
  const query = `
    WITH select_owner AS (
      SELECT
        JSON_BUILD_OBJECT(
          'firstName', u.first_name,
          'lastName', u.last_name,
          'username', u.username
        ) AS owner
      FROM users u
      JOIN user_plan up
      ON u.username = up.username
      WHERE up.plan_owner = True AND up.plan_id = $1
    )
    SELECT p.s_prod_id AS "planId",
    p.plan_name AS name,
    UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
    p.per_cycle_cost AS "perCycleCost",
    COALESCE(
      ( SELECT quantity
        FROM user_on_plan
        WHERE username = $2 AND plan_id = $1
      ),
      0
    ) AS quantity,
    (SELECT owner FROM select_owner)
    FROM plans p
    WHERE p.s_prod_id = $1`;

  return pool.query(query, [planId, username]);
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
      JSON_BUILD_OBJECT
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
    WHERE up.plan_owner = True
    ORDER BY name ASC`;

  return pool.query(query, [username]);
}


export function getUserInfo(username) {
  const query = `
    SELECT
      s_cus_id AS "stripeCusId",
      first_name AS "firstName",
      last_name AS "lastName",
      email,
      password
    FROM users
    WHERE username = $1`;
  return pool.query(query, [username]);
}


export function joinPlan(username, planId) {

  const query = `
    SELECT
      p.cycle_frequency AS "cycleFrequency",
      p.per_cycle_cost AS "perCycleCost",
      p.start_date AS "startDate",
      p.s_price_id AS "prevPriceId",
      SUM (up.quantity)::INTEGER AS count,
      COALESCE(
        ( SELECT quantity
          FROM user_plan
          WHERE plan_id = $2 AND username = $1
        ),
        0
      ) AS quantity
    FROM plans p
    JOIN user_plan up
    ON p.s_prod_id = up.plan_id
    WHERE p.s_prod_id = $2
    GROUP BY
      p.cycle_frequency,
      p.per_cycle_cost,
      p.start_date,
      p.s_price_id
  `;

  return pool.query(query, [username, planId]);
}


export function startSubscription(planId, quantity, subscriptionId, subscriptionItemId, username, newPriceId) {
  const query = `
    WITH update_sub_id AS
    (
      INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES
        ($1, $2, $3, $4, $5)
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
    ),
    update_price_id AS
    (
      UPDATE plans
      SET s_price_id = $6
      WHERE s_prod_id = $4
    ),
    update_pending_subs AS (
      UPDATE pending_subs
      SET paid = True
      WHERE subscription_id = $2
    )
    SELECT
      username,
      email,
      subscription_id AS "subscriptionId",
      subscription_item_id AS "subscriptionItemId",
      quantity
    FROM user_on_plan
    WHERE plan_id = $4 AND subscription_id != $2
  `;

  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, newPriceId];

  return pool.query(query, args);
}


export function updatePriceIdDelSubsGetMembers(newPriceId, productId, subscriptionId) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET s_price_id = $1 WHERE s_prod_id = $2
    ), del_sub AS (
      DELETE FROM user_plan
      WHERE subscription_id = $3
    )
    SELECT
      username,
      email,
      subscription_id AS "subscriptionId",
      subscription_item_id AS "subscriptionItemId",
      quantity
    FROM user_on_plan
    WHERE plan_id = $2 and subscription_id != $3
  `;
  const args = [newPriceId, productId, subscriptionId];
  return pool.query(query, args);
}


export function deleteSubscription(subscriptionId) {
  return pool.query('DELETE FROM user_plan WHERE subscription_id = $1', [subscriptionId]);
}


export function checkPlanOwnerUsingSubsId(subscriptionId, username) {
  const query = `
    SELECT
      plan_owner AS "planOwner",
      plan_id AS "planId"
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


export function getSubsItemIdAndProductInfo(subscriptionId, username) {
  const query = `
    WITH c AS (
      SELECT plan_id, SUM(quantity)
      FROM user_plan
      GROUP BY plan_id
    )
    SELECT
      up.plan_id AS "product",
      up.subscription_item_id AS "subscriptionItemId",
      up.quantity,
      p.cycle_frequency::VARCHAR AS "cycleFrequency",
      p.per_cycle_cost AS "perCycleCost",
      p.s_price_id AS "prevPriceId",
      c.sum AS count
    FROM user_plan up
    JOIN plans p
    ON up.plan_id = p.s_prod_id
    JOIN c
    ON up.plan_id = c.plan_id
    WHERE up.subscription_id = $1 and up.username = $2`;
  return pool.query(query, [subscriptionId, username]);
}


export function updatePriceIdAndSubsQuant(newPriceId, productId, newQuantity, subscriptionId) {
  const query = `
    WITH update_price AS (
      UPDATE plans SET s_price_id = $1 WHERE s_prod_id = $2
    )
    UPDATE user_plan SET quantity = $3 WHERE subscription_id = $4
  `;
  return pool.query(query, [newPriceId, productId, newQuantity, subscriptionId])
}

export function getMembersOnPlan(planId, subscriptionId) {
  const query = `
  SELECT
    username,
    email,
    subscription_id AS "subscriptionId",
    subscription_item_id AS "subscriptionItemId",
    quantity
  FROM user_on_plan
  WHERE plan_id = $1 AND subscription_id != $2
  `;
  return pool.query(query, [planId, subscriptionId]);
}


export function checkPlanOwnerUsingPlanIdGetOneSub(planId, username) {
  const query = `
  WITH owner AS (
    SELECT quantity, subscription_id
    FROM user_plan
    WHERE plan_id = $1 AND username = $2 AND plan_owner = True
  )
  SELECT *
  FROM (
    VALUES (
      (
        SELECT quantity
        FROM owner
      ),
      (
        SELECT subscription_id
        FROM owner
      ),
      (
        SELECT s_price_id
        FROM plans
        WHERE s_prod_id = $1
      ),
      (
        SELECT subscription_id
        FROM user_plan
        WHERE plan_id = $1 AND plan_owner = False
        LIMIT 1
      )
    )
  )
  AS temp (
    "ownerQuant",
    "ownerSubsId",
    "priceId",
    "memberSubsId"
  )
  `;
  return pool.query(query, [planId, username]);
}


export function deletePlanGetAllSubs(planId) {
  const query = `
    WITH del_plan AS (
      DELETE FROM plans WHERE s_prod_id = $1
    )
    SELECT
      first_name AS "firstName",
      email,
      subscription_id AS "subscriptionId"
    FROM user_on_plan
    WHERE plan_id = $1
  `;
  return pool.query(query, [planId]);
}


export function deletePlan(planId) {
  const query = `DELETE FROM plans WHERE s_prod_id = $1`;
  return pool.query(query, [planId]);
}

export function queuePendingSubs(subscriptionId, priceId) {
  const query = `
    INSERT INTO pending_subs
      (subscription_id, price_id)
    VALUES
      ($1, $2)
  `;
  return pool.query(query, [subscriptionId, priceId]);
}


export function getExpiredPendingSubs() {
  const query = `
    WITH del_valid_subs AS (
      DELETE FROM pending_subs
      WHERE created_at < (CURRENT_TIMESTAMP - interval '1 day') AND paid = True
    )
    DELETE FROM pending_subs
    WHERE created_at < (CURRENT_TIMESTAMP - interval '1 day') AND paid = False
    RETURNING subscription_id AS "subscriptionId", price_id AS "priceId"
  `;
  return pool.query(query);
}