import pool from './pool';

export function checkUser(username, email) {
  const query = `
  SELECT username, email
    FROM users
    WHERE (username = $1) OR (email = $2)
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


export function checkBeforeVerifyEmail(email) {
  const query = `
    SELECT
      verified,
      s_cus_id AS "sCusId",
      first_name || ' ' || last_name AS name,
      first_name AS "firstName",
      username
    FROM users
    WHERE email = $1
  `;
  return pool.query(query, [email]);
}


export function verifyEmailUpdateStripeCustomerId(sCusId, username) {
  const query = `
    UPDATE users
      SET
        verified = True,
        s_cus_id = $1
      WHERE username = $2
  `;
  return pool.query(query, [sCusId, username]);
}

export function verifyEmail(username) {
  return pool.query('UPDATE users SET verified = True WHERE username = $1', [username]);
}

export function addPlan(
  username,
  planName,
  cycleFrequency,
  perCycleCost,
  productId,
  startDate,
  priceId,
) {
  const query = `
    WITH plan_insert AS (
      INSERT INTO plans
        (plan_name, cycle_frequency, per_cycle_cost, plan_id, start_date, price_id)
      VALUES
        ($2, $3, $4, $5, $6::TIMESTAMPTZ, $7)
    ), plan_history_insert AS (
      INSERT INTO plans_history (plan_id, start_date, plan_cost)
        VALUES ($5, $6::TIMESTAMPTZ, $4)
    )
    INSERT INTO user_plan (username, plan_id, plan_owner)
      VALUES ($1, $5, TRUE)
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
      password,
      verified
    FROM users
    WHERE username = $1`;
  return pool.query(query, [username]);
}

export function getUserInfoEitherUsernameOrEmail(usernameOrEmail) {
  const query = `
    SELECT
      s_cus_id AS "stripeCusId",
      username,
      email,
      first_name AS "firstName",
      first_name || ' ' || last_name AS name,
      password AS "savedPass",
      verified
    FROM users
    WHERE username = $1 OR email = $1`;
  return pool.query(query, [usernameOrEmail]);
}

export function getUserInfoCheckNewEmail(username, newEmail) {
  const query = `
  SELECT
      first_name AS "firstName",
      first_name || ' ' || last_name AS name,
      email,
      password AS "savedPwd",
      s_cus_id AS "sCusId",
      (SELECT email FROM users WHERE email = $1) AS "newEmailInput"
    FROM users
    WHERE username = $2
  `;
  return pool.query(query, [newEmail, username]);
}


export function getUserInfoCheckNewUsername(username, newUsername) {
  const query = `
    SELECT
      s_cus_id AS "stripeCusId",
      password AS "savedPwd",
      (SELECT username FROM users WHERE username = $1) AS "newUsernameInput"
    FROM users
    WHERE username = $2`;
  return pool.query(query, [newUsername, username]);
}


export function changeEmail(username, newEmail) {
  return pool.query('UPDATE users SET email = $1, verified = False WHERE username = $2', [newEmail, username]);
}


export function changeUsername(username, newUsername) {
  return pool.query('UPDATE users SET username = $1 WHERE username = $2', [newUsername, username]);
}

export function changePassword(username, password) {
  return pool.query('UPDATE users SET password = $1 WHERE username = $2', [password, username]);
}

export function joinPlan(username, planId) {
  const query = `
  SELECT
    u.s_cus_id AS "stripeCusId",
    COALESCE(
      ( SELECT quantity
        FROM user_plan
        WHERE username = $1 AND plan_id = $2
      ),
      0
    ) AS quantity,
    (SELECT active FROM plans p WHERE p.plan_id = $2) AS active
    FROM users u
    WHERE username = $1
  `;
  return pool.query(query, [username, planId]);
}


export function subscriptionSetup(planId, stripeCusId) {
  const query = `
  SELECT
    *,
    COALESCE(
      ( SELECT quantity
        FROM user_plan
        WHERE plan_id = $1
          AND username = (SELECT username FROM users WHERE s_cus_id = $2)
      ),
      0
    ) AS "existingQuant",
    ( SELECT
        json_agg(
          json_build_object(
            'username', username,
            'email', email,
            'subscriptionId', subscription_id,
            'subscriptionItemId', subscription_item_id,
            'quantity', quantity
          )
        )
        FROM user_on_plan
        WHERE plan_id = $1
          AND subscription_id IS NOT NULL
          AND active = True
    ) AS members
    FROM subscription_setup
    WHERE plan_id = $1
  `;

  return pool.query(query, [planId, stripeCusId]);
}


export function subscriptionSetupSavedCard(planId, username) {
  const query = `
  SELECT
    *,
    COALESCE(
      ( SELECT quantity
        FROM user_plan
        WHERE username = $1 AND plan_id = $2
      ),
      0
    ) AS "existingQuant",
    ( SELECT
        json_agg(
          json_build_object(
            'username', username,
            'email', email,
            'subscriptionId', subscription_id,
            'subscriptionItemId', subscription_item_id,
            'quantity', quantity
          )
        )
        FROM user_on_plan
        WHERE plan_id = $2
          AND subscription_id IS NOT NULL
          AND active = True
    ) AS members,
    ( SELECT
        json_build_object(
          'stripeCusId', s_cus_id,
          'password', password
        )
      FROM users
      WHERE username = $1
    ) AS user
    FROM subscription_setup
    WHERE plan_id = $2
  `;
  return pool.query(query, [username, planId]);
}


export function startSubsNoPriceUpdate(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  sCusId,
) {
  const query = `
  INSERT INTO user_plan
      (quantity, subscription_id, subscription_item_id, plan_id, username)
    VALUES
      ($1, $2, $3, $4, (SELECT username FROM users WHERE s_cus_id = $5))
    ON CONFLICT
      (username, plan_id)
    DO UPDATE SET
      quantity = $1, subscription_id = $2, subscription_item_id = $3
    WHERE user_plan.plan_id = $4
      AND user_plan.username = (SELECT username FROM users WHERE s_cus_id = $5)
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, sCusId];
  return pool.query(query, args);
}


