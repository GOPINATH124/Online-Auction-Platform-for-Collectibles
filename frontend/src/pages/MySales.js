import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../componets/ToastContainer";
import { BASE_URL } from "../config/apiConfig";
import "./MySales.css";

function MySales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, sold, pending, active
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSales();
  }, [token, navigate]);

  const fetchSales = async () => {
    try {
      const [auctionsRes, usersRes] = await Promise.all([
        axios.get(`${BASE_URL}/auctions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] }))
      ]);

      // Filter auctions created by this seller
      const myAuctions = auctionsRes.data.filter(
        (auction) => auction.seller === userId || auction.seller?._id === userId
      );

      // Create a map of users for quick lookup
      const usersMap = {};
      if (usersRes.data) {
        usersRes.data.forEach(user => {
          usersMap[user._id] = user;
        });
      }

      // Enhance auctions with winner information
      const enhancedAuctions = myAuctions.map(auction => ({
        ...auction,
        winnerInfo: auction.winner ? usersMap[auction.winner] : null
      }));

      setSales(enhancedAuctions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
      setLoading(false);
    }
  };

  const getFilteredSales = () => {
    const now = new Date();
    switch (filter) {
      case "active":
        return sales.filter((s) => new Date(s.endTime) > now);
      case "sold":
        return sales.filter((s) => new Date(s.endTime) <= now && s.isPaid);
      case "pending":
        return sales.filter((s) => new Date(s.endTime) <= now && !s.isPaid && s.winner);
      default:
        return sales;
    }
  };

  const calculateTotalRevenue = () => {
    return sales
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + s.currentBid, 0);
  };

  const calculatePendingRevenue = () => {
    return sales
      .filter((s) => new Date(s.endTime) <= new Date() && !s.isPaid && s.winner)
      .reduce((sum, s) => sum + s.currentBid, 0);
  };

  if (loading) {
    return (
      <div className="sales-loading">
        <div className="loading-spinner"></div>
        <p>Loading your sales...</p>
      </div>
    );
  }

  const filteredSales = getFilteredSales();
  const totalRevenue = calculateTotalRevenue();
  const pendingRevenue = calculatePendingRevenue();
  const activeSales = sales.filter(s => new Date(s.endTime) > new Date()).length;
  const completedSales = sales.filter(s => s.isPaid).length;

  return (
    <div className="sales-wrapper">
      <div className="sales-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="sales-container">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        <div className="sales-header">
          <div className="header-icon">💼</div>
          <h1 className="sales-title">My Sales</h1>
          <p className="sales-subtitle">
            Track your auctions, winners, and revenue
          </p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#667eea' }}>
              📦
            </div>
            <div className="summary-content">
              <div className="summary-label">Active Auctions</div>
              <div className="summary-value">{activeSales}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#43e97b' }}>
              💰
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value">${totalRevenue}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#f093fb' }}>
              ⏳
            </div>
            <div className="summary-content">
              <div className="summary-label">Pending Payment</div>
              <div className="summary-value">${pendingRevenue}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#4facfe' }}>
              ✅
            </div>
            <div className="summary-content">
              <div className="summary-label">Completed Sales</div>
              <div className="summary-value">{completedSales}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Auctions
            <span className="tab-count">{sales.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
            <span className="tab-count">{activeSales}</span>
          </button>
          <button
            className={`filter-tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Awaiting Payment
            <span className="tab-count">
              {sales.filter(s => new Date(s.endTime) <= new Date() && !s.isPaid && s.winner).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === "sold" ? "active" : ""}`}
            onClick={() => setFilter("sold")}
          >
            Sold & Paid
            <span className="tab-count">{completedSales}</span>
          </button>
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No auctions found</h3>
            <p>
              {filter === "all"
                ? "Create your first auction to start selling!"
                : `No ${filter} auctions at the moment`}
            </p>
            <button
              className="browse-btn"
              onClick={() => navigate("/create-auction")}
            >
              Create Auction
            </button>
          </div>
        ) : (
          <div className="sales-list">
            {filteredSales.map((sale, index) => {
              const isActive = new Date(sale.endTime) > new Date();
              const hasEnded = !isActive;
              const hasBids = sale.bids.length > 0;

              return (
                <div
                  key={sale._id}
                  className={`sale-card ${sale.isPaid ? "paid" : hasEnded ? "ended" : "active"}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="sale-header">
                    <div className="sale-status">
                      {isActive && (
                        <span className="status-badge active">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          Active
                        </span>
                      )}
                      {hasEnded && sale.isPaid && (
                        <span className="status-badge paid">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          Sold & Paid
                        </span>
                      )}
                      {hasEnded && !sale.isPaid && sale.winner && (
                        <span className="status-badge pending">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          </svg>
                          Awaiting Payment
                        </span>
                      )}
                      {hasEnded && !sale.winner && (
                        <span className="status-badge ended">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                          </svg>
                          No Winner
                        </span>
                      )}
                    </div>
                    <div className="sale-date">
                      Listed: {new Date(sale.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="sale-body">
                    <h3 className="product-name">{sale.title}</h3>
                    <p className="product-description">{sale.description}</p>

                    {/* Winner Info */}
                    {sale.winner && (
                      <div className="winner-section">
                        <div className="winner-header">
                          <span className="winner-icon">🏆</span>
                          <h4>Winner Information</h4>
                        </div>
                        <div className="winner-details">
                          <div className="winner-info-row">
                            <span className="info-icon">👤</span>
                            <div className="info-content">
                              <span className="info-label">Winner Name:</span>
                              <span className="info-value">
                                {sale.winnerInfo ? sale.winnerInfo.name : "Loading..."}
                              </span>
                            </div>
                          </div>
                          <div className="winner-info-row">
                            <span className="info-icon">📧</span>
                            <div className="info-content">
                              <span className="info-label">Email:</span>
                              <span className="info-value">
                                {sale.winnerInfo ? sale.winnerInfo.email : "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="winner-info-row">
                            <span className="info-icon">💰</span>
                            <div className="info-content">
                              <span className="info-label">Winning Bid:</span>
                              <span className="info-value price">${sale.currentBid}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="sale-details">
                      <div className="detail-row">
                        <span className="detail-label">Product:</span>
                        <span className="detail-value">{sale.title}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Starting Price:</span>
                        <span className="detail-value">${sale.startingPrice}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Current Bid:</span>
                        <span className="detail-value price">${sale.currentBid}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Bids:</span>
                        <span className="detail-value">{sale.bids.length}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">
                          {isActive ? "Ends At:" : "Ended At:"}
                        </span>
                        <span className="detail-value">
                          {new Date(sale.endTime).toLocaleString()}
                        </span>
                      </div>
                      {hasEnded && (
                        <div className="detail-row highlight">
                          <span className="detail-label">Payment Status:</span>
                          <span className={`detail-value ${sale.isPaid ? "paid-status" : "pending-status"}`}>
                            {sale.isPaid ? "✅ Received" : "⏳ Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sale-footer">
                    {isActive && (
                      <div className="active-info">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                        <span>Auction in progress - {sale.bids.length} bids received</span>
                      </div>
                    )}
                    {hasEnded && sale.isPaid && (
                      <div className="paid-info">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span>Transaction completed - ${sale.currentBid} received!</span>
                      </div>
                    )}
                    {hasEnded && !sale.isPaid && sale.winner && (
                      <div className="pending-payment-info">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <span>Waiting for buyer to complete payment of ${sale.currentBid}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MySales;
