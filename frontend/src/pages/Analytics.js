import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from '../config/apiConfig';
import './Analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSeller = localStorage.getItem("isSeller") === "true";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auctions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuctions(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getTotalAuctions = () => auctions.length;
  const getActiveAuctions = () => auctions.filter(a => new Date(a.endTime) > new Date()).length;
  const getEndedAuctions = () => auctions.filter(a => new Date(a.endTime) <= new Date()).length;
  const getTotalBids = () => auctions.reduce((sum, a) => sum + (a.bids?.length || 0), 0);
  const getTotalRevenue = () => auctions.reduce((sum, a) => sum + (a.currentBid || 0), 0);
  const getAverageBid = () => {
    const total = getTotalRevenue();
    const count = getTotalAuctions();
    return count > 0 ? (total / count).toFixed(2) : 0;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="access-denied-wrapper">
        <div className="access-denied-card">
          <div className="denied-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>Analytics are only available for seller accounts.</p>
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-wrapper">
      <div className="analytics-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="analytics-container">
        <div className="analytics-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back
          </button>
          
          <div className="header-content">
            <div className="header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <h1 className="analytics-title">Analytics Dashboard</h1>
            <p className="analytics-subtitle">Track your auction performance and insights</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="stats-section">
          <h2 className="section-title">Overview</h2>
          <div className="stats-grid">
            <div className="stat-card" style={{'--card-color': '#667eea'}}>
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-value">{getTotalAuctions()}</div>
                <div className="stat-label">Total Auctions</div>
              </div>
              <div className="stat-chart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{'--card-color': '#43e97b'}}>
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{getActiveAuctions()}</div>
                <div className="stat-label">Active Auctions</div>
              </div>
              <div className="stat-chart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{'--card-color': '#f093fb'}}>
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{getTotalBids()}</div>
                <div className="stat-label">Total Bids</div>
              </div>
              <div className="stat-chart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{'--card-color': '#4facfe'}}>
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-value">${getTotalRevenue()}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-chart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="metrics-section">
          <h2 className="section-title">Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <h3>Average Bid Value</h3>
                <span className="metric-badge positive">+12%</span>
              </div>
              <div className="metric-value">${getAverageBid()}</div>
              <div className="metric-footer">
                <span>Per auction</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Success Rate</h3>
                <span className="metric-badge positive">+8%</span>
              </div>
              <div className="metric-value">
                {getTotalAuctions() > 0 ? Math.round((getEndedAuctions() / getTotalAuctions()) * 100) : 0}%
              </div>
              <div className="metric-footer">
                <span>Completed auctions</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <h3>Avg Bids per Auction</h3>
                <span className="metric-badge neutral">~</span>
              </div>
              <div className="metric-value">
                {getTotalAuctions() > 0 ? (getTotalBids() / getTotalAuctions()).toFixed(1) : 0}
              </div>
              <div className="metric-footer">
                <span>Engagement rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Auctions */}
        <div className="recent-section">
          <h2 className="section-title">Recent Auctions</h2>
          {auctions.length > 0 ? (
            <div className="recent-list">
              {auctions
                .sort((a, b) => new Date(b.createdAt || b.endTime) - new Date(a.createdAt || a.endTime))
                .slice(0, 5)
                .map((auction) => (
                  <div key={auction._id} className="recent-item">
                    <div className="recent-icon">📦</div>
                    <div className="recent-info">
                      <h4>{auction.title}</h4>
                      <p>{auction.bids?.length || 0} bids • ${auction.currentBid}</p>
                    </div>
                    <div className="recent-status">
                      {new Date(auction.endTime) > new Date() ? (
                        <span className="status active">Active</span>
                      ) : (
                        <span className="status ended">Ended</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="recent-list">
              <div className="no-data">
                <p>No auctions found. Create your first auction to see analytics!</p>
                <button className="create-btn" onClick={() => navigate("/create-auction")}>
                  Create Auction
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;

