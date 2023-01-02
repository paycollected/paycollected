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

const formatDate = (date) => {
  const dateSplit = date.split('-');
  return `${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`;
};

const cache = new InMemoryCache({
  typePolicies: {
    PlanDetail: {
      keyFields: ['planId'],
      fields: {
        startDate(date) { return formatDate(date); },
        nextBillDate(date) { return formatDate(date); },
        cycleFrequency(cf) { return cf[0].concat(cf.slice(1).toLowerCase()); },
      },
    },
    PlanSummary: {
      keyFields: ['planId'],
      fields: {
        nextBillDate(date) { return formatDate(date); },
        cycleFrequency(cf) { return cf[0].concat(cf.slice(1).toLowerCase()); },
      },
    },
    PlanMember: {
      fields: {
        joinedDate(date) { return formatDate(date); },
        fullName(_, { readField }) { return `${readField('firstName')} ${readField('lastName')}`; }
      },
    },
    PlanOwner: {
      fields: {
        fullName(_, { readField }) { return `${readField('firstName')} ${readField('lastName')}`; },
        formattedName(_, { readField }) { return `${readField('firstName')} ${readField('lastName')[0]}.`; }
      }
    }
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
