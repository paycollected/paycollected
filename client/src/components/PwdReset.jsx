import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';

export default function PwdReset() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();


  return (
    <div>
      {/* <form>

      </form> */}
    </div>
  );
}