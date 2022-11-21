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


CREATE VIEW subscription_setup AS
  SELECT
    CASE
      WHEN p.cycle_frequency = 'weekly'
        THEN 'week'
      WHEN p.cycle_frequency = 'monthly'
        THEN 'month'
      WHEN p.cycle_frequency = 'yearly'
        THEN 'year'
    END AS "cycleFrequency",
    p.plan_id,
    p.per_cycle_cost AS "perCycleCost",
    p.active,
    p.price_id AS "prevPriceId",
    SUM (up.quantity)::INTEGER AS count,
    CASE
      WHEN CURRENT_TIMESTAMP < p.start_date
        THEN ROUND (EXTRACT (EPOCH FROM p.start_date))
      WHEN CURRENT_TIMESTAMP >= p.start_date
        THEN
          CASE
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
  GROUP BY
    p.price_id, p.cycle_frequency, p.per_cycle_cost, p.price_id, p.start_date, p.active, p.plan_id;
