import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import ConfirmModifyQuant from './ConfirmModifyQuant.jsx';

export default function ModifyQuantity({
  originalQuant, plan
}) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(originalQuant);

  useEffect(() => {
    setQuantity(originalQuant);
  }, [originalQuant]);

  // maybe allow only up to 6 units per plan

  return (
    <div>
      {originalQuant === 0
        ? (
          <Button onClick={() => { navigate(`/join/${plan.planId}`); }}>Join</Button>
        ) : (
          <div>
            <Button
              size="xs"
              disabled={quantity === 1}
              onClick={
                () => {
                  setQuantity(quantity - 1);
                }
              }
            >
              <MinusIcon />
            </Button>
            <Badge
              mx="1"
              width="3ch"
              fontSize="1.2em"
              colorScheme={quantity === originalQuant ? 'default' : 'red'}
            >
              {quantity}
            </Badge>
            <Button
              size="xs"
              disabled={quantity >= 6}
              onClick={
                () => {
                  setQuantity(quantity + 1);
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
