import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import Dashboard from './Dashboard.jsx';
import CreateSubscription from './CreateSubscription.jsx';
import JoinSubscription from './JoinSubscription.jsx';
import Cards from './Cards.jsx';
import Checkout from './Checkout.jsx';
import ViewSubscriptions from './ViewSubscriptions.jsx';

function App() {
  const [user, setUser] = useState(localStorage.getItem('username'));

  return (
    <Routes>
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <Signup setUser={setUser} /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={!user ? <Navigate to="/home" /> : <Dashboard username={user} setUser={setUser} />} />
      <Route path="/subscription/create" element={<CreateSubscription />} />
      <Route path="/subscription/:productID" element={<JoinSubscription />} />
      <Route path="/cards" element={<Cards />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/subscription/all" element={<ViewSubscriptions />} />
    </Routes>
  );
}

export default App;
