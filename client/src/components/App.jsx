import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
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

// check that token is still valid before displaying logged-in state
let token = localStorage.getItem('token');
let email;
let username;
if (token) {
  const { exp, user } = jwtDecode(token);
  ({ email, username } = user);
  const today = new Date();
  if (today.valueOf() > (exp * 1000)) {
    localStorage.clear();
    token = null;
  }
}

// retrieve refreshToken from cookie
async function getCookie() {
  const cookie = await browser.cookies.get({
    url: 'localhost:5647',
    name: 'refreshToken',
  });
  if (cookie) {
    console.log(cookie);
  }
}

function App() {
  const [user, setUser] = useState(token ? username : null);
  const [planToJoin, setPlanToJoin] = useState(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [subscriptionInTransaction, setSubscriptionInTransaction] = useState(null);

  return (
    <Routes>
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <Signup setUser={setUser} planToJoin={planToJoin} /> : <Navigate to="/dashboard" />} />
      {/* <Route
        path="/dashboard"
        element={user ? <Dashboard username={user} setUser={setUser} setPlanToJoin={setPlanToJoin} /> : <Navigate to="/" />}
      /> */}
      <Route
        path="/dashboard"
        element={<Dashboard username={user} setUser={setUser} setPlanToJoin={setPlanToJoin} />}
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
                setSubscriptionInTransaction={setSubscriptionInTransaction}
              />
            )
          }
      />
      <Route path="/cards" element={user ? <Cards /> : <Navigate to="/" />} />
      <Route
        path="/checkout"
        element={user
          ? (
            <Checkout
              stripeClientSecret={stripeClientSecret}
              subscriptionInTransaction={subscriptionInTransaction}
              email={email}
            />
          )
          : <Navigate to="/" />}
      />
      <Route path="/plan/all" element={user ? <ViewPlans user={user} /> : <Navigate to="/" />} />
      <Route path="/404" element={<FourOhFour />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  );
}

export default App;