export function startSubsNoPriceUpdateReturningPlan(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
) {
  const query = `
  WITH upd AS (
    INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES
        ($1, $2, $3, $4, $5)
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3
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
      $1 AS quantity,
      $2 AS "subscriptionId"
    FROM plans p
    JOIN upd
    ON p.plan_id = upd.plan_id
    WHERE p.plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username];
  return pool.query(query, args);
}


export function startSubsPriceUpdateReturningPlan(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  username,
  newPriceId,
) {
  const query = `
  WITH upd AS (
    INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES
        ($1, $2, $3, $4, $5)
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3
      WHERE user_plan.username = $5 AND user_plan.plan_id = $4
      RETURNING plan_id, quantity, subscription_id
  ),
  update_price_id AS (
      UPDATE plans
      SET price_id = $6
      WHERE plan_id = $4
  ),
  update_notifications AS (
    INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $5)
          || ' has joined plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $4)
          || '. The new unit cost for this plan is $'
          || (SELECT
                ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $4) /
                (SELECT SUM(quantity)::INTEGER + $1 FROM user_plan WHERE plan_id = $4 AND username != $5)) / 100, 2)
              )
          || '/'
          || (SELECT cycle_frequency FROM plans WHERE plan_id = $4)
          || ', taking effect on the next charge date.'
        )
      FROM user_plan WHERE plan_id = $4 AND username != $5 AND active = True
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
      $1 AS quantity,
      $2 AS "subscriptionId"
    FROM plans p
    JOIN upd
    ON p.plan_id = upd.plan_id
    WHERE p.plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, username,
    newPriceId];
  return pool.query(query, args);
}


