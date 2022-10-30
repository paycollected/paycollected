require('dotenv').config();

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setSubstitutionWrappers('%', '%');
const msg = {
  from: {
    email: 'admin@paycollected.com',
    name: 'PayCollected'
  },
  subject: 'Please verify your email address v2.0',
  text: 'Hello %username%',
  html: '<strong>Hello %username%</strong>',
  personalizations: [
    {
      to: [
        {
          email: 'kbinhnguyen.nihongo@gmail.com',
          name: 'Binh Nguyen',
        }
      ],
      substitutions:
      {
        username: 'emmanescent',
      },
    },
    {
      to: [
        {
          email: 'kbinhnguyen.thai@gmail.com',
          name: 'Binh v2.0 Nguyen'
        }
      ],
      substitutions:
      {
        username: 'kbinhnguyen'
      },
    },
  ],
};

sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent');
  })
  .catch((error) => {
    console.error(error);
  });
