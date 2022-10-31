import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
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
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    csrfPrevention: true,
    cache: 'bounded',
    nodeEnv: 'test',
  });

  await server.start();
  app.use('/webhook', webhook);

  // Json middleware must be mounted AFTER webhook endpoint
  // because req.body needs to be in json format
  // so that webhook could convert it into raw buffer
  app.use(cors(), json());

  app.use('/graphql', expressMiddleware(server, {
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
  }));

  // serving web client
  // these needs to go AFTER Apollo server and webhook middlewares
  // otherwise * wildcard endpoint will redirect /graphql and /webhook endpoints to 404 page
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'client', 'dist', 'index.html')));

  await new Promise((resolve) => httpServer.listen({ port: SERVER_PORT }, resolve));
  console.log(`🛌 REST server is served at localhost:${SERVER_PORT}`);
}

startApolloServer();
