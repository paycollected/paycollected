import React, { useState, useEffect } from 'react';

const regex = /[1-6]/;

export default function ModifyQuantity({
  quantity: originalQuant, setModal, setNewQuant, plan, setPlanToModify
}) {
  const [quantity, setQuantity] = useState(originalQuant.toString());
  const [inputErr, setInputErr] = useState(null);

  useEffect(() => {
    if (!regex.test(quantity)) {
      setInputErr('Invalid input! Only 1 through 6 please.');
    } else if (inputErr && regex.test(quantity)) {
      setInputErr(null);
    }
  }, [quantity]);

  // maybe allow only up to 6 units per plan

  const handleSubmit = () => {
    if (quantity === originalQuant.toString()) {
      setInputErr('Please submit a quantity different from your original.');
    } else {
      setPlanToModify(plan);
      setNewQuant(Number(quantity));
      setModal('confirmQuantChange');
    }
  };

  return (
    <div style={{
      margin: '1.5rem',
      width: '150px',
      display: 'grid',
      gridTemplateRows: 'repeat(3, max-content)',
      gap: '10px',
    }}
    >
      {inputErr && (<p>{inputErr}</p>)}
      <div style={{
        display: 'grid',
        gridRow: '2 / 3',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        justifyItems: 'center',
      }}
      >
        <button
          type="button"
          disabled={Number(quantity) === 1 }
          onClick={
            () => {
              if (!isNaN(Number(quantity))) {
                setQuantity((Number(quantity) - 1).toString());
              }
            }
          }
        >
          −
        </button>
        <input
          type="text"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setInputErr(null);
          }}
          style={{ width: '20px' }}
        />
        <button
          type="button"
          disabled={Number(quantity) === 6}
          onClick={
            () => {
              if (!isNaN(Number(quantity))) {
                setQuantity((Number(quantity) + 1).toString());
              }
            }
          }
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        style={{ gridRow: '3 / 4' }}
        disabled={!!inputErr}
      >
        Change quantity
      </button>
    </div>
  );
}
