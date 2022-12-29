import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import Home from './pages/home/Home.jsx';
import Login from './pages/login/Login.jsx';
import CreateAccount from './pages/createAccount/CreateAccount.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import JoinPlan from './pages/joinPlan/JoinPlan.jsx';
import Checkout from './pages/checkout/Checkout.jsx';
import FourOhFour from './pages/404.jsx';
import PwdReset from './pages/PwdReset.jsx';
import ManageAccount from './pages/manageAccount/ManageAccount.jsx';
import PlanDetails from './pages/planDetails/PlanDetails.jsx';

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
  const [planToView, setPlanToView] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [setupIntentId, setSetupIntentId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  return (
    <Routes>
      <Route path="/" element={<Home user={user} setUser={setUser} setPlanToJoin={setPlanToJoin} setPlanToView={setPlanToView} />} />
      <Route
        path="/login"
        element={!user
          ? <Login setUser={setUser} planToJoin={planToJoin} />
          : <Navigate to="/dashboard" />}
      />
      <Route
        path="/create-account"
        element={!user
          ? <CreateAccount setUser={setUser} />
          : <Navigate to="/dashboard" />}
      />
      <Route
        path="/dashboard"
        element={(
          <Dashboard
            user={user}
            setUser={setUser}
            setPlanToJoin={setPlanToJoin}
            setPlanToView={setPlanToView}
          />
        )}
      />
      <Route
        path="/join/:planId"
        element={
          !user
            ? (
              <Home
                user={user}
                setUser={setUser}
                setPlanToJoin={setPlanToJoin}
                setPlanToView={setPlanToView}
              />
            )
            : (
              <JoinPlan
                setPlanToJoin={setPlanToJoin}
                setStripeClientSecret={setStripeClientSecret}
                setSetupIntentId={setSetupIntentId}
                setPaymentMethods={setPaymentMethods}
                user={user}
                setUser={setUser}
                setPlanToView={setPlanToView}
              />
            )
          }
      />
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
      {user && (
        <>
          <Route
            path="/view"
            element={
              planToView
                ? (
                  <PlanDetails
                    user={user}
                    setUser={setUser}
                    planToView={planToView}
                    setPlanToView={setPlanToView}
                    setPlanToJoin={setPlanToJoin}
                    edit={false}
                  />
                )
                : <Navigate to="/dashboard" />
              }
          />
          <Route
            path="/edit"
            element={
              planToView
                ? (
                  <PlanDetails
                    user={user}
                    setUser={setUser}
                    planToView={planToView}
                    setPlanToView={setPlanToView}
                    setPlanToJoin={setPlanToJoin}
                    edit
                  />
                )
                : <Navigate to="/dashboard" />
              }
          />
        </>
      )}
      {!user && (
        <>
          <Route path="/view" element={<Navigate to="/404" />} />
          <Route path="/edit" element={<Navigate to="/404" />} />
        </>
      )}
      <Route
        path="/manage-account"
        element={
        user
          ? (
            <ManageAccount
              user={user}
              setUser={setUser}
              setPlanToJoin={setPlanToJoin}
              setPlanToView={setPlanToView}
            />
          ) : (<Navigate to="/" />)
        }
      />
      <Route path="/password-reset" element={<PwdReset setUser={setUser} />} />
      <Route path="/404" element={<FourOhFour />} />
      <Route path="*" element={<FourOhFour />} />
    </Routes>
  );
}

export default App;
