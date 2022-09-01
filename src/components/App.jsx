import React, { useEffect } from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';

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
  const HELLO = gql`
    query Query {
      hello
    }
  `;

  const { loading, error, data } = useQuery(HELLO);

  if (data) {
    return (
      <div>{data.hello}</div>
    );
  }
  return null;
}

export default App;
