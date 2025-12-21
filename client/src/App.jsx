import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from "react-hot-toast";
import { AuthContext } from '../context/AuthContext';

// ✅ keep only this popup
import IncomingCallPopup from './components/IncomingCallPopup.jsx';

const App = () => {
  const { authUser } = useContext(AuthContext);

  return (
    <div className="bg-[url('/bg.png')] bg-contain bg-fixed h-screen w-full overflow-hidden flex flex-col">
      <Toaster position="top-center" />

      {/* ✅ Only incoming popup */}
      <IncomingCallPopup />

      <div className="flex-1 h-full overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
