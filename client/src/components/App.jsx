import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import Dashboard from './Dashboard.jsx';
import CreatePlan from './CreatePlan.jsx';
import JoinPlan from './JoinPlan.jsx';
import Cards from './Cards.jsx';
import Checkout from './Checkout.jsx';
import ViewPlans from './ViewPlans.jsx';
import MagicLink from './MagicLink.jsx';
import FourOhFour from './404.jsx';
import PaymentSuccess from './PaymentSuccess.jsx';

function App() {
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [planToJoin, setPlanToJoin] = useState(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(localStorage.getItem('clientSecret'));
  /*
  Note from Stripe API: The client secret can be used to complete a payment from your frontend.
  It should not be stored, logged, or exposed to anyone other than the customer.
  Make sure that you have TLS enabled on any page that includes the client secret.

  --> If customer does not go through with payment in one sitting, perhaps we should let this client
  secret expire and when they come back, we'll make them go through the checkout process over again
  which will create a new subscription with new subscription id and give them a new client secret.
  Is it safe to store this client secret in local storage??
  */

  /*
  More TO-DO: Check expiration date for token and automatically sign user out once token has expired
  */

  return (
    <Routes>
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/" />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard username={user} setUser={setUser} setPlanToJoin={setPlanToJoin} /> : <Navigate to="/" />}
      />
      <Route
        path="/plan/create"
        element={
          !showMagicLink
            ? <CreatePlan setPlanToJoin={setPlanToJoin} setShowMagicLink={setShowMagicLink} />
            : <MagicLink planToJoin={planToJoin} setShowMagicLink={setShowMagicLink} />
          }
      />
      <Route
        path="/join/:planId"
        element={
          !user
            ? <Home setPlanToJoin={setPlanToJoin} />
            : (
              <JoinPlan
                setPlanToJoin={setPlanToJoin}
                setStripeClientSecret={setStripeClientSecret}
              />
            )
          }
      />
      <Route path="/cards" element={user ? <Cards /> : <Navigate to="/" />} />
      <Route path="/checkout" element={user ? <Checkout stripeClientSecret={stripeClientSecret} /> : <Navigate to="/" />} />
      <Route path="/plan/all" element={user ? <ViewPlans /> : <Navigate to="/" />} />
      <Route path="/payment-success" element={user ? <PaymentSuccess /> : <Navigate to="/" />} />
      <Route path="/404" element={<FourOhFour />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  );
}

export default App;
