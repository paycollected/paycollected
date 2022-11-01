import stripeSDK from 'stripe';
import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { subscriptionSetupSavedCard, startSubsNoPriceUpdateReturningPlan, startSubsPriceUpdateReturningPlan } from '../../db/models.js';
import { updateStripePrice } from '../../utils/helperFn.js';

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
      { customer: paymentMethodCustomer },
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
    const result = await bcrypt.compare(password, user.password);
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
        stripe.setupIntents.cancel(setupIntentId),
      ]);
      const { id: subscriptionItemId } = items.data[0];
      const { rows: resultRows } = await startSubsNoPriceUpdateReturningPlan(
        planId,
        quantity,
        subscriptionId,
        subscriptionItemId,
        username,
      );

      return resultRows[0];
    }

    // not first subscription, or quant > 1 --> require price adjustment
    const [{ id: newPriceId }] = await Promise.all([
      stripe.prices.create({
        currency: 'usd',
        product: planId,
        unit_amount: Math.ceil(perCycleCost / productTotalQuantity),
        recurring: { interval: cycleFrequency },
      }),
      stripe.prices.update(prevPriceId, { active: false }),
      stripe.setupIntents.cancel(setupIntentId),
    ]);
    // replace old price Id with new Id
    subscription.items[0].price = newPriceId;


    const createNewSubsAndUpdateDb = async () => {
      const { id: subscriptionId, items } = await stripe.subscriptions.create(subscription);
      const { id: subscriptionItemId } = items.data[0];
      const { rows: newRows } = await startSubsPriceUpdateReturningPlan(
        planId,
        quantity,
        subscriptionId,
        subscriptionItemId,
        username,
        newPriceId,
      );
      return newRows[0];
    };

    let plan;

    if (count === 0) {
      // no existing members yet
      plan = await createNewSubsAndUpdateDb();
    } else {
      // there are other members --> also have to update their subscription
      [plan] = await Promise.all([
        createNewSubsAndUpdateDb(),
        ...members.map((member) => updateStripePrice(member, newPriceId)),
      ]);
    }
    return plan;
  } catch (e) {
    if (err) {
      throw new GraphQLError(err, { extensions: { code: 'FORBIDDEN' } });
    }
    console.log(e);
    throw new GraphQLError('Unable to start subscription', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }
}
