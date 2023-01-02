import stripeSDK from 'stripe';
import { updateStripePrice } from '../../utils';
import { subscriptionSetup, startSubscription, startSubsNoPriceUpdate } from '../../db/models';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function handleSubscriptionStart(setupIntent) {
  if (Object.keys(setupIntent.metadata).length > 0) {
  // only run this if a new subscription is created through our site
  // A new setupIntent is also created and succeeds when a user updates their payment method,
  // or when an invoice is created
    const { id: setupIntentId, customer, payment_method: paymentMethodId } = setupIntent;
    const { planId } = setupIntent.metadata;
    const quantity = Number(setupIntent.metadata.quantity);
    try {
      const [
        { rows },
        { invoice_settings: { default_payment_method: defaultPmntMethod } },
        {
          card: {
            brand, exp_month: expiryMonth, exp_year: expiryYear, last4,
          }
        }
      ] = await Promise.all([
        subscriptionSetup(planId, customer),
        stripe.customers.retrieve(customer),
        stripe.paymentMethods.retrieve(paymentMethodId),
      ]);

      const {
        cycleFrequency, perCycleCost, count, prevPriceId, startDate, members, existingQuant, active
      } = rows[0];

      if (active && existingQuant === 0) {
        // ensure idempotency -- do not run this code if user already subscribed
        // if plan no longer active, also don't run code

        const productTotalQuantity = quantity + count;
        const subscription = {
          customer,
          items: [{
            price: prevPriceId,
            quantity,
          }],
          payment_behavior: 'default_incomplete',
          payment_settings: {
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card'],
          },
          proration_behavior: 'none',
          trial_end: startDate,
          default_payment_method: paymentMethodId,
        };
        console.log('----------> A');
        const metadata = {
          paymentMethod: JSON.stringify({
            brand,
            expiryMonth,
            expiryYear,
            last4,
            id: paymentMethodId,
            default: defaultPmntMethod === null || paymentMethodId === defaultPmntMethod,
          }),
        };
        console.log('----------> B');

        if (count > 0 || quantity > 1) {
          const promises = [
            stripe.prices.create({
              currency: 'usd',
              product: planId,
              unit_amount: Math.round((Math.ceil(perCycleCost / productTotalQuantity)) * 1.05),
              recurring: { interval: cycleFrequency },
            }),
            // create new price ID;
            stripe.prices.update(prevPriceId, { active: false }),
            // archive old price ID
            stripe.setupIntents.update(setupIntentId, { metadata }),
          ];

          if (defaultPmntMethod === null) {
            promises.push(
              stripe.customers.update(
                customer,
                { invoice_settings: { default_payment_method: paymentMethodId } }
              )
              // update the default payment method for this customer
            );
          }
          const [{ id: newPriceId }] = await Promise.all(promises);
          subscription.items[0].price = newPriceId;

          const createNewSubsAndUpdateDb = async () => {
            const { id: subscriptionId, items } = await stripe.subscriptions.create(subscription);
            const { id: subscriptionItemId } = items.data[0];
            return startSubscription(
              planId,
              quantity,
              subscriptionId,
              subscriptionItemId,
              customer,
              newPriceId
            );
          };

          if (count === 0) {
            await createNewSubsAndUpdateDb();
          } else {
            await Promise.all([
              createNewSubsAndUpdateDb(),
              ...members.map((member) => updateStripePrice(member, newPriceId)),
            ]);
          }
        } else {
          // case when quantity = 1 and count = 0
          // no active plan members yet, no need to update price
          let subscriptionId;
          let items;

          if (defaultPmntMethod === null) {
            [{ id: subscriptionId, items }] = await Promise.all([
              stripe.subscriptions.create(subscription),
              stripe.customers.update(
                customer,
                { invoice_settings: { default_payment_method: paymentMethodId } }
              ),
              stripe.setupIntents.update(setupIntentId, { metadata }),
            ]);
          } else {
            [{ id: subscriptionId, items }] = await Promise.all([
              stripe.subscriptions.create(subscription),
              stripe.setupIntents.update(setupIntentId, { metadata }),
            ]);
          }
          const { id: subscriptionItemId } = items.data[0];
          await startSubsNoPriceUpdate(
            planId,
            quantity,
            subscriptionId,
            subscriptionItemId,
            customer,
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}
