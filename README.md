<a name="readme-top"></a>
# PayCollected
![PayCollected Logo](client/src/public/Pay_Collected_Logo.png)

[Intro](https://github.com/paycollected/paycollected#intro) | [Screenshots](https://github.com/paycollected/paycollected#screenshots) | [Stripe](https://github.com/paycollected/paycollected#payment-processing-platform-stripe) | [Technologies Used](https://github.com/paycollected/paycollected#technologies-used) | [Current Status](https://github.com/paycollected/paycollected#current-status) | [Current Features](https://github.com/paycollected/paycollected#current-features) | [Missing Features](https://github.com/paycollected/paycollected#missing-features) | [For Developers](https://github.com/paycollected/paycollected#for-developers) | [Contributors](https://github.com/paycollected/paycollected#contributors)

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)![Chakra](https://img.shields.io/badge/chakra-%234ED1C5.svg?style=for-the-badge&logo=chakraui&logoColor=white)![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)![Apollo-GraphQL](https://img.shields.io/badge/-ApolloGraphQL-311C87?style=for-the-badge&logo=apollo-graphql)![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

## Intro
PayCollected is a web application that makes it easier for groups to share and split up recurring payments. Any user can create a new plan, in effect becoming the "owner" of the plan. Once other users have joined a plan, they become "members" of that plan.

At plan creation, the plan owner will decide in advance how much the plan will cost in total at each billing cycle, as well as the frequency at which everyone will be charged and the first charge date of the plan. This cost is then divided equally by the total number of subscriptions to the plan. On the charge date of each billing cycle, every subscribed member will be charged at 11:59 PM EST.

Example of cost calculation:<br>
Disney+ plan is $120.00 billed monthly.
- Mai-Ly has 1 subscription of this plan.
- Jessica has 2 subscriptions (she is paying for two people).
- Binh has 1 subscription.<br>

Based on this, each individual subscription will cost $120.00 / (4 subscriptions) = $30.00.
Thus, Mai-Ly and Binh will each pay $30.00 (+ $1.05 platform fees) at each billing cycle.
Jessica will pay a total of $60.00 (2 subscriptions * $30.00/subscription) plus $3.00 platform fees.
Platform fees are calculated at 5% of the base cost.

If a new member joins a plan in between two billing cycles, the new per-subscription cost will take effect on the next charge date.

Once the first charge has occurred, the platform will provide the plan owner with a virtual credit card for the owner to finance the actual cost of the group. In the example above, the plan owner will use this virtual credit card to pay for the group Disney+ subscription.

With this application, users can set up their recurring group payment just once and forget about it!

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Screenshots
<details> 
  <summary> Create account and log in </summary>
  <img src="https://i.imgur.com/ubR8DQ0.jpg" alt="create-account-screenshot" width="75%">
  <img src="https://i.imgur.com/2uZycug.jpg" alt="password-recovery" width="75%">
  <img src="https://i.imgur.com/fPNIbFA.jpg" alt="password-recovery-2" width="75%">
</details>
<details>
  <summary>Dashboard</summary>
  <img src="https://i.imgur.com/OZVGeHd.jpg" alt="dashboard-with-notifications" width="75%">
  <img src="https://i.imgur.com/p0qYV0F.jpg" alt="dashboard-with-expanded-menu" width="75%">
  <img src="https://i.imgur.com/egTdGCZ.jpg" alt="dashboard-tabs" width="75%">
</details>
<details>
  <summary>Create a New Plan</summary>
  <img src="https://i.imgur.com/bQqO58H.jpg" alt="create-plan" width="75%">
  <img src="https://i.imgur.com/B92sbE7.jpg" alt="successful-plan-creation" width="75%">
</details>
<details>
  <summary>Plan Details</summary>
  <img src="https://i.imgur.com/pnouOlh.jpg" alt="plan-details-edit-owner-1" width="75%">
  <img src="https://i.imgur.com/4NHCNGP.jpg" alt="plan-details-edit-owner-2" width="75%">
</details>
<details>
  <summary>Share a Plan</summary>
  <img src="https://i.imgur.com/2cKa671.jpg" alt="share-a-plan" width="75%">
</details>
<details>
  <summary>Join a Plan</summary>
  <img src="https://i.imgur.com/kure3Gt.jpg" alt="join-plan-1" width="75%">
  <img src="https://i.imgur.com/HoG3XkQ.jpg" alt="join-plan-2" width="75%">
</details>
<details>
  <summary>Checkout</summary>
  <img src="https://i.imgur.com/7THqKJy.jpg" alt="checkout-saved-card" width="75%">
  <img src="https://i.imgur.com/LgmUJBH.jpg" alt="checkout-new-card" width="75%">
  <img src="https://i.imgur.com/jf1b4Kz.jpg" alt="successful-checkout" width="75%">
  <img src="https://i.imgur.com/39aJxkf.jpg" alt="successful-checkout-dashboard" width="75%">
</details>
<details>
  <summary>Stripe Customer Portal (Prebuilt)</summary>
  <img src="https://i.imgur.com/htqHsiM.jpg" alt="stripe-portal-1" width="75%">
  <img src="https://i.imgur.com/iMPFb3z.jpg" alt="stripe-portal-2" width="75%">
</details>

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Payment Processing Platform: Stripe
For this application, we used the following Stripe financial products:
- [Billing](https://stripe.com/billing) (to charge)
- [Issuing](https://stripe.com/issuing) (to fund, planned)

On the frontend, payment is handled via Stripe.js according to their recommended protocol to ensure PCI-compliance. The payment life cycle is completed on the backend with the use of webhooks.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Technologies Used
- Frontend: [React.js](https://reactjs.org/), [Apollo Client](https://www.apollographql.com/apollo-client/), [React Hook Form](https://react-hook-form.com/), and [ChakraUI](https://chakra-ui.com/) for styling
- Backend: [Node.js](https://nodejs.org/en/), [Express](https://expressjs.com/) and [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (our API is GraphQL-based)
- Datastore: [PostgreSQL](https://www.postgresql.org/) and [Node-Postgres](https://node-postgres.com/) as the client
- Email client: [Twilio Sendgrid](https://docs.sendgrid.com/for-developers)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Current Status
Please note that due to our inability to access Stripe's Issuing API, we are missing a key component of this application, which is funding groups via virtual credit cards.

Even without this element, we have attempted to incorporate as many features as we would like to see in this application under the assumption that we would use it ourselves. We may occassionally add some minor features, bug fixes, or tests in the future, but at this point (January 2023) the project is no longer actively worked on.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Current Features
- Basic authentication and JWT for stateless "session" management
- Email verification, password recovery (forgotten password)
- Account management: Update username, password, or email
- Dashboard with the ability to filter plans by status and ownership, and to order by plan's name / next charge date / user's cost
- (Existing plan members) Sharing and (Potential plan members) Joining a new plan using either a plan code or a link
- (Plan owners) Plan creation, deletion, or transfer of plan ownership to someone else
- (Plan members) Cancellation of subscription to a plan, or changing the number of subscriptions to it
- Access to Stripe customer portal for payment method management
- Notifications when there are new activity on a subscribed plan

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Missing Features
Some additional features (beyond access to Stripe Issuing) that we would love to see but were not able to incorporate in this release due to time constraints are:
- Implementation of a JWT token blacklisting system using an in-memory datastore so that user sessions are a hybrid of both stateful and stateless.
- Automatic extension of JWT expiration to 3 days if there is continuous activity in the allotted 30 minutes
- Better mobile responsiveness
- Loading state and error UI feedback
- Handling of payment failure frontend (at checkout) and backend (webhook)
- (Plan owners) Editability of plan's name and plan's total cost
- Access to inactive (archived) plans/subscriptions
- Access to platform invoice with detailed data of charge date, charge breakdown (base cost, platform fees, total), members' breakdown of number of subscriptions & cost at each past billing cycle

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## For Developers
If you are in the finance sector and/or are a developer interested in checking out this application or further contributing to it, you will need a Stripe and a Twilio Sendgrid developer account. Please refer to their respective websites for account and project setup instructions.

To test Stripe webhooks in the local environment, you will also need to install and use the [Stripe CLI](https://stripe.com/docs/stripe-cli/overview).

In the root folder of this project, create a .env file with the following environmental variables, filling in appropriate data (note that `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` should be for test mode):
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>
## Contributors
<table>
  <tr>
    <th>Chan Le</th>
    <th>Binh Nguyen</th>
    <th>Jessica Chen</th>
    <th>Mai-Ly</th>
  </tr>
  <tr>
    <td>Project Manager</td>
    <td>Developer</td>
    <td>Developer</td>
    <td>UX Designer</td>
  </tr>
  <tr>
    <td/>
    <td>
      <a href="https://github.com/kbinhnguyen">
        <img src="https://img.shields.io/badge/github%20-%23121011.svg?&style=for-the-badge&logo=github&logoColor=white"/>
      </a>
    </td>
    </td>
    <td>
      <a href="https://github.com/codingavatar">
        <img src="https://img.shields.io/badge/github%20-%23121011.svg?&style=for-the-badge&logo=github&logoColor=white"/>
      </a>
    </td>
    <td/>
  </tr>
  <tr>
    <td>
    <td>
    </td>
    </td>
    <td>
      <a href="https://www.linkedin.com/in/jessica-chen-md/">
        <img src="https://img.shields.io/badge/linkedin%20-%230077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white"/>
      </a>
    </td>
    <td>
      <a href="https://www.linkedin.com/in/mai-lywinn/">
        <img src="https://img.shields.io/badge/linkedin%20-%230077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white"/>
      </a>
    </td>
  </tr>
</table>
