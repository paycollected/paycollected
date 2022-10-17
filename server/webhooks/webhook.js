import express from 'express';
import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as helpers from './helpers.js';

dotenv.config();
const webhook = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

webhook.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeSDK.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  let invoice;
  let subscription;
  let setupIntent;
  switch (event.type) {
    case 'invoice.payment_failed':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_failed
      break;
    case 'invoice.payment_succeeded':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_succeeded
      break;
    case 'setup_intent.succeeded': // someone new joining plan
      setupIntent = event.data.object;
      await helpers.handleSubscriptionStart(setupIntent);
      break;
    case 'customer.subscription.updated':
      subscription = event.data.object;
      const { metadata } = subscription;
      if (JSON.parse(metadata.quantChanged)) {
        await helpers.handleSubscriptionQuantChange(subscription);
      } else if (JSON.parse(metadata.cancelSubs)) {
        // handle special case of plan owner deleting subscription!
        // if plan owner and there are still active members --> transfer ownership
        // if plan owner and no active members --> disable option to transfer ownership
        // can only delete entire plan at this point
        await helpers.handleSubscriptionCancel(subscription);
      }
      break;
    case 'customer.subscription.deleted':
      subscription = event.data.object;
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

export default webhook;