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

  return (
    <Routes>
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <Signup setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/dashboard" />} />
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
      <Route path="/cards" element={<Cards />} />
      <Route path="/checkout" element={<Checkout stripeClientSecret={stripeClientSecret} />} />
      <Route path="/plan/all" element={<ViewPlans />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/404" element={<FourOhFour />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  );
}

export default App;
