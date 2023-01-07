import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ApolloClient, InMemoryCache, ApolloProvider, createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, Flex } from '@chakra-ui/react';
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
  if (dateSplit.length === 3) return `${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`;
  return date;
};

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        viewAllPlans: {
          keyArgs: ['orderBy'],
          read(existing, { args: { offset = 0, limit = existing?.plans.length, } }) {
            console.log('------>', limit, offset, existing);
            if (existing) {
              const { total, plans } = existing;
              return { total, plans: plans.slice(offset, offset + limit) };
            }
            return existing;
          },
          merge(existing, incoming, { args: { offset = 0 } }) {
            if (!existing) return incoming;
            const { total, plans } = existing;
            const merged = plans.slice(0);
            for (let i = 0; i < incoming.plans.length; i += 1) {
              merged[offset + i] = incoming.plans[i];
            }
            return { total, plans: merged };
          },
        }
      }
    },
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
    },
    SuccessfulPaymentData: {
      fields: {
        nextBillDate(date) { return formatDate(date); },
        cycleFrequency(cf) { return cf[0].concat(cf.slice(1).toLowerCase()); },
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
