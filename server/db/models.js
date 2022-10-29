import pool from './pool';

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


export function addPlan(
  username,
  planName,
  cycleFrequency,
  perCycleCost,
  productId,
  startDate,
  priceId
) {
  const query = `
    WITH first_insert AS
      (
        INSERT INTO plans
          (plan_name, cycle_frequency, per_cycle_cost, plan_id, start_date, price_id)
        VALUES
          ($2, $3, $4, $5, $6::TIMESTAMPTZ, $7)
      )
    INSERT INTO user_plan
      (username, plan_id, plan_owner)
    VALUES
      ($1, $5, TRUE)
  `;

  const args = [username, planName, cycleFrequency, perCycleCost, productId, startDate, priceId];
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
    SELECT p.plan_id AS "planId",
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
    WHERE p.plan_id = $1`;

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
          p.plan_id AS "planId",
          p.plan_name AS name,
          UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
          p.per_cycle_cost AS "perCycleCost",
          up.subscription_id AS "subscriptionId",
          up.quantity
        FROM plans p
        JOIN user_plan up
        ON p.plan_id = up.plan_id
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
    u.s_cus_id AS "stripeCusId",
    u.default_pmnt_id AS "defaultPaymentId",
    COALESCE(
      ( SELECT quantity
        FROM user_plan
        WHERE username = $1 AND plan_id = $2
      ),
      0
    ) AS quantity
    FROM users u
    WHERE username = $1
  `;
  return pool.query(query, [username, planId]);
}


export function subscriptionSetup(planId) {
  const query = `
    SELECT
      CASE
        WHEN p.cycle_frequency = 'weekly'
          THEN 'week'
        WHEN p.cycle_frequency = 'monthly'
          THEN 'month'
        WHEN p.cycle_frequency = 'yearly'
          THEN 'year'
      END AS "cycleFrequency",
      p.per_cycle_cost AS "perCycleCost",
      p.price_id AS "prevPriceId",
      SUM (up.quantity)::INTEGER AS count,
      CASE
        WHEN CURRENT_TIMESTAMP < p.start_date
          THEN ROUND (EXTRACT (EPOCH FROM p.start_date))
        WHEN CURRENT_TIMESTAMP >= p.start_date
          THEN CASE
            WHEN p.cycle_frequency = 'weekly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + MAKE_INTERVAL(weeks => (FLOOR (EXTRACT (DAY FROM (CURRENT_TIMESTAMP - p.start_date)) / 7))::INTEGER)
                + interval '1 week'
              )))
            WHEN p.cycle_frequency = 'monthly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + DATE_TRUNC('month', AGE(CURRENT_TIMESTAMP, p.start_date))
                + interval '1 month'
              )))
            WHEN p.cycle_frequency = 'yearly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + DATE_TRUNC('year', AGE(CURRENT_TIMESTAMP, p.start_date))
                + interval '1 year'
              )))
          END
      END
      AS "startDate"
    FROM plans p
    JOIN user_plan up
    ON p.plan_id = up.plan_id
    WHERE p.plan_id = $1
    GROUP BY p.price_id, p.cycle_frequency, p.per_cycle_cost, p.price_id, p.start_date
  `;

  return pool.query(query, [planId]);
}


