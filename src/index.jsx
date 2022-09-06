import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App.jsx';

// require('dotenv').config();

// console.log('env: ', process.env.PORT);

const client = new ApolloClient({
  uri: 'http://localhost:5647/graphql',
  // will need to find out how to 'hide' server URI when deployed
  cache: new InMemoryCache(),
});

const root = createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
);
