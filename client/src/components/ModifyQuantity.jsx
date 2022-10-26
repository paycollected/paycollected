import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import ConfirmModifyQuant from './ConfirmModifyQuant.jsx';

export default function ModifyQuantity({ quantity: originalQuant, plan }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(originalQuant.toString());

  // maybe allow only up to 6 units per plan

  return (
    <div>
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
            <Badge
              mx="1"
              width="3ch"
              fontSize="1.2em"
              colorScheme={quantity === originalQuant.toString() ? 'default' : 'red'}
            >
              {quantity}
            </Badge>
            <Button
              size="xs"
              disabled={Number(quantity) >= 6}
              onClick={
                () => {
                  if (!Number.isNaN(Number(quantity))) {
                    setQuantity((Number(quantity) + 1).toString());
                  }
                }
              }
            >
              <AddIcon />
            </Button>
            <ConfirmModifyQuant
              plan={plan}
              originalQuant={originalQuant}
              newQuantity={quantity}
            />
          </div>
        )}
    </div>
  );
}
