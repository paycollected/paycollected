import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ApolloClient, InMemoryCache, ApolloProvider, createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import App from './App.jsx';
import { globalTheme } from './styles/styles.js';


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
    PlanDetail: { keyFields: ['planId'] },
    PlanSummary: { keyFields: ['planId'] },
  },
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache,
  connectToDevTools: true,
});


const root = createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <ChakraProvider theme={globalTheme}>
        <Flex
          w="100%"
          h="max-content"
          bg="white"
          direction="column"
          align="center"
        >
          <App />
        </Flex>
      </ChakraProvider>
    </BrowserRouter>
  </ApolloProvider>
);
