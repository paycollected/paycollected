const { Client } = require('pg');
const pgClient = new Client({
  host: 'localhost',
  database: process.env.DB,
});

client
  .connect()
