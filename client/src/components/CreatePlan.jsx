import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@chakra-ui/react';
import { CreatePlanMutation as CREATE_PLAN } from '../graphql/mutations.gql';

const today = new Date();
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
// we'll limit users to a start date that is between tomorrow and 1 month from then

const processDateStr = (date) => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // month is zero-th indexed
  const dateStr = (date.getDate() + 1).toString().padStart(2, '0'); // starting tomorrow
  return `${year}-${month}-${dateStr}`;
};

const fullDate = processDateStr(today);
const nextMonthFullDate = processDateStr(nextMonth);

export default function CreatePlan({ setPlanToJoin, setShowMagicLink }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [startDate, setStartDate] = useState(fullDate);

  const [createNewPlan, { data, loading, error }] = useMutation(CREATE_PLAN, {
    onCompleted: ({ createPlan: { planId } }) => {
      setPlanToJoin(planId);
      setShowMagicLink(true);
    },
    onError: ({ message }) => {
      console.log('error creating plan: ', message);
    },
  });

  const onSubmit = ({
    planName, cycleFrequency, perCycleCost,
  }) => {
    const formattedStartDate = new Date(...startDate.split('-'));
    formattedStartDate.setMonth(formattedStartDate.getMonth() - 1); // month is zero-th indexed
    formattedStartDate.setHours(23, 59, 59); // set time to 23:59:59 almost at midnight
    createNewPlan({
      variables: {
        planName,
        cycleFrequency: cycleFrequency.toUpperCase(),
        perCycleCost: Number(perCycleCost),
        startDate: (formattedStartDate.valueOf() / 1000).toString(),
        // need seconds and not milliseconds
        // only using dates so exact time will default to 00:00:00 of that day
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
        <Input
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
        <Select
          sx={{ width: '25ch' }}
          name="cycleFrequency"
          label="Cycle Frequency"
          placeholder="Cycle Frequency"
          required
          defaultValue=""
          {...register('cycleFrequency', { required: 'Select cycle frequency' })}
          error={!!errors?.cycleFrequency}
          helperText={errors?.cycleFrequency ? errors.cycleFrequency.message : ' '}
        >
          {['Weekly', 'Monthly', 'Yearly'].map((freq) => (
            <option key={freq} value={freq}>
              {freq}
            </option>
          ))}
        </Select>
        <Input
          name="perCycleCost"
          label="Per-Cycle Cost"
          placeholder="Per-Cycle Cost"
          required
          type="number"
          variant="outlined"
          {...register('perCycleCost', { required: 'Enter total cost per pay cycle' })}
          error={!!errors?.perCycleCost}
          helperText={errors?.perCycleCost ? errors.perCycleCost.message : ' '}
        />
        <input
          type="date"
          value={startDate}
          min={fullDate}
          max={nextMonthFullDate}
          onChange={(e) => { setStartDate(e.target.value); }}
        />
        <Button type="submit" variant="contained" disabled={loading}>Submit</Button>
      </form>
      <Button variant="contained" onClick={() => { navigate('/dashboard'); }}>Cancel</Button>
    </div>
  );
}
