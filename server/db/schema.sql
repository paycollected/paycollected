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
  s_cus_id VARCHAR(50) NOT NULL UNIQUE,
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
  id BIGSERIAL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  plan_owner BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE, -- will also be True for owner with quant = 0; only false once archived
  subscription_id VARCHAR(50) UNIQUE,
  subscription_item_id VARCHAR(50) UNIQUE,
  UNIQUE (username, plan_id)
);


CREATE TABLE IF NOT EXISTS plans_history(
  id BIGSERIAL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL, -- indicating the interval for which plan_cost & unit_cost were used
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT INFINITY, -- indicating the interval for which plan_cost & unit_cost were used
  plan_cost INTEGER NOT NULL CHECK (plan_cost >= 1000), -- similar to per_cycle_cost in plans table
);


CREATE TABLE IF NOT EXISTS invoices (
  invoice_id VARCHAR(50) PRIMARY KEY, -- invoice ID pulled from stripe
  username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL, -- charge date
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_amount INTEGER NOT NULL CHECK (paid_amount > 0) -- including platform fees, takes into account quantity purchased
  UNIQUE (username, plan_id, period_start)
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
    up.quantity
  FROM user_plan up
  JOIN users u
  ON up.username = u.username;

