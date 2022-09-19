import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MagicLink({ planToJoin, setShowMagicLink }) {
  const navigate = useNavigate();

  return (
    <>
      <h1>This is the Magic Link page</h1>
      <div>
        <p>Have other members on your plan join by sharing this link:</p>
        <h3>{`${process.env.CLIENT_HOST}:${process.env.PORT}/join/${planToJoin}`}</h3>
        <button
          type="button"
          onClick={() => {
            setShowMagicLink(false);
            navigate(`/join/${planToJoin}`);
          }}
        >
          Join this plan!
        </button>
      </div>
    </>
  );
}
