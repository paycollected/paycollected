import express from 'express';
import dotenv from 'dotenv';
import stripe from 'stripe';

dotenv.config();
const webhook = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

webhook.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  let invoice;
  switch (event.type) {
    case 'invoice.payment_failed':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_failed
      break;
    case 'invoice.payment_succeeded':
      invoice = event.data.object;
      // Then define and call a function to handle the event invoice.payment_succeeded
      break;
    case 'setup_intent.succeeded':
      const setupIntent = event.data.object;
      console.log('-----------> here is the setupIntent', setupIntent);

      /*
      sample setupIntent event object:
      {
        id: 'seti_1LqIFwAJ5Ik974ueG3yqSpnO',
        object: 'setup_intent',
        application: null,
        cancellation_reason: null,
        client_secret: 'seti_1LqIFwAJ5Ik974ueG3yqSpnO_secret_MZR8m1EIiaIs3nEFsHogIXkzLd9cb79',
        created: 1665155672,
        customer: 'cus_MZHqVYncRVfWZB',
        description: null,
        flow_directions: null,
        last_setup_error: null,
        latest_attempt: 'setatt_1LqIFzAJ5Ik974ueCDXgNphA',
        livemode: false,
        mandate: 'mandate_1LqIG0AJ5Ik974uePxHJTWOU',
        metadata: {},
        next_action: null,
        on_behalf_of: null,
        payment_method: 'pm_1LqIFzAJ5Ik974ueurBGpOXI',
        payment_method_options: {
          card: {
            mandate_options: null,
            network: null,
            request_three_d_secure: 'automatic'
          }
        },
        payment_method_types: [ 'link', 'card' ],
        single_use_mandate: null,
        status: 'succeeded',
        usage: 'off_session'
      }

      */

    // Then define and call a function to handle the event setup_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

export default webhook;