import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import jwt from 'jsonwebtoken';
import typeDefs from './graphql/controllers/typeDefs';
import resolvers from './graphql/controllers/resolvers';
import router from './rest/routes';

require('dotenv').config();

const SERVER_PORT = process.env.SERVER_PORT;

async function startApolloServer(typeDefs, resolvers) {
  const app = express();
  app.use('/rest', router);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      // no Authorization (may be signing up)
      if (token.length > 0) {
        try {
          const username = jwt.verify(token, process.env.SECRET_KEY).data;
          return { username, err: null };
        } catch {
          /* If handling authentication error at context level as opposed to at resolvers level,
          error message appears slightly different from what we're used to with the other errors
          ('fail to create context' etc.). Moving this error handling to resolvers to 'standardize'
          error msgs.
          */
          return { username: null, err: 'Incorrect token'}
        }
      }
      return { username: null, err: 'Unauthorized request' };
    },
  });

  await server.start();
  server.applyMiddleware({ app, cors: { origin: true, credentials: true } });
  app.listen(SERVER_PORT, () => {
    console.log(`🛌 REST server is served at localhost:${SERVER_PORT}`);
  });
  console.log(`🚀 GraphQL Server ready at http://localhost:${SERVER_PORT}${server.graphqlPath}`);
};

startApolloServer(typeDefs, resolvers);