export function subscriptionSetupSavedCard(planId, username) {
  const query = `
    SELECT
      CASE
        WHEN p.cycle_frequency = 'weekly'
          THEN 'week'
        WHEN p.cycle_frequency = 'monthly'
          THEN 'month'
        WHEN p.cycle_frequency = 'yearly'
          THEN 'year'
      END AS "cycleFrequency",
      COALESCE(
        ( SELECT quantity
          FROM user_plan
          WHERE username = $1 AND plan_id = $2
        ),
        0
      ) AS "existingQuant",
      ( SELECT
          COALESCE(
            json_agg(
              json_build_object(
                'username', username,
                'email', email,
                'subscriptionId', subscription_id,
                'subscriptionItemId', subscription_item_id,
                'quantity', quantity
              )
            ),
            '[]'::JSON
          )
        FROM user_on_plan
        WHERE plan_id = $2 AND subscription_id IS NOT NULL
      ) AS members,
      ( SELECT
          json_build_object(
            'stripeCusId', s_cus_id,
            'password', password
          )
        FROM users
        WHERE username = $1
      ) AS user,
      p.per_cycle_cost AS "perCycleCost",
      p.price_id AS "prevPriceId",
      SUM (up.quantity)::INTEGER AS count,
      CASE
        WHEN CURRENT_TIMESTAMP < p.start_date
          THEN ROUND (EXTRACT (EPOCH FROM p.start_date))
        WHEN CURRENT_TIMESTAMP >= p.start_date
          THEN CASE
            WHEN p.cycle_frequency = 'weekly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + MAKE_INTERVAL(weeks => (FLOOR (EXTRACT (DAY FROM (CURRENT_TIMESTAMP - p.start_date)) / 7))::INTEGER)
                + interval '1 week'
              )))
            WHEN p.cycle_frequency = 'monthly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + DATE_TRUNC('month', AGE(CURRENT_TIMESTAMP, p.start_date))
                + interval '1 month'
              )))
            WHEN p.cycle_frequency = 'yearly'
              THEN ROUND (EXTRACT (EPOCH FROM (
                p.start_date
                + DATE_TRUNC('year', AGE(CURRENT_TIMESTAMP, p.start_date))
                + interval '1 year'
              )))
          END
      END
      AS "startDate"
    FROM plans p
    JOIN user_plan up
    ON p.plan_id = up.plan_id
    WHERE p.plan_id = $2
    GROUP BY p.price_id, p.cycle_frequency, p.per_cycle_cost, p.price_id, p.start_date
  `;

  return pool.query(query, [username, planId]);
}


export function startSubsNoPriceUpdate(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  startDate
) {
  const query = `
  INSERT INTO user_plan
      (quantity, subscription_id, subscription_item_id, plan_id, username, start_date)
    VALUES
      ($1, $2, $3, $4, $5, TO_TIMESTAMP($6))
    ON CONFLICT
      (username, plan_id)
    DO UPDATE SET
      quantity = $1, subscription_id = $2, subscription_item_id = $3, start_date = TO_TIMESTAMP($6)
    WHERE user_plan.username = $5 AND user_plan.plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, startDate];
  return pool.query(query, args);
}


export function startSubsNoPriceUpdateReturningPlan(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  startDate
) {
  const query = `
  WITH upd AS (
    INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username, start_date)
      VALUES
        ($1, $2, $3, $4, $5, TO_TIMESTAMP($6))
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3, start_date = TO_TIMESTAMP($6)
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
      RETURNING plan_id, quantity, subscription_id
  ),
  select_owner AS (
    SELECT
        JSON_BUILD_OBJECT(
          'firstName', u.first_name,
          'lastName', u.last_name,
          'username', u.username
        ) AS owner
      FROM users u
      JOIN user_plan up
      ON u.username = up.username
      WHERE up.plan_owner = True AND up.plan_id = $4
  )
  SELECT
      p.plan_id AS "planId",
      p.plan_name AS name,
      UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
      (p.per_cycle_cost / 100) AS "perCycleCost",
      (SELECT owner FROM select_owner),
      quantity,
      subscription_id AS "subscriptionId"
    FROM plans p
    JOIN upd
    ON p.plan_id = upd.plan_id
    WHERE p.plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, startDate];
  return pool.query(query, args);
}


export function startSubsPriceUpdateReturningPlan(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  newPriceId,
  startDate
) {
  const query = `
  WITH upd AS (
    INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username, start_date)
      VALUES
        ($1, $2, $3, $4, $5, TO_TIMESTAMP($6))
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3, start_date = TO_TIMESTAMP($6)
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
      RETURNING plan_id, quantity, subscription_id
  ),
  update_price_id AS (
      UPDATE plans
      SET price_id = $7
      WHERE plan_id = $4
  ),
  select_owner AS (
    SELECT
        JSON_BUILD_OBJECT(
          'firstName', u.first_name,
          'lastName', u.last_name,
          'username', u.username
        ) AS owner
      FROM users u
      JOIN user_plan up
      ON u.username = up.username
      WHERE up.plan_owner = True AND up.plan_id = $4
  )
  SELECT
      p.plan_id AS "planId",
      p.plan_name AS name,
      UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
      (p.per_cycle_cost / 100) AS "perCycleCost",
      (SELECT owner FROM select_owner),
      quantity,
      subscription_id AS "subscriptionId"
    FROM plans p
    JOIN upd
    ON p.plan_id = upd.plan_id
    WHERE p.plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, startDate,
    newPriceId];
  return pool.query(query, args);
}


export function startSubscription(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  startDate,
  newPriceId
) {
  const query = `
    WITH update_sub_id AS
    (
      INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username, start_date)
      VALUES
        ($1, $2, $3, $4, $5, TO_TIMESTAMP($6))
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3, start_date = TO_TIMESTAMP($6)
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
    ),
    update_price_id AS
    (
      UPDATE plans
      SET price_id = $7
      WHERE plan_id = $4
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
  console.log(startDate);
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username, startDate,
    newPriceId];
  return pool.query(query, args);
}


