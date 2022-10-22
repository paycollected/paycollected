DROP DATABASE IF EXISTS paycollected;
CREATE DATABASE paycollected;

\c paycollected;

-- non-relational tables
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(100) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR (100) NOT NULL,
  password VARCHAR(200) NOT NULL, -- hashed
  email VARCHAR(100) NOT NULL UNIQUE,
  s_cus_id VARCHAR(200) NOT NULL UNIQUE
);

CREATE TYPE cycle_freq AS ENUM ('weekly', 'monthly', 'yearly');

CREATE TABLE IF NOT EXISTS plans (
  plan_id VARCHAR(255) PRIMARY KEY,
  price_id VARCHAR(255) NOT NULL UNIQUE,
  plan_name VARCHAR(50) NOT NULL,
  cycle_frequency CYCLE_FREQ NOT NULL,
  per_cycle_cost INTEGER NOT NULL,
  start_date BIGINT NOT NULL -- in UTC format
);

CREATE TABLE IF NOT EXISTS pending_subs (
  subscription_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- relational tables
CREATE TABLE IF NOT EXISTS user_plan (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  plan_id VARCHAR(255) NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
  plan_owner BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 0,
  subscription_id VARCHAR(255) UNIQUE, -- stripe subscription id
  subscription_item_id VARCHAR(255) UNIQUE,
  UNIQUE (username, plan_id)
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

