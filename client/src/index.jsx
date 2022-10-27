import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ApolloClient, InMemoryCache, ApolloProvider, createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import App from './components/App.jsx';
import { buttonTheme, inputTheme } from './styles/styles.js';

const httpLink = createHttpLink({
  // TODO: will need to find out how to 'hide' server URI when deployed
  uri: 'http://localhost:5647/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token || '',
    },
  };
});

const cache = new InMemoryCache({
  typePolicies: {
    Plan: {
      keyFields: ['planId'],
    },
    Query: {
      fields: {
        viewAllPlans: {
          merge: (existing = [], incoming) => {
            console.log('---------> existing', existing, '------------> incoming', incoming);
            if (incoming.every((iPlan) => existing.some((ePlan) => ePlan['__ref'] === iPlan['__ref']))
            && existing.length >= incoming.length) {
            // if server's response is not yet updated because webhook is still processing request
            // cache will be more updated and accurate
            // in this case prefer to use cached data
              console.log('1');
              return existing;
            }
            if (!existing.every((ePlan) => incoming.some((iPlan) => ePlan['__ref'] === iPlan['__ref']))) {
              // if viewAllPlans haven't been called yet,
              // for ex: user navigates straight to joinPlan without checking out viewAllPlans first
              // cache will be empty at first
              // after writing to cache after joining a plan,
              // want to merge with network response, which may still be outdated
              console.log('2');
              return [...existing, ...incoming];
            }
            console.log('3');
            return incoming;
          }
        }
      }
    }
  },
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache,
  connectToDevTools: true,
});

const theme = extendTheme({
  components: {
    Button: buttonTheme,
    Input: inputTheme
  }
});

const root = createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <Box
          w="100%"
          h="100vh"
          bg="#A6E1FA"
        >
          <App />
        </Box>
      </ChakraProvider>
    </BrowserRouter>
  </ApolloProvider>
);