export function startSubscription(
  planId,
  quantity,
  subscriptionId,
  subscriptionItemId,
  stripeCusId,
  newPriceId
) {
  const query = `
    WITH update_sub_id AS
    (
      INSERT INTO user_plan
        (quantity, subscription_id, subscription_item_id, plan_id, username)
      VALUES
        ($1, $2, $3, $4, (SELECT username FROM users WHERE s_cus_id = $5))
      ON CONFLICT
        (username, plan_id)
      DO UPDATE SET
        quantity = $1, subscription_id = $2, subscription_item_id = $3
      WHERE user_plan.username = (SELECT username FROM users WHERE s_cus_id = $5)
        AND user_plan.plan_id = $4
    ),
    update_notifications AS (
      INSERT INTO notifications (username, message)
        SELECT
          username,
          (
            (SELECT first_name FROM users WHERE username = (SELECT username FROM users WHERE s_cus_id = $5))
            || ' has joined plan '
            || (SELECT plan_name FROM plans WHERE plan_id = $4)
            || '. The new unit cost for this plan is $'
            || (SELECT
                  ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $4) /
                  (SELECT SUM(quantity)::INTEGER + $1 FROM user_plan WHERE plan_id = $4 AND username != (SELECT username FROM users WHERE s_cus_id = $5))) / 100, 2)
                )
            || '/'
            || (SELECT cycle_frequency FROM plans WHERE plan_id = $4)
            || ', taking effect on the next charge date.'
          )
        FROM user_plan
        WHERE plan_id = $4
          AND username != (SELECT username FROM users WHERE s_cus_id = $5)
          AND active = True
    )
    UPDATE plans
    SET price_id = $6
    WHERE plan_id = $4
  `;
  const args = [quantity, subscriptionId, subscriptionItemId, planId, stripeCusId, newPriceId];
  return pool.query(query, args);
}

//
export function updatePriceIdDelSubs(newPriceId, productId, username) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET price_id = $1 WHERE plan_id = $2
    ), del AS (
      DELETE FROM user_plan WHERE plan_id = $2 AND username = $3
    )
      INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $3)
          || ' has dropped out of plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $2)
          || '. The new unit cost for this plan is $'
          || (SELECT
                ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
                (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
              )
          || '/'
          || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
          || ', taking effect on the next charge date.'
        )
      FROM user_plan WHERE plan_id = $2 AND username != $3 AND active = True
  `;
  return pool.query(query, [newPriceId, productId, username]);
}

//
export function updatePriceIdArchiveSubs(newPriceId, productId, username) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET price_id = $1 WHERE plan_id = $2
    ), update_subs AS (
      UPDATE user_plan
      SET
        quantity = 0,
        active = FALSE,
        subscription_id = NULL,
        subscription_item_id = NULL
      WHERE plan_id = $2 AND username = $3
    )
    INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $3)
          || ' has dropped out of plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $2)
          || '. The new unit cost for this plan is $'
          || (SELECT
                ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
                (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
              )
          || '/'
          || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
          || ', taking effect on the next charge date.'
        )
      FROM user_plan WHERE plan_id = $2 AND username != $3 AND active = True
  `;
  return pool.query(query, [newPriceId, productId, username]);
}

