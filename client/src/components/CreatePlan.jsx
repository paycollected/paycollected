import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import { CreatePlanMutation } from '../graphql/mutations.gql';

const CREATE_PLAN = CreatePlanMutation;

export default function CreatePlan({ setPlanToJoin, setShowMagicLink }) {
  /* after submitting create plan form
  --> will get back a planID as response to mutation
  --> set this planID in state to generate magic link
  */
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const [createNewPlan, { data, loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({ createPlan }) => {
      setPlanToJoin(createPlan.productId);
      setShowMagicLink(true);
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
    },
  });

  const onSubmit = ({
    planName, cycleFrequency, perCycleCost, maxQuantity,
  }) => {
    createNewPlan({
      variables: {
        planName,
        cycleFrequency: cycleFrequency.toUpperCase(),
        perCycleCost: Number(perCycleCost),
        maxQuantity: Number(maxQuantity),
      },
    });
  };

  return (
    <div>
      <h1>This is the Create Subscription page</h1>
      <form
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          name="planName"
          label="Plan Name"
          placeholder="Plan Name"
          required
          type="text"
          variant="outlined"
          defaultValue=""
          {...register('planName', { required: 'Plan name required' })}
          error={!!errors?.planName}
          helperText={errors?.planName ? errors.planName.message : ' '}
        />
        <TextField
          sx={{ width: '25ch' }}
          name="cycleFrequency"
          label="Cycle Frequency"
          placeholder="Cycle Frequency"
          required
          select
          defaultValue=""
          {...register('cycleFrequency', { required: 'Select cycle frequency' })}
          error={!!errors?.cycleFrequency}
          helperText={errors?.cycleFrequency ? errors.cycleFrequency.message : ' '}
        >
          {['Weekly', 'Monthly', 'Yearly'].map((freq) => (
            <MenuItem key={freq} value={freq}>
              {freq}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          name="perCycleCost"
          label="Per-Cycle Cost"
          placeholder="Per-Cycle Cost"
          required
          type="number"
          variant="outlined"
          {...register('perCycleCost', { required: 'Enter total cost per pay cycle' })}
          error={!!errors?.perCycleCost}
          helperText={errors?.perCycleCost ? errors.perCycleCost.message : ' '}
          InputProps={{
            inputProps: { min: 0, step: 0.01 },
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        <TextField
          name="maxQuantity"
          label="Number of people per plan"
          placeholder="Number of people per plan"
          required
          type="number"
          variant="outlined"
          {...register('maxQuantity', { required: 'Max quantity required' })}
          error={!!errors?.maxQuantity}
          helperText={errors?.maxQuantity ? errors.maxQuantity.message : ' '}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <Button type="submit" variant="contained" disabled={loading}>Submit</Button>
      </form>
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
    </div>
  );
}
