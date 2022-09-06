import React, { useEffect } from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import Dashboard from './Dashboard.jsx';
import CreateSubscription from './CreateSubscription.jsx';
import JoinSubscription from './JoinSubscription.jsx';
import Cards from './Cards.jsx';
import Checkout from './Checkout.jsx';
import ViewSubscriptions from './ViewSubscriptions.jsx';

function App() {
  /* proof of concept that Apollo Client is working using an existing GraphQL endpoint

  2 methods to use Apollo Client:
  1) call useApolloClient and use client.query
  (then store results in some state with useEffect) / client.mutate
  OR
  2) useQuery / useMutation React hooks

  */

  // METHOD 1:
  // const client = useApolloClient();

  // useEffect(() => {
  //   client.query({
  //     query: gql`query Query {
  //       hello
  //     }
  //     `,
  //   })
  //     .then((results) => {
  //       console.log(results.data);
  //     })
  //     .catch((err) => {
  //       console.log('-------------->', err);
  //     });
  // }, [client]);

  // METHOD 2:
  // const HELLO = gql`
  //   query Query {
  //     hello
  //   }
  // `;

  // const { loading, error, data } = useQuery(HELLO);

  // if (data) {
  //   return (
  //     <div>{data.hello}</div>
  //   );
  // }
  // return null;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/subscription/create" element={<CreateSubscription />} />
      <Route path="/subscription/:productID" element={<JoinSubscription />} />
      <Route path="/cards" element={<Cards />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/subscription/all" element={<ViewSubscriptions />} />
    </Routes>
  );
}

export default App;
