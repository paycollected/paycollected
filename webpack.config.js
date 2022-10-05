const path = require('path');
const Dotenv = require('dotenv-webpack');

const SRC_DIR = path.join(__dirname, 'client', 'src');
const DIST_DIR = path.join(__dirname, 'client', 'dist');

module.exports = {
  devtool: 'eval-cheap-source-map',
  entry: `${SRC_DIR}/index.jsx`,
  output: {
    filename: 'bundle.js',
    publicPath: '/',
    path: DIST_DIR,
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
    ],
  },
  plugins: [
    new Dotenv(),
  ],
};
