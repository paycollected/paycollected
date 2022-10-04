DROP DATABASE IF EXISTS paycollected;
CREATE DATABASE paycollected;

\c paycollected;

-- non-relational tables
CREATE TABLE IF NOT EXISTS users (
  -- id SERIAL PRIMARY KEY,
  username VARCHAR(100) PRIMARY KEY, -- shall we make this the primary key instead? the id field seems useless
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR (100) NOT NULL,
  password VARCHAR(200) NOT NULL, -- hashed
  email VARCHAR(100) NOT NULL UNIQUE,
  s_cus_id VARCHAR(200) UNIQUE
  -- credit card id
);

CREATE TYPE cycle_freq AS ENUM ('weekly', 'monthly', 'yearly');

CREATE TABLE IF NOT EXISTS plans (
  -- id SERIAL PRIMARY KEY,
  -- owner_username VARCHAR(100) NOT NULL REFERENCES users(username),
  plan_name VARCHAR(50) NOT NULL,
  cycle_frequency CYCLE_FREQ NOT NULL,
  per_cycle_cost INTEGER NOT NULL,
  per_user_per_cycle_cost INTEGER NOT NULL,
  s_prod_id VARCHAR(255) PRIMARY KEY,
  s_price_id VARCHAR(255) UNIQUE NOT NULL, -- corresponds to per_user_per_cycle_cost
  max_quantity INTEGER NOT NULL
);

-- relational tables
CREATE TABLE IF NOT EXISTS user_plan (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL REFERENCES users(username),
  plan_id VARCHAR(255) NOT NULL REFERENCES plans(s_prod_id),
  plan_owner BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 0,
  subscription_id VARCHAR(255) UNIQUE, -- stripe subscription id
  UNIQUE (username, plan_id)
);
