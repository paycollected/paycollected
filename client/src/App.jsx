import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import Home from './components/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './components/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreatePlan from './components/CreatePlan.jsx';
import JoinPlan from './components/JoinPlan.jsx';
import Cards from './components/Cards.jsx';
import Checkout from './components/Checkout.jsx';
import ViewPlans from './components/ViewPlans.jsx';
import MagicLink from './components/MagicLink.jsx';
import FourOhFour from './pages/404.jsx';
import NavBar from './components/NavBar.jsx';
import PwdReset from './pages/PwdReset.jsx';
import ManageAccount from './pages/ManageAccount.jsx';

// check that token is still valid before displaying logged-in state
let token = localStorage.getItem('token');
let username;
if (token) {
  const { exp, user } = jwtDecode(token);
  ({ username } = user);
  const today = new Date();
  if (today.valueOf() > (exp * 1000)) {
    localStorage.clear();
    token = null;
  }
}

function App() {
  const [user, setUser] = useState(token ? username : null);
  const [planToJoin, setPlanToJoin] = useState(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [setupIntentId, setSetupIntentId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  return (
    <div>
      <NavBar user={user} setUser={setUser} setPlanToJoin={setPlanToJoin} />
      <Routes>
        <Route path="/" element={!user ? <Home setPlanToJoin={setPlanToJoin} /> : <Navigate to="/dashboard" />} />
        <Route
          path="/login"
          element={!user
            ? <Login setUser={setUser} planToJoin={planToJoin} />
            : <Navigate to="/dashboard" />}
        />
        <Route
          path="/signup"
          element={!user
            ? <Signup setUser={setUser} />
            : <Navigate to="/dashboard" />}
        />
        <Route path="/dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        <Route
          path="/plan/create"
          element={user
            ?
            (!showMagicLink
              ? <CreatePlan setPlanToJoin={setPlanToJoin} setShowMagicLink={setShowMagicLink} />
              : <MagicLink planToJoin={planToJoin} setShowMagicLink={setShowMagicLink} />
            )
            : <Navigate to="/" />
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
                  setSetupIntentId={setSetupIntentId}
                  setPaymentMethods={setPaymentMethods}
                />
              )
            }
        />
        <Route path="/cards" element={user ? <Cards /> : <Navigate to="/" />} />
        <Route
          path="/checkout"
          element={user && stripeClientSecret
            ? (
              <Checkout
                planId={planToJoin}
                stripeClientSecret={stripeClientSecret}
                setupIntentId={setupIntentId}
                setStripeClientSecret={setStripeClientSecret}
                setSetupIntentId={setSetupIntentId}
                paymentMethods={paymentMethods}
              />
            )
            : <Navigate to="/" />}
        />
        <Route path="/plan/all" element={user ? <ViewPlans user={user} /> : <Navigate to="/" />} />
        <Route path="manage-account" element={user ? <ManageAccount user={user} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/password-reset" element={<PwdReset setUser={setUser} />} />
        <Route path="/404" element={<FourOhFour />} />
        <Route path="*" element={<FourOhFour />} />
      </Routes>
    </div>
  );
}

export default App;
