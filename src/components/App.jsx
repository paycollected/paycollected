import React, { useEffect } from 'react';
import { gql, useApolloClient } from '@apollo/client';

function App() {
  /* proof of concept that Apollo Client is working using an existing GraphQL endpoint

  const client = useApolloClient();

  useEffect(() => {
    client.query({
      query: gql`query Query {
        user(username: "binh") {
          username
          img_url
          tracks_liked {
            id
            img_url
            preview
          }
        }
      }
      `,
    })
      .then((results) => {
        console.log(results.data);
      })
      .catch((err) => {
        console.log('-------------->', err);
      });
  }, [client]);

  */

  return (
    <div>Hello World!</div>
  );
}

export default App;
