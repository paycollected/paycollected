import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

const regex = /[1-6]/;

export default function ModifyQuantity({ quantity: originalQuant, subscriptionId }) {
  const [quantity, setQuantity] = useState(originalQuant.toString());
  const [inputErr, setInputErr] = useState(false);

  useEffect(() => {
    if (!regex.test(quantity)) {
      setInputErr(true);
    } else if (inputErr && regex.test(quantity)) {
      setInputErr(false);
    }
  }, [quantity]);

  // maybe allow only up to 6 units per plan

  return (
    <div style={{
      margin: '1.5rem',
      width: '150px',
      display: 'grid',
      gridTemplateRows: 'repeat(2, max-content)',
      gap: '10px',
    }}
    >
      {inputErr && (<p>Invalid input! Only 1 through 6 please.</p>)}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        justifyItems: 'center',
      }}
      >
        <button type="button" disabled={Number(quantity) === 1} onClick={() => { setQuantity((Number(quantity) - 1).toString()); }}>−</button>
        <input
          type="text"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setInputErr(false);
          }}
          style={{ width: '20px' }}
        />
        <button type="button" disabled={Number(quantity) === 6} onClick={() => { setQuantity((Number(quantity) + 1).toString()); }}>+</button>
      </div>
      <button
        type="button"
        onClick={() => { }}
      >
        Change quantity
      </button>
    </div>
  );
}
