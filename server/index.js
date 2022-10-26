import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import webhook from './webhooks/webhook';

dotenv.config();

const { SERVER_PORT } = process.env;

async function startApolloServer() {
  const app = express();
  app.use('/', webhook);

  // Json middleware must be mounted AFTER webhook endpoint
  // because req.body needs to be in json format
  // so that webhook could convert it into raw buffer
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    nodeEnv: 'test',
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      // no Authorization (may be signing up)
      if (token.length > 0) {
        try {
          const { user } = jwt.verify(token, process.env.SECRET_KEY);
          const { username, stripeCusId } = user;
          return {
            user: {
              username, stripeCusId,
            },
            err: null
          };
        } catch (e) {
          // handling error at resolver level
          return { user: null, err: 'Incorrect token' };
        }
      }
      return { user: null, err: 'Unauthorized request' };
    },
  });

  await server.start();

  server.applyMiddleware({ app, cors: { origin: true, credentials: true } });

  // serving web client
  // these needs to go AFTER Apollo server and webhook middlewares
  // otherwise * wildcard endpoint will redirect /graphql and /webhook endpoints to 404 page
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'client', 'dist', 'index.html')));

  app.listen(SERVER_PORT, () => {
    console.log(`🛌 REST server is served at localhost:${SERVER_PORT}`);
    console.log(`🚀 GraphQL Server ready at http://localhost:${SERVER_PORT}${server.graphqlPath}`);
  });
}

startApolloServer();
