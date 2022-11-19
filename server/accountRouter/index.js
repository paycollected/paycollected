import express from 'express';
import jwt from 'jsonwebtoken';
import stripeSDK from 'stripe';
import { verifyEmail } from '../db/models';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);
const accountRouter = express.Router();

accountRouter.get('/verify/:token', async (req, res) => {
  const { params: { token } } = req;
  try {
    const { email, name, username } = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET_KEY);

    const { id: stripeCusId } = await stripe.customers.create(
      { name, email, metadata: { username } }
    );
    await verifyEmail(stripeCusId, username);


    const loginToken = jwt.sign({
      // expires after 30 mins
      exp: Math.floor(Date.now() / 1000) + (60 * 30),
      user: {
        username,
        stripeCusId,
      }
    }, process.env.SIGNIN_SECRET_KEY);
    res.redirect(`/dashboard/?username=${username}&token=${loginToken}`);
  } catch {
    res.redirect('/signup/?status=failed');
  }
});

export default accountRouter;