export function updatePriceOwnerArchiveSubs(newPriceId, productId, formerOwner, newOwner) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans
        SET price_id = $1
        WHERE plan_id = $2
    ), update_new_owner AS (
      UPDATE user_plan
        SET plan_owner = True
        WHERE plan_id = $2 AND username = $4
    ), update_former_owner AS (
      UPDATE user_plan
      SET
        quantity = 0,
        active = False,
        subscription_id = NULL,
        subscription_item_id = NULL,
        plan_owner = False
      WHERE plan_id = $2 AND username = $3
    ), update_new_owner_notification AS (
        INSERT INTO notifications (username, message)
          VALUES ($4,
            (
              (SELECT first_name FROM users WHERE username = $3)
              || ' has dropped out of plan '
              || (SELECT plan_name FROM plans WHERE plan_id = $2)
              || ', and elected you as the new owner. The new unit cost for this plan is $'
              || (SELECT
                    ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
                    (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
                  )
              || '/'
              || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
              || ', taking effect on the next charge date.'
            )
          )
    )
    INSERT INTO notifications (username, message)
    SELECT
      username,
      (
        (SELECT first_name FROM users WHERE username = $3)
        || ' has dropped out of plan '
        || (SELECT plan_name FROM plans WHERE plan_id = $2)
        || '. '
        || (SELECT first_name FROM users WHERE username =$4)
        || ' is now the new plan owner, and the new unit cost is $'
        || (SELECT
              ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
              (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
            )
        || '/'
        || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
        || ', taking effect on the next charge date.'
      )
    FROM user_plan WHERE plan_id = $2 AND username NOT IN ($3, $4) AND active = True
  `;
  return pool.query(query, [newPriceId, productId, formerOwner, newOwner]);
}


export function updatePriceOwnerDelSubs(newPriceId, planId, formerOwner, newOwner) {
  const query = `
    WITH update_price_id AS (
      UPDATE plans SET price_id = $1 WHERE plan_id = $2
    ), del_sub AS (
      DELETE FROM user_plan WHERE plan_id = $2 AND username = $3
    ), update_new_owner AS (
      UPDATE user_plan
      SET plan_owner = True
      WHERE plan_id = $2 AND username = $4
    ), update_new_owner_notification AS (
      INSERT INTO notifications (username, message)
        VALUES ($4,
          (
            (SELECT first_name FROM users WHERE username = $3)
            || ' has dropped out of plan '
            || (SELECT plan_name FROM plans WHERE plan_id = $2)
            || ', and elected you as the new owner. The new unit cost for this plan is $'
            || (SELECT
                  ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
                  (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
                )
            || '/'
            || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
            || ', taking effect on the next charge date.'
          )
        )
    )
    INSERT INTO notifications (username, message)
    SELECT
      username,
      (
        (SELECT first_name FROM users WHERE username = $3)
        || ' has dropped out of plan '
        || (SELECT plan_name FROM plans WHERE plan_id = $2)
        || '. '
        || (SELECT first_name FROM users WHERE username =$4)
        || ' is now the new plan owner, and the new unit cost is $'
        || (SELECT
              ROUND (CEIL ((SELECT per_cycle_cost::NUMERIC FROM plans WHERE plan_id = $2) /
              (SELECT SUM(quantity)::INTEGER FROM user_plan WHERE plan_id = $2 AND username != $3)) / 100, 2)
            )
        || '/'
        || (SELECT cycle_frequency FROM plans WHERE plan_id = $2)
        || ', taking effect on the next charge date.'
      )
    FROM user_plan WHERE plan_id = $2 AND username NOT IN ($3, $4) AND active = True
  `;
  return pool.query(query, [newPriceId, planId, formerOwner, newOwner]);
}

//
export function deleteSubscription(username, planId) {
  const query = `
    WITH del AS (DELETE FROM user_plan WHERE username = $1 AND plan_id = $2)
      INSERT INTO notifications (username, message)
        SELECT
          username,
          (
            (SELECT first_name FROM users WHERE username = $1)
            || ' has dropped out of plan '
            || (SELECT plan_name FROM plans WHERE plan_id = $2)
            || '. There are no more active members on this plan. You can either invite new members to join it, or delete the plan.'
          )
        FROM user_plan WHERE plan_id = $2 AND username != $1 AND active = True
  `;
  return pool.query(query, [username, planId]);
}

//
export function archiveSubs(username, planId) {
  const query = `
    WITH u AS (
      UPDATE user_plan
      SET
        quantity = 0,
        active = False,
        subscription_id = NULL,
        subscription_item_id = NULL
      WHERE username = $1 AND plan_id = $2
    )
    INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $1)
          || ' has dropped out of plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $2)
          || '. There are no more active members on this plan. You can still invite new members to join it.'
        )
      FROM user_plan WHERE plan_id = $2 AND username != $1 AND active = True
  `;
  return pool.query(query, [username, planId]);
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
    SELECT
      *,
      ( SELECT
          json_agg(
            json_build_object(
              'username', username,
              'email', email,
              'subscriptionId', subscription_id,
              'subscriptionItemId', subscription_item_id,
              'quantity', quantity
            )
          )
          FROM user_on_plan
          WHERE
            plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
            AND subscription_id != $1
            AND subscription_id IS NOT NULL
            AND active = True
      ) AS members
      FROM subs_on_plan
      WHERE subscription_id = $1 AND username = $2`;
  return pool.query(query, [subscriptionId, username]);
}


