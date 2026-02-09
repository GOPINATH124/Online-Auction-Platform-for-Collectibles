import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import Navbar from "./componets/Navbar";
import { ToastProvider } from "./componets/ToastContainer";
import { SocketProvider } from "./componets/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Styles
import './styles/theme.css';

// Pages
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateAuction from "./pages/CreateAuction";
import EditAuction from "./pages/EditAuction";
import PlaceBid from "./pages/PlaceBid";
import Auctions from "./pages/Auctions";
import Analytics from "./pages/Analytics";
import MyBids from "./pages/MyBids";
import Watchlist from "./pages/Watchlist";
import Payment from "./pages/Payment";
import MyPurchases from "./pages/MyPurchases";
import MySales from "./pages/MySales";
import Profile from "./pages/Profile";
import AuctionDetails from "./pages/AuctionDetails";
import SellerReviews from "./pages/SellerReviews";
import AdminDashboard from "./pages/AdminDashboard";
import BiddingStats from "./pages/BiddingStats";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Default route - redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-auction"
          element={
            <ProtectedRoute>
              <CreateAuction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-auction/:id"
          element={
            <ProtectedRoute>
              <EditAuction />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auctions"
          element={
            <ProtectedRoute>
              <Auctions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auction/:id"
          element={
            <ProtectedRoute>
              <AuctionDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/:sellerId/reviews"
          element={
            <ProtectedRoute>
              <SellerReviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bids"
          element={
            <ProtectedRoute>
              <MyBids />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bidding-stats"
          element={
            <ProtectedRoute>
              <BiddingStats />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bid/:id"
          element={
            <ProtectedRoute>
              <PlaceBid />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/:auctionId"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-purchases"
          element={
            <ProtectedRoute>
              <MyPurchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-sales"
          element={
            <ProtectedRoute>
              <MySales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </SocketProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
