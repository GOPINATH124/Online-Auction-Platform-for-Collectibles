import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../componets/ToastContainer";
import { BASE_URL } from "../config/apiConfig";
import "./Watchlist.css";

function Watchlist() {
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState("won"); // won, watchlist, completed
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Load watchlist from localStorage
    const savedWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlist(savedWatchlist);
    
    fetchAuctions();
  }, [token, navigate]);

  const fetchAuctions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auctions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuctions(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      setLoading(false);
    }
  };

  const getWonAuctions = () => {
    return auctions.filter((auction) => {
      if (new Date(auction.endTime) > new Date()) return false;
      const userBids = auction.bids.filter((bid) => bid.userId === userId || bid.bidder === userId);
      if (userBids.length === 0) return false;
      const userHighestBid = Math.max(...userBids.map((bid) => bid.amount));
      return userHighestBid === auction.currentBid;
    });
  };

  const getWatchlistAuctions = () => {
    return auctions.filter((auction) => watchlist.includes(auction._id));
  };

  const getCompletedAuctions = () => {
    return auctions.filter((auction) => new Date(auction.endTime) <= new Date());
  };

  const toggleWatchlist = (auctionId) => {
    let newWatchlist;
    if (watchlist.includes(auctionId)) {
      newWatchlist = watchlist.filter((id) => id !== auctionId);
    } else {
      newWatchlist = [...watchlist, auctionId];
    }
    setWatchlist(newWatchlist);
    localStorage.setItem("watchlist", JSON.stringify(newWatchlist));
  };

  const getFilteredAuctions = () => {
    switch (filter) {
      case "won":
        return getWonAuctions();
      case "watchlist":
        return getWatchlistAuctions();
      case "completed":
        return getCompletedAuctions();
      default:
        return getWonAuctions();
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUserHighestBid = (auction) => {
    const userBids = auction.bids.filter((bid) => bid.userId === userId || bid.bidder === userId);
    if (userBids.length === 0) return 0;
    return Math.max(...userBids.map((bid) => bid.amount));
  };

  if (loading) {
    return (
      <div className="watchlist-loading">
        <div className="loading-spinner"></div>
        <p>Loading your auctions...</p>
      </div>
    );
  }

  const filteredAuctions = getFilteredAuctions();
  const wonCount = getWonAuctions().length;
  const watchlistCount = getWatchlistAuctions().length;
  const completedCount = getCompletedAuctions().length;

  return (
    <div className="watchlist-wrapper">
      <div className="watchlist-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="watchlist-container">
        <div className="watchlist-header">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back
          </button>

          <div className="header-content">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <h1 className="watchlist-title">My Collection</h1>
            <p className="watchlist-subtitle">
              Track your wins, saves, and completed auctions
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="summary-card won">
            <div className="summary-icon">🏆</div>
            <div className="summary-value">{wonCount}</div>
            <div className="summary-label">Auctions Won</div>
          </div>
          <div className="summary-card watchlist">
            <div className="summary-icon">⭐</div>
            <div className="summary-value">{watchlistCount}</div>
            <div className="summary-label">Saved Items</div>
          </div>
          <div className="summary-card completed">
            <div className="summary-icon">✅</div>
            <div className="summary-value">{completedCount}</div>
            <div className="summary-label">Completed</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "won" ? "active" : ""}`}
            onClick={() => setFilter("won")}
          >
            <span className="tab-icon">🏆</span>
            Auctions Won
            <span className="tab-count">{wonCount}</span>
          </button>
          <button
            className={`filter-tab ${filter === "watchlist" ? "active" : ""}`}
            onClick={() => setFilter("watchlist")}
          >
            <span className="tab-icon">⭐</span>
            Watchlist
            <span className="tab-count">{watchlistCount}</span>
          </button>
          <button
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            <span className="tab-icon">✅</span>
            All Completed
            <span className="tab-count">{completedCount}</span>
          </button>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === "won" && "🏆"}
              {filter === "watchlist" && "⭐"}
              {filter === "completed" && "📋"}
            </div>
            <h3>
              {filter === "won" && "No Auctions Won Yet"}
              {filter === "watchlist" && "No Saved Auctions"}
              {filter === "completed" && "No Completed Auctions"}
            </h3>
            <p>
              {filter === "won" && "Win your first auction by placing the highest bid!"}
              {filter === "watchlist" && "Save auctions you're interested in by clicking the star icon"}
              {filter === "completed" && "Completed auctions will appear here"}
            </p>
            <button
              className="browse-btn"
              onClick={() => navigate("/auctions")}
            >
              Browse Auctions
            </button>
          </div>
        ) : (
          <div className="auctions-grid">
            {filteredAuctions.map((auction) => {
              const isEnded = new Date(auction.endTime) <= new Date();
              const isWon = filter === "won" || (getUserHighestBid(auction) === auction.currentBid && isEnded);
              const isInWatchlist = watchlist.includes(auction._id);

              return (
                <div key={auction._id} className="auction-item">
                  <div className="auction-header">
                    <div className="status-badges">
                      {isEnded ? (
                        <span className="status-badge ended">Ended</span>
                      ) : (
                        <span className="status-badge active">Active</span>
                      )}
                      {isWon && <span className="status-badge won">Won</span>}
                      {auction.isPaid && (
                        <span className="status-badge paid">Paid</span>
                      )}
                    </div>
                    <button
                      className={`watchlist-btn ${isInWatchlist ? "active" : ""}`}
                      onClick={() => toggleWatchlist(auction._id)}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  </div>

                  <div className="auction-body">
                    <h3 className="auction-title">{auction.title}</h3>
                    <p className="auction-description">{auction.description}</p>

                    <div className="auction-details">
                      {filter === "won" && (
                        <div className="detail-box winner">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          <div>
                            <span className="detail-label">Winning Bid</span>
                            <span className="detail-value">${getUserHighestBid(auction)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="detail-box">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                        </svg>
                        <div>
                          <span className="detail-label">Current Bid</span>
                          <span className="detail-value">${auction.currentBid}</span>
                        </div>
                      </div>

                      <div className="detail-box">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        <div>
                          <span className="detail-label">Total Bids</span>
                          <span className="detail-value">{auction.bids.length}</span>
                        </div>
                      </div>

                      <div className="detail-box">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                        <div>
                          <span className="detail-label">Status</span>
                          <span className="detail-value">
                            {getTimeRemaining(auction.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="auction-footer">
                    {isWon && !auction.isPaid && (
                      <button
                        className="action-btn pay"
                        onClick={() => navigate(`/payment/${auction._id}`)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                        Pay ${auction.currentBid}
                      </button>
                    )}
                    {!isEnded && (
                      <button
                        className="action-btn view"
                        onClick={() => navigate("/auctions")}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                        View Auction
                      </button>
                    )}
                    {isWon && auction.isPaid && (
                      <div className="paid-status">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Payment Complete
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

export default Watchlist;