export function getProductInfoAndInvoice(subscriptionId, username) {
  const query = `
    SELECT
      *,
      ( SELECT
          json_agg(
            json_build_object(
              'username', username,
              'email', email,
              'subscriptionId', subscription_id,
              'subscriptionItemId', subscription_item_id,
              'quantity', quantity
            )
          )
          FROM user_on_plan
          WHERE
            plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
            AND subscription_id != $1
            AND subscription_id IS NOT NULL
            AND active = True
      ) AS members,
      ( SELECT invoice_id
          FROM invoices
          WHERE plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
            AND username = $2
          LIMIT 1
      ) AS "invoiceId"
      FROM subs_on_plan
      WHERE subscription_id = $1 AND username = $2`;
  return pool.query(query, [subscriptionId, username]);
}


export function getProductInfoAndInvoiceUsingPlanId(planId, username) {
  const query = `
    SELECT
      "prevPriceId",
      "planActive",
      "subsActive",
      "planOwner",
      subscription_id AS "subscriptionId",
      ( SELECT
          json_agg(
            json_build_object(
              'username', username,
              'email', email,
              'subscriptionId', subscription_id
            )
          )
          FROM user_on_plan
          WHERE
            plan_id = $1
            AND plan_owner = False
            AND active = True
      ) AS members,
      ( SELECT invoice_id
          FROM invoices
          WHERE plan_id = $1
          LIMIT 1
      ) AS "invoiceId"
      FROM subs_on_plan
      WHERE product = $1 AND username = $2`;
  return pool.query(query, [planId, username]);
}


export function getProductInfoAndInvoiceCheckNewOwner(username, subscriptionId, newOwner) {
  const query = `
    SELECT
      *,
      ( SELECT
          json_agg(
            json_build_object(
              'username', username,
              'email', email,
              'subscriptionId', subscription_id,
              'subscriptionItemId', subscription_item_id,
              'quantity', quantity
            )
          )
          FROM user_on_plan
          WHERE
            plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
            AND subscription_id != $1
            AND subscription_id IS NOT NULL
            AND active = True
      ) AS members,
      ( SELECT invoice_id
          FROM invoices
          WHERE plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
          LIMIT 1
      ) AS "invoiceId",
      ( SELECT plan_owner
          FROM user_plan
          WHERE username = $3
            AND plan_id = (SELECT plan_id FROM user_plan WHERE subscription_id = $1)
            AND active = TRUE
      ) AS "newOwnerCheck"
      FROM subs_on_plan
      WHERE subscription_id = $1 AND username = $2`;
  return pool.query(query, [subscriptionId, username, newOwner]);
}


