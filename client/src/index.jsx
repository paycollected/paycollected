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
          bgGradient={[
            'linear(to-br, rgba(75, 232, 48, 0.76), rgba(46, 71, 249, 0.72))',
            'linear(to-br, rgba(75, 232, 48, 0.76), rgba(46, 71, 249, 0.72)'
          ]}
        >
          <App />
        </Box>
      </ChakraProvider>
    </BrowserRouter>
  </ApolloProvider>
);
