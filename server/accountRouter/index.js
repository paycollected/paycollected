import express from 'express';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import { verifyEmailUpdateStripeCustomerId, verifyEmail } from '../db/models';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
const accountRouter = express.Router();

accountRouter.get('/verify', async (req, res) => {
  const { token, testClockId } = req.query;
  try {
    const {
      email, name, username, sCusId
    } = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET_KEY);


    let stripeCusId;
    if (sCusId === null) {
      const customer = { name, email, metadata: { username } };
      if (testClockId) {
        customer.test_clock = testClockId;
      }
      ({ id: stripeCusId } = await stripe.customers.create(customer));
      await verifyEmailUpdateStripeCustomerId(stripeCusId, username);
    } else {
      stripeCusId = sCusId;
      await Promise.all([verifyEmail(username), stripe.customers.update(stripeCusId, { email })]);
    }

    const loginToken = jwt.sign({
      // expires after 30 mins
      exp: Math.floor(Date.now() / 1000) + (60 * 30),
      user: { username, stripeCusId },
    }, process.env.SIGNIN_SECRET_KEY);
    res.redirect(`/dashboard/?username=${username}&token=${loginToken}`);
  } catch (e) {
    console.log(e);
    res.redirect('/signup/?status=failed');
  }
});

export default accountRouter;