export function updatePriceQuant(planId, newQuantity, newPriceId, username) {
  const query = `
  WITH update_price AS (
    UPDATE plans SET price_id = $3 WHERE plan_id = $1
  ), update_quantity AS (
    UPDATE user_plan SET quantity = $2 WHERE plan_id = $1 AND username = $4
  )
    INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $4)
          || ' has updated their quantity in plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $1)
          || ' to '
          || (SELECT $2)
          || '. The new unit cost for this plan is $'
          || (SELECT
                ROUND (CEIL ((SELECT per_cycle_cost FROM plans WHERE plan_id = $1) /
                (SELECT SUM(quantity)::INTEGER + $2 FROM user_plan WHERE plan_id = $1 AND username != $4)) / 100, 2)
              )
          || '/'
          || (SELECT cycle_frequency FROM plans WHERE plan_id = $1)
          || ', taking effect on the next charge date.'
        )
      FROM user_plan WHERE plan_id = $1 AND username != $4 AND active = True
  `;
  return pool.query(query, [planId, newQuantity, newPriceId, username]);
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


export function deletePlan(planId, username) {
  const query = `
    WITH del AS (DELETE FROM plans WHERE plan_id = $1)
      INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $2)
          || ' has deleted plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $1)
          || '. This plan will no longer be available.'
        )
      FROM user_plan WHERE plan_id = $1 AND plan_owner = False AND active = True
  `;
  return pool.query(query, [planId, username]);
}


export function archivePlan(planId, username) {
  const query = `
    WITH update_subs AS (
      UPDATE user_plan
        SET
          quantity = 0,
          active = False,
          subscription_id = NULL,
          subscription_item_id = NULL
        WHERE plan_id = $1
    ), update_plan AS (
      UPDATE plans
        SET active = False
        WHERE plan_id = $1
    )
    INSERT INTO notifications (username, message)
      SELECT
        username,
        (
          (SELECT first_name FROM users WHERE username = $2)
          || ' has archived plan '
          || (SELECT plan_name FROM plans WHERE plan_id = $1)
          || '. This plan will no longer be available, but you can still access its past invoices and activity.'
        )
      FROM user_plan WHERE plan_id = $1 AND plan_owner = False AND active = True

  `;
  return pool.query(query, [planId, username]);
}


export function addInvoice(invoiceId, customerId, productId, quantity, chargeDate, total) {
  const query = `
    INSERT INTO invoices (
      invoice_id, username, plan_id, quantity, charge_date, paid_amount
    ) VALUES (
      $1,
      (SELECT username FROM users WHERE s_cus_id = $2),
      $3,
      $4,
      TO_TIMESTAMP($5),
      $6
    ) ON CONFLICT (username, plan_id, charge_date) DO NOTHING
  `;
  return pool.query(query, [invoiceId, customerId, productId, quantity, chargeDate, total]);
}


export function getNotifications(user) {
  const query = `
  WITH n AS (
    SELECT *
    FROM notifications
    WHERE username = $1
    ORDER BY created_on DESC, id ASC
  )
  SELECT
    COUNT(*) AS count,
    COALESCE (
      JSON_AGG (
        JSON_BUILD_OBJECT (
          'id', id,
          'createdAt', TO_CHAR (created_on AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MSZ'),
          'content', message
        )
      ),
      '[]'::JSON
    ) AS notifications
  FROM n;
  `;
  return pool.query(query, [user]);
}

export function markNotificationAsRead(id, username) {
  return pool.query('DELETE FROM notifications WHERE id = $1 AND username = $2 RETURNING id', [id, username]);
}

export function checkBeforeTransferOwnership(newOwner, planId, formerOwner) {
  const query = `
    SELECT
      p.active AS "planActive",
      up.active AS "subscriptionActive",
      up.plan_owner AS "planOwner",
      (SELECT username FROM user_plan WHERE username = $1 AND plan_id = $2 AND active = True) AS "newOwnerUsername"
    FROM plans p
    JOIN user_plan up
    ON p.plan_id = up.plan_id
    WHERE up.plan_id = $2
      AND username = $3`;
  return pool.query(query, [newOwner, planId, formerOwner]);
}

export function updatePlanOwner(newOwner, formerOwner, planId) {
  const query = `
    WITH update_new AS (
      UPDATE user_plan
        SET plan_owner = True
        WHERE username = $1 AND plan_id = $3
    ), update_former AS (
      UPDATE user_plan
        SET plan_owner = False
        WHERE username = $2 AND plan_id = $3
    ), update_new_owner_notification AS (
      INSERT INTO notifications (username, message)
        VALUES ($1,
          (
            (SELECT first_name FROM users WHERE username = $2)
            || ' has transferred the ownership for plan '
            || (SELECT plan_name FROM plans WHERE plan_id = $3)
            || ' to you.'
          )
        )
    )
    INSERT INTO notifications (username, message)
    SELECT
      username,
      (
        (SELECT first_name FROM users WHERE username = $2)
        || ' has transferred the ownership for plan '
        || (SELECT plan_name FROM plans WHERE plan_id = $3)
        || ' to '
        || (SELECT first_name FROM users WHERE username = $1)
        || '.'
      )
    FROM user_plan WHERE plan_id = $3 AND username NOT IN ($1, $2) AND active = True
  `;
  return pool.query(query, [newOwner, formerOwner, planId]);
}
