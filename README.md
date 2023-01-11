# PayCollected

## Intro
PayCollected is a web application aimed at reducing friction for groups to split up recurring payments. Any user can create a new plan, in effect becoming "owner" of the plan. Once other users have joined a plan, they become "members" of that plan.

At plan creation, the plan owner will decide in advance how much the plan will cost in total at each billing cycle, as well as the frequency at which everyone will be charged and the first charge date of the plan. This cost is then divided equally by the total number of subscriptions to the plan. On the charge date of each billing cycle, every subscribed member will be charged at 11:59 PM EST.

Example of cost calculation:<br>
Disney+ plan is $120.00 billed monthly.
- Mai-Ly has 1 subscription of this plan.
- Jessica has 2 subscriptions (she is paying for two people).
- Binh has 1 subscription.<br>

Then each individual subscription will cost $120.00 / (4 subscriptions) = $30.00.
Thus, Mai-Ly and Binh will each pay $30.00 (+ $1.05 platform fees) at each billing cycle.
Jessica will pay a total of $60.00 (2 subscriptions * $30.00/subscription) plus $3.00 platform fees.
Platform fees are calculated at 5% of the base cost.

If a new member joins a plan in between two billing cycles, the new per-subscription cost will take effect on the next charge date.

Once the first charge has occurred, the platform will provide the plan owner with information of a virtual credit card for them to finance the actual cost of the group. In the example above, the plan owner will use this virtual credit card to pay for the group Disney+ subscription.

With this application, users can set up their recurring group payment once and forget about it!

## Screenshots
#### Create account and log in
![Create account](https://i.imgur.com/ubR8DQ0.jpg)

![Log in](https://i.imgur.com/2uZycug.jpg)

![Password recovery](https://i.imgur.com/uyPW617.jpg)


#### Dashboard
![Dashboard with notifications](https://i.imgur.com/OZVGeHd.jpg)

![Dashboard with expanded menu options](https://i.imgur.com/p0qYV0F.jpg)

![Dashboard tabs](https://i.imgur.com/HoDZO6t.jpg)


#### Create a new plan
![Create a plan](https://i.imgur.com/bQqO58H.jpg)

![Successful plan creation](https://i.imgur.com/B92sbE7.jpg)


#### Plan details
![Plan details edit mode as owner 1](https://i.imgur.com/pnouOlh.jpg)

![Plan details edit mode as owner 2](https://i.imgur.com/4NHCNGP.jpg)


#### Share a plan
![Share plan](https://i.imgur.com/2cKa671.jpg)


#### Join a plan
![Join plan 1](https://i.imgur.com/kure3Gt.jpg)

![Join plan 2](https://i.imgur.com/HoG3XkQ.jpg)


#### Checkout
![Checkout saved card](https://i.imgur.com/7THqKJy.jpg)

![Checkout new card](https://i.imgur.com/LgmUJBH.jpg)

![Successful checkout](https://i.imgur.com/jf1b4Kz.jpg)

![Successful checkout dashboard](https://i.imgur.com/39aJxkf.jpg)


#### Stripe Customer Portal (Prebuilt)
![Portal 1](https://i.imgur.com/htqHsiM.jpg)

![Portal 2](https://i.imgur.com/iMPFb3z.jpg)


## Payment Processing Platform: Stripe
For this application, we used the following Stripe financial products:
- Billing (to charge)
- Issuing (to fund, planned)

On the frontend, payment is handled via Stripe.js according to their recommended protocol to ensure PCI-compliance. The payment life cycle is completed on the backend with the use of webhooks.

## Technologies Used
- Frontend: React.js, and ChakraUI for styling
- Backend: Node.js, Express and Apollo Server (our API is GraphQL-based)
- Datastore: PostgreSQL and Node-Postgres as the client
- Email client: Twilio Sendgrid

## Current Status
Please note that due to our inability to access Stripe's Issuing API, we are missing the second major component of this application, which is funding groups via virtual credit cards.

Even without this element, we have attempted to incorporate as many features as we would like see in this application as possible under the assumption that we would be its real users. We may occassionally add some minor features, bug fix or test in the future, but at this point (January 2023) the project is no longer actively worked on.

## Current Features
- Basic authentication and JWT for stateless "session" management
- Email verification, password recovery (forgotten password)
- Account management: Update username, password or email
- Dashboard with the ability to filter plans by status and ownership, and to order by plan's name / next charge date / user's cost
- (Existing plan members) Sharing and (Potential plan members) Joining a new plan using either a plan code or a link
- (Plan owners) Plan creation, deletion, or transfer of plan ownership to someone else
- (Plan members) Cancellation of subscription to a plan, or changing the number of subscriptions to it, access to Stripe customer portal for payment method management
- Notifications when there are new activity on a subscribed plan

## Missing Features
Some additional features (beyond access to Stripe Issuing) that we would love to see but were not able to incorporate in this release due to time constraints are:
- Implementation of a JWT token blacklisting system using an in-memory datastore so that user sessions are a hybrid of both stateful and stateless.
- Better mobile responsiveness
- Loading state and error UI feedback
- Handling of payment failure frontend (at checkout) and backend (webhook)
- (Plan owners) Editability of plan's name and plan's total cost
- Access to inactive (archived) plans/subscriptions
- Access to platform invoice with detailed breakdown of charge date, charge breakdown (base cost, platform fees, total), members' breakdown of number of subscriptions & cost at each past billing cycle

## For Developers
If you are in the finance sector and/or developer interested in checking out this application or further contributing to it, you will need a Stripe and a Twilio Sendgrid developer accounts. Please refer to their respective websites for account and project setup.

To test Stripe webhooks in the local environment, you will also need to install and use the [Stripe CLI](https://stripe.com/docs/stripe-cli/overview).

In the root folder of this project, create an .env file with the following environmental variables, filling in appropriate data (note that `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` should be for test mode):
```
PORT=5647
HOST="http://localhost:5647"
DB="paycollected"
SIGNIN_SECRET_KEY=
EMAIL_VERIFY_SECRET_KEY=
RESET_PWD_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_LIVE_PUBLISHABLE_KEY=
STRIPE_LIVE_SECRET_KEY=
STRIPE_WEBHOOK_ENDPOINT_SECRET=
SENDGRID_API_KEY=
```

To manually test the checkout process, you could use the test credit cards provided as part of [Stripe's documentation](https://stripe.com/docs/testing).

Please reach out if you are interested in collaborative opportunities with us or have any feedback/questions for us. We'd love to hear from you!

## Contributors
- Project Manager: Chan Le
- Developers
  - [Binh](https://github.com/kbinhnguyen) (kbinhnguyen@gmail.com)
  - [Jessica](https://www.linkedin.com/in/jessica-chen-md/)
- UX Designer: [Mai-Ly](https://www.linkedin.com/in/mai-lywinn/)
