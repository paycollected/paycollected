import React, { useState, useEffect } from 'react';
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
import CheckoutSuccess from './pages/checkoutSuccess/CheckOutSuccess.jsx';

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
  const [successPlan, setSuccessPlan] = useState(null);

  useEffect(() => {
    if (successPlan) setTimeout(() => setSuccessPlan(null), 10000);
  }, [successPlan]);

  return (
    <Routes>
      <Route
        path="/"
        element={
        (
          <Home
            user={user}
            setUser={setUser}
            setPlanToJoin={setPlanToJoin}
            setPlanToView={setPlanToView}
            setSuccessPlan={setSuccessPlan}
          />
        )
        }
      />
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
            successPlan={successPlan}
            setSuccessPlan={setSuccessPlan}
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
                setSuccessPlan={setSuccessPlan}
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
                setSuccessPlan={setSuccessPlan}
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
              user={user}
              setUser={setUser}
              setPlanToJoin={setPlanToJoin}
              setPlanToView={setPlanToView}
              setSuccessPlan={setSuccessPlan}
            />
          )
          : <Navigate to="/" />}
      />
      <Route
        path="/checkout-success"
        element={
          user
            ? (
              <CheckoutSuccess
                user={user}
                setUser={setUser}
                setPlanToJoin={setPlanToJoin}
                setPlanToView={setPlanToView}
                setStripeClientSecret={setStripeClientSecret}
                setSetupIntentId={setSetupIntentId}
                setSuccessPlan={setSuccessPlan}
              />
            )
            : <Navigate to="/" />
        }
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
                    setSuccessPlan={setSuccessPlan}
                    successPlan={successPlan}
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
                    setSuccessPlan={setSuccessPlan}
                    successPlan={successPlan}
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
              setSuccessPlan={setSuccessPlan}
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
