import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { ResetPassword as RESET } from '../graphql/mutations.gql';

export default function PwdReset() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [resetPwd, { loading }] = useMutation(RESET, {
    onCompleted: () => { }
  });

  return (
    <div>
      <form>

      </form>
    </div>
  );
}