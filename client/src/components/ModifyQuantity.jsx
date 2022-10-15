import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Unsubscribe as UNSUBSCRIBE,
  UnsubscribeAsPlanOwner as UNSUBSCRIBE_AS_OWNER
} from '../graphql/mutations.gql';
import { ViewAllPlans as GET_ALL_PLANS } from '../graphql/queries.gql';

export default function ModifyQuantity({ quantity: originalQuant, subscriptionId }) {
  const [quantity, setQuantity] = useState(originalQuant);

  return (
    <div style={{ margin: '1.5rem' }}>
      <div>
        <button type="button" disabled={quantity === 1} onClick={() => { setQuantity(quantity - 1); }}>−</button>
        <input type="number" value={quantity} min={1} max={6} onChange={(e) => { setQuantity(e.target.value); }} />
        <button type="button" onClick={() => { setQuantity(quantity + 1); }}>+</button>
      </div>
      {console.log(typeof quantity)}
      <button
        type="button"
        onClick={() => { }}
      >
        Change quantity
      </button>
    </div>
  );
}
