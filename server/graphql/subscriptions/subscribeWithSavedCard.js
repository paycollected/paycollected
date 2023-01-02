import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { subscriptionSetupSavedCard, startSubsNoPriceUpdate, startSubsPriceUpdateUsingUsername } from '../../db/models.js';
import { updateStripePrice } from '../../utils';

const stripe = stripeSDK(process.env.STRIPE_SECRET_KEY);

export default async function subscribeWithSavedCardResolver(
  paymentMethodId,
  setupIntentId,
  password,
  planId,
  username
) {
  let err;
  try {
    const [
      {
        customer: paymentMethodCustomer,
        card: {
          brand, exp_month: expiryMonth, exp_year: expiryYear, last4,
        }
      },
      {
        customer: setupIntentCustomer,
        metadata: { quantity: savedQuant, planId: planIdToSubscribe }
      },
      { rows }
    ] = await Promise.all([
      stripe.paymentMethods.retrieve(paymentMethodId),
      stripe.setupIntents.retrieve(setupIntentId),
      subscriptionSetupSavedCard(planId, username)
    ]);

    const quantity = Number(savedQuant);
    const {
      cycleFrequency, perCycleCost, count, prevPriceId, startDate, user, members, active,
      existingQuant,
    } = rows[0];

    // input validation
    if (user.stripeCusId !== paymentMethodCustomer
      || user.stripeCusId !== setupIntentCustomer
      || planIdToSubscribe !== planId
    ) {
      err = 'User not authorized to perform this action';
      throw new Error();
    } else if (!active) {
      err = 'Plan has already been archived';
    } else if (existingQuant > 0) {
      err = 'User already subscribed';
      throw new Error();
    }
    const [
      result, { invoice_settings: { default_payment_method: defaultPaymentId } }
    ] = await Promise.all([
      bcrypt.compare(password, user.password),
      stripe.customers.retrieve(user.stripeCusId),
    ]);

    if (!result) {
      err = 'Incorrect password';
      throw new Error();
    }

    const productTotalQuantity = quantity + count;
    const subscription = {
      customer: user.stripeCusId,
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

    if (count === 0 && quantity === 1) {
      // this is the first subscription on this plan
      // and subscribed quant doesn't require price adjustment
      const [{ id: subscriptionId, items }, _] = await Promise.all([
        stripe.subscriptions.create(subscription),
        stripe.setupIntents.update(setupIntentId, {
          metadata: {
            paymentMethod: {
              brand,
              expiryMonth,
              expiryYear,
              last4,
              id: paymentMethodId,
              default: paymentMethodId === defaultPaymentId
            }
          }
        }),
      ]);
      const { id: subscriptionItemId } = items.data[0];
      await startSubsNoPriceUpdate(planId, quantity, subscriptionId, subscriptionItemId, username);

      return true;
    }

    // not first subscription, or quant > 1 --> require price adjustment
    const [{ id: newPriceId }] = await Promise.all([
      stripe.prices.create({
        currency: 'usd',
        product: planId,
        unit_amount: Math.round((Math.ceil(perCycleCost / productTotalQuantity)) * 1.05),
        recurring: { interval: cycleFrequency },
      }),
      stripe.prices.update(prevPriceId, { active: false }),
      stripe.setupIntents.update(setupIntentId, {
        metadata: {
          paymentMethod: {
            brand,
            expiryMonth,
            expiryYear,
            last4,
            id: paymentMethodId,
            default: paymentMethodId === defaultPaymentId
          }
        }
      }),
    ]);
    // replace old price Id with new Id
    subscription.items[0].price = newPriceId;


    const createNewSubsAndUpdateDb = async () => {
      const { id: subscriptionId, items } = await stripe.subscriptions.create(subscription);
      const { id: subscriptionItemId } = items.data[0];
      await startSubsPriceUpdateUsingUsername(
        planId,
        quantity,
        subscriptionId,
        subscriptionItemId,
        username,
        newPriceId,
      );
      return true;
    };

    if (count === 0) {
      // no existing members yet
      await createNewSubsAndUpdateDb();
    } else {
      // there are other members --> also have to update their subscription
      await Promise.all([
        createNewSubsAndUpdateDb(),
        ...members.map((member) => updateStripePrice(member, newPriceId)),
      ]);
    }
    return true;
  } catch (e) {
    if (err) {
      throw new GraphQLError(err, { extensions: { code: 'FORBIDDEN' } });
    }
    console.log(e);
    throw new GraphQLError('Unable to start subscription', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
