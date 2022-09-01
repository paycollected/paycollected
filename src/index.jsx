import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from './components/App.jsx';

// require('dotenv').config();

const client = new ApolloClient({
  uri: 'http://localhost:4320',
  // will need to find out how to 'hide' server URI when deployed
  cache: new InMemoryCache(),
});

const root = createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);