export function updatePriceIdDelSubsGetMembers(newPriceId, productId, subscriptionId) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET price_id = $1 WHERE plan_id = $2
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


export function updatePriceOwnerDelSubsGetMembers(newPriceId, planId, subscriptionId, newOwner) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET price_id = $1 WHERE plan_id = $2
    ), del_sub AS (
      DELETE FROM user_plan WHERE subscription_id = $3
    ), update_owner AS (
      UPDATE user_plan
      SET plan_owner = True
      WHERE username = $4 AND plan_id = $2
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
  return pool.query(query, [newPriceId, planId, subscriptionId, newOwner]);
}


export function deleteSubscription(subscriptionId) {
  return pool.query('DELETE FROM user_plan WHERE subscription_id = $1', [subscriptionId]);
}


export function checkPlanOwnerUsingSubsId(subscriptionId, username) {
  const query = `
    SELECT plan_id AS "planId"
    FROM user_plan
    WHERE subscription_id = $1 AND username = $2 AND plan_owner = False`;
  return pool.query(query, [subscriptionId, username]);
}


export function checkPlanOwnerForCancel(username, planId, subscriptionId, newOwner) {
  const query = `
    SELECT username
    FROM user_plan
    WHERE username = $1
      AND plan_id = $2
      AND subscription_id = $3
      AND plan_owner = True
    UNION
    SELECT username
    FROM user_plan
    WHERE username = $4
      AND plan_id = $2
  `;
  return pool.query(query, [username, planId, subscriptionId, newOwner]);
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
      p.price_id AS "prevPriceId",
      c.sum AS count
    FROM user_plan up
    JOIN plans p
    ON up.plan_id = p.plan_id
    JOIN c
    ON up.plan_id = c.plan_id
    WHERE up.subscription_id = $1 and up.username = $2`;
  return pool.query(query, [subscriptionId, username]);
}


export function updatePriceQuantGetMembers(planId, subscriptionId, newQuantity, newPriceId) {
  const query = `
  WITH update_price AS (
    UPDATE plans SET price_id = $4 WHERE plan_id = $1
  ), update_quant AS (
    UPDATE user_plan SET quantity = $3 WHERE subscription_id = $2
  )
  SELECT
    username,
    email,
    subscription_id AS "subscriptionId",
    subscription_item_id AS "subscriptionItemId",
    quantity
  FROM user_on_plan
  WHERE plan_id = $1 AND subscription_id != $2
  `;
  return pool.query(query, [planId, subscriptionId, newQuantity, newPriceId]);
}


export function getPriceFromPlan(planId, username) {
  const query = `
    SELECT p.price_id AS "priceId"
    FROM plans p
    JOIN user_plan up
    ON p.plan_id = up.plan_id
    WHERE up.plan_id = $1
      AND up.username = $2
      AND up.plan_owner = True
  `;
  return pool.query(query, [planId, username]);
}


export function deletePlanGetAllSubs(planId) {
  const query = `
    WITH del_plan AS (
      DELETE FROM plans WHERE plan_id = $1
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

export function updateDefaultPmntMethod(username, pmntMethodId) {
  const query = `
    UPDATE users SET default_pmnt_id = $1 WHERE username = $2
  `;
  return pool.query(query, [pmntMethodId, username]);
}

export function planReturnAfterSubs(planId, quantity) {
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
    SELECT p.plan_id AS "planId",
    p.plan_name AS name,
    UPPER(p.cycle_frequency::VARCHAR) AS "cycleFrequency",
    p.per_cycle_cost AS "perCycleCost",
    $2 AS quantity,
    (SELECT owner FROM select_owner)
    FROM plans p
    WHERE p.plan_id = $1`;

  return pool.query(query, [planId, quantity]);
}
