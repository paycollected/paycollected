require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const { CLIENT_PORT } = process.env;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));

app.listen(CLIENT_PORT, () => {
  console.log(`Client is served at localhost:${CLIENT_PORT}`);
});
