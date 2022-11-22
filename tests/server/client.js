require('dotenv').config();
const { Client } = require('pg');
export const pgClient = new Client({
  host: 'localhost',
  database: process.env.DB,
});

export const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);