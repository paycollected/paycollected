import React from 'react';

export default function Dashboard({ username, setUser }) {
  return (
    <div>
      <h1>
        {username}
        &apos;s Dashboard
      </h1>
    </div>
  );
}
