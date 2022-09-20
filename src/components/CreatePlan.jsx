import React from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';

export default function CreatePlan({ setPlanToJoin, setShowMagicLink }) {
  /* after submitting create plan form
  --> will get back a planID as response to mutation
  --> set this planID in state to generate magic link
  */
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = ({
    planName, cycleAmount, cycleFreq, numUsers,
  }) => {
    console.log('form data: ', planName, cycleAmount, cycleFreq, numUsers);
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
          required
          type="text"
          variant="outlined"
          defaultValue=""
          {...register('planName', { required: 'Plan name required' })}
          error={!!errors?.planName}
          helperText={errors?.planName ? errors.planName.message : ' '}
        />
        <TextField
          name="cycleAmount"
          label="Per-Cycle Amount"
          required
          type="number"
          variant="outlined"
          {...register('cycleAmount', { required: 'Enter total amount per pay cycle' })}
          error={!!errors?.cycleAmount}
          helperText={errors?.cycleAmount ? errors.cycleAmount.message : ' '}
          InputProps={{
            inputProps: { min: 0 },
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
        <TextField
          sx={{ width: '25ch' }}
          name="cycleFreq"
          label="Cycle Frequency"
          required
          select
          defaultValue=""
          {...register('cycleFreq', { required: 'Select cycle frequency' })}
          error={!!errors?.cycleFreq}
          helperText={errors?.cycleFreq ? errors.cycleFreq.message : ' '}
        >
          {['Monthly', 'Every 3 months', 'Yearly'].map((freq) => (
            <MenuItem key={freq} value={freq}>
              {freq}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          name="numUsers"
          label="Number of people per plan"
          required
          type="number"
          variant="outlined"
          {...register('numUsers', { required: 'Number of members required' })}
          error={!!errors?.numUsers}
          helperText={errors?.numUsers ? errors.numUsers.message : ' '}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <Button type="submit" variant="contained">Submit</Button>
      </form>
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
    </div>
  );
}
