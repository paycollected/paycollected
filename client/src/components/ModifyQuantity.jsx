import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

const regex = /[1-6]/;

export default function ModifyQuantity({
  quantity: originalQuant, setModal, setNewQuant, plan, setPlanToModify
}) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(originalQuant.toString());
  const [inputErr, setInputErr] = useState(null);

  useEffect(() => {
    setInputErr(null);
  }, [quantity]);

  // maybe allow only up to 6 units per plan

  const handleSubmit = () => {
    if (quantity === originalQuant.toString()) {
      setInputErr('Please submit a quantity different from your original.');
    } else if (!regex.test(quantity) || quantity.length > 1) {
      setInputErr('Invalid input! Only 1 through 6 please.');
    } else {
      setPlanToModify(plan);
      setNewQuant(Number(quantity));
      setModal('confirmQuantChange');
    }
  };
  return (
    <div>
      {inputErr && (<p>{inputErr}</p>)}
      {quantity === '0'
        ? (
          <Button onClick={() => { navigate(`/join/${plan.planId}`); }}>Join</Button>
        ) : (
          <div>
            <Button
              size="xs"
              disabled={Number(quantity) === 1}
              onClick={
                () => {
                  if (!Number.isNaN(Number(quantity))) {
                    setQuantity((Number(quantity) - 1).toString());
                  }
                }
              }
            >
              <MinusIcon />
            </Button>
            <Input
              type="text"
              maxLength="1"
              min="1"
              max="6"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                // setInputErr(null);
              }}
              style={{ width: '20px' }}
            />
            <Button
              size="xs"
              disabled={Number(quantity) >= 6}
              onClick={
                () => {
                  if (!isNaN(Number(quantity))) {
                    setQuantity((Number(quantity) + 1).toString());
                  }
                }
              }
            >
              <AddIcon />
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!!inputErr}
            >
              Change quantity
            </Button>
          </div>
        )}
    </div>
  );
}
