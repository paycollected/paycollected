DROP DATABASE IF EXISTS paycollected;
CREATE DATABASE paycollected;

\c paycollected;

-- non-relational tables
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR (100) NOT NULL,
  password VARCHAR(200) NOT NULL, -- hashed
  email VARCHAR(100) NOT NULL UNIQUE,
  s_cus_id VARCHAR(50) UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TYPE cycle_freq AS ENUM ('weekly', 'monthly', 'yearly');

CREATE TABLE IF NOT EXISTS plans (
  plan_id VARCHAR(50) PRIMARY KEY,
  price_id VARCHAR(50) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  cycle_frequency CYCLE_FREQ NOT NULL,
  per_cycle_cost INTEGER NOT NULL CHECK (per_cycle_cost >= 1000), -- reflective of next billing cycle
  start_date TIMESTAMP WITH TIME ZONE NOT NULL, -- original start date
  active BOOLEAN NOT NULL DEFAULT TRUE -- will only be false once archived
);


-- relational tables
CREATE TABLE IF NOT EXISTS user_plan (
  -- reflective of the NEXT billing cycle
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  plan_owner BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE, -- will also be True for owner with quant = 0; only false once archived
  subscription_id VARCHAR(50) UNIQUE,
  subscription_item_id VARCHAR(50) UNIQUE,
  UNIQUE (username, plan_id)
);


CREATE TABLE IF NOT EXISTS plans_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL, -- indicating the interval for which plan_cost & unit_cost were used
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'INFINITY'::TIMESTAMPTZ CHECK (end_date > start_date),
  -- indicating the interval for which plan_cost & unit_cost were used
  plan_cost INTEGER NOT NULL CHECK (plan_cost >= 1000), -- similar to per_cycle_cost in plans table
  UNIQUE (plan_id, start_date)
);


CREATE TABLE IF NOT EXISTS invoices (
  invoice_id VARCHAR(50) PRIMARY KEY, -- invoice ID pulled from stripe
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  charge_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_amount INTEGER NOT NULL CHECK (paid_amount > 0), -- including platform fees, takes into account quantity purchased
  UNIQUE (username, plan_id, charge_date)
);


CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  message TEXT NOT NULL
);


CREATE VIEW user_on_plan AS
  SELECT
    up.username,
    u.first_name,
    u.last_name,
    u.email,
    up.plan_id,
    up.subscription_id,
    up.subscription_item_id,
    up.quantity,
    up.active,
    up.plan_owner
  FROM user_plan up
  JOIN users u
  ON up.username = u.username;


CREATE VIEW subs_on_plan AS
  WITH c AS (
    SELECT plan_id, SUM(quantity)
      FROM user_plan
      GROUP BY plan_id
    )
  SELECT
      up.plan_id AS product,
      up.subscription_id,
      up.subscription_item_id AS "subscriptionItemId",
      up.quantity,
      up.username,
      up.active AS "subsActive",
      up.plan_owner AS "planOwner",
      CASE
        WHEN p.cycle_frequency = 'weekly'
          THEN 'week'
        WHEN p.cycle_frequency = 'monthly'
          THEN 'month'
        WHEN p.cycle_frequency = 'yearly'
          THEN 'year'
      END AS interval,
      p.active AS "planActive",
      p.per_cycle_cost AS "perCycleCost",
      p.price_id AS "prevPriceId",
      c.sum AS count
    FROM user_plan up
    JOIN plans p
    ON up.plan_id = p.plan_id
    JOIN c
    ON up.plan_id = c.plan_id;


CREATE VIEW next_bill_date AS
  SELECT
    p.plan_id,
    CASE
      WHEN CURRENT_TIMESTAMP < p.start_date
        THEN p.start_date
      ELSE
        CASE
          WHEN p.cycle_frequency = 'weekly'
            THEN
              p.start_date
              + MAKE_INTERVAL(weeks => (FLOOR (EXTRACT (DAY FROM (CURRENT_TIMESTAMP - p.start_date)) / 7))::INTEGER)
              + interval '1 week'
          WHEN p.cycle_frequency = 'monthly'
            THEN
              p.start_date
              + DATE_TRUNC('month', AGE(CURRENT_TIMESTAMP, p.start_date))
              + interval '1 month'
          ELSE
            p.start_date
            + DATE_TRUNC('year', AGE(CURRENT_TIMESTAMP, p.start_date))
            + interval '1 year'
        END
    END AS next_bill_date
  FROM plans p;


CREATE VIEW subscription_setup AS
  SELECT
    CASE
      WHEN p.cycle_frequency = 'weekly'
        THEN 'week'
      WHEN p.cycle_frequency = 'monthly'
        THEN 'month'
      ELSE 'year'
    END AS "cycleFrequency",
    p.plan_id,
    p.per_cycle_cost AS "perCycleCost",
    p.active,
    p.price_id AS "prevPriceId",
    SUM (up.quantity)::INTEGER AS count,
    ROUND (EXTRACT (EPOCH FROM nbd.next_bill_date)) AS "startDate"
  FROM plans p
  JOIN user_plan up
  ON p.plan_id = up.plan_id
  JOIN next_bill_date nbd
  ON nbd.plan_id = up.plan_id
  GROUP BY
    p.price_id, p.cycle_frequency, p.per_cycle_cost, p.price_id, p.start_date, p.active, p.plan_id, nbd.next_bill_date;


WITH t AS (SELECT quantity, subscription_id, plan_owner FROM user_plan up WHERE plan_id = 'prod_MqGUCmNa8vxUtp' AND username = 'binh'), t2 AS (SELECT p.plan_id, plan_name, UPPER(cycle_frequency::VARCHAR) AS cycle_frequency, per_cycle_cost, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, COUNT(up) AS total_members, SUM(up.quantity) AS total_quantity, COALESCE((SELECT quantity FROM t), 0) AS quantity, COALESCE((SELECT plan_owner FROM t), False) AS plan_owner, (SELECT subscription_id FROM t) AS subscription_id FROM plans p JOIN user_plan up ON p.plan_id = up.plan_id WHERE up.plan_id = 'prod_MqGUCmNa8vxUtp' AND up.active = True AND p.active = True GROUP BY p.plan_id) SELECT t2.*, CASE WHEN quantity = 0 THEN 0 ELSE (CEIL(per_cycle_cost::NUMERIC / total_quantity) * quantity)::INT END AS self_cost FROM t2;
WITH i AS (SELECT MIN(charge_date) AS joined_date, username FROM invoices WHERE plan_id = 'prod_MqGUCmNa8vxUtp' GROUP BY username), t AS (SELECT first_name, last_name, quantity, plan_owner, COALESCE((SELECT joined_date FROM i WHERE i.username = up.username), (SELECT next_bill_date FROM next_bill_date WHERE plan_id = 'prod_MqGUCmNa8vxUtp')) AS joined_date FROM users u JOIN user_plan up ON u.username = up.username WHERE plan_id = 'prod_MqGUCmNa8vxUtp' AND up.active = True AND up.username != 'maily') SELECT COALESCE(JSON_AGG(ROW_TO_JSON(t)), '[]'::JSON) AS "activeMembers" FROM t;