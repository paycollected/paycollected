const { pgClient, stripe } = require('../client.js');
const { gql, ApolloClient, InMemoryCache } = require('@apollo/client');
const jwt = require('jsonwebtoken');

export default function () {
  const token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 5),
    user: {
      username: 'testUser',
      stripeCusId: customerId,
    }
  }, process.env.SIGNIN_SECRET_KEY);

  apolloClient = new ApolloClient({
    uri: 'http://localhost:5647/graphql',
    headers: {
      'Authorization': token,
    },
    cache: new InMemoryCache(),
  });
}
