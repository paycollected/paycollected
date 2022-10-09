import express from 'express';
import dotenv from 'dotenv';
import stripeSDK from 'stripe';
import * as helpers from './helpers.js';

dotenv.config();
const webhook = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;


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
  switch (event.type) {
    case 'invoice.payment_failed':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_failed
      break;
    case 'invoice.payment_succeeded':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_succeeded
      break;
    case 'customer.subscription.created':
      subscription = event.data.object;
      const { id: subscriptionId, customer: customerId, items, metadata } = subscription;
      const { username } = metadata;
      const { id: subscriptionItemId, price, quantity } = items.data[0];
      const { id: newPriceId, product: productId } = price;
      // will still need to handle email automation - maybe using SendGrid

      try {
        // processPriceId and processSubscriptions don't depend on each other so we can await them simultaneously
        await Promise.all([
          helpers.processPriceId(productId, newPriceId),
          helpers.processSubscriptions(productId, quantity, subscriptionId, subscriptionItemId, username, newPriceId)
        ]);
      } catch (err) {
        console.log(err);
      };
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

export default webhook;