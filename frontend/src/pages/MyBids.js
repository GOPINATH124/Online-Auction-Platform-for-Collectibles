import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../componets/ToastContainer";
import "./MyBids.css";

function MyBids() {
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState("all"); // all, active, won, lost
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const toast = useToast();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMyBids();
  }, [token, navigate]);

  // Update time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchMyBids = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auctions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("All auctions:", res.data);
      console.log("Current userId:", userId);

      // Filter auctions where user has placed bids
      const myBidAuctions = res.data.filter((auction) => {
        const hasBid = auction.bids.some((bid) => {
          console.log("Checking bid:", bid, "against userId:", userId);
          // Compare with both bidder._id (populated) and bidder string
          const bidderId = typeof bid.bidder === 'object' ? bid.bidder._id : bid.bidder;
          return bidderId === userId || bid.userId === userId;
        });
        return hasBid;
      });

      console.log("My bid auctions:", myBidAuctions);

      setAuctions(myBidAuctions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bids:", error);
      toast.error("Failed to load your bids");
      setLoading(false);
    }
  };

  const getUserBids = (auction) => {
    return auction.bids.filter((bid) => {
      const bidderId = typeof bid.bidder === 'object' ? bid.bidder._id : bid.bidder;
      return bidderId === userId || bid.userId === userId;
    });
  };

  const getUserHighestBid = (auction) => {
    const userBids = getUserBids(auction);
    if (userBids.length === 0) return 0;
    return Math.max(...userBids.map((bid) => bid.amount));
  };

  const isWinning = (auction) => {
    if (new Date(auction.endTime) > new Date()) {
      // Auction still active - check if user has highest bid
      const highestBid = getUserHighestBid(auction);
      return highestBid === auction.currentBid;
    }
    return false;
  };

  const hasWon = (auction) => {
    if (new Date(auction.endTime) <= new Date()) {
      // Auction ended - check if user has highest bid
      const highestBid = getUserHighestBid(auction);
      return highestBid === auction.currentBid;
    }
    return false;
  };

  const getFilteredAuctions = () => {
    switch (filter) {
      case "active":
        return auctions.filter((a) => new Date(a.endTime) > new Date());
      case "won":
        return auctions.filter((a) => hasWon(a));
      case "lost":
        return auctions.filter(
          (a) => new Date(a.endTime) <= new Date() && !hasWon(a)
        );
      default:
        return auctions;
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = currentTime;
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="mybids-loading">
        <div className="loading-spinner"></div>
        <p>Loading your bids...</p>
      </div>
    );
  }

  const filteredAuctions = getFilteredAuctions();

  return (
    <div className="mybids-wrapper">
      <div className="mybids-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="mybids-container">
        <div className="mybids-header">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back
          </button>

          <div className="header-content">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <h1 className="mybids-title">My Bids</h1>
            <p className="mybids-subtitle">
              Track all auctions you've participated in
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
            <span className="tab-count">{auctions.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
            <span className="tab-count">
              {auctions.filter((a) => new Date(a.endTime) > new Date()).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === "won" ? "active" : ""}`}
            onClick={() => setFilter("won")}
          >
            Won
            <span className="tab-count">
              {auctions.filter((a) => hasWon(a)).length}
            </span>
          </button>
          <button
            className={`filter-tab ${filter === "lost" ? "active" : ""}`}
            onClick={() => setFilter("lost")}
          >
            Lost
            <span className="tab-count">
              {
                auctions.filter(
                  (a) => new Date(a.endTime) <= new Date() && !hasWon(a)
                ).length
              }
            </span>
          </button>
        </div>

        {/* Bids List */}
        {filteredAuctions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No bids found</h3>
            <p>Start bidding on auctions to see them here!</p>
            <button
              className="browse-btn"
              onClick={() => navigate("/auctions")}
            >
              Browse Auctions
            </button>
          </div>
        ) : (
          <div className="bids-grid">
            {filteredAuctions.map((auction) => {
              const isActive = new Date(auction.endTime) > new Date();
              const won = hasWon(auction);
              const winning = isWinning(auction);
              const userHighestBid = getUserHighestBid(auction);
              const userBidsCount = getUserBids(auction).length;

              return (
                <div 
                  key={auction._id} 
                  className="bid-card"
                  onClick={() => navigate(`/auction/${auction._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bid-card-header">
                    <div className="status-badges">
                      {isActive ? (
                        <span className="badge active">Active</span>
                      ) : (
                        <span className="badge ended">Ended</span>
                      )}
                      {winning && <span className="badge winning">Winning</span>}
                      {won && <span className="badge won">Won</span>}
                      {!isActive && !won && (
                        <span className="badge lost">Lost</span>
                      )}
                    </div>
                  </div>

                  <div className="bid-card-body">
                    <h3 className="auction-title">{auction.title}</h3>
                    <p className="auction-description">{auction.description}</p>

                    <div className="bid-info-grid">
                      <div className="info-box">
                        <span className="info-label">Your Highest Bid</span>
                        <span className="info-value highlight">
                          ${userHighestBid}
                        </span>
                      </div>
                      <div className="info-box">
                        <span className="info-label">Current Bid</span>
                        <span className="info-value">${auction.currentBid}</span>
                      </div>
                      <div className="info-box">
                        <span className="info-label">Total Bids</span>
                        <span className="info-value">{auction.bids.length}</span>
                      </div>
                      <div className="info-box">
                        <span className="info-label">Your Bids</span>
                        <span className="info-value">{userBidsCount}</span>
                      </div>
                    </div>

                    <div className="time-info">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <span>{getTimeRemaining(auction.endTime)}</span>
                    </div>
                  </div>

                  <div className="bid-card-footer">
                    {isActive && !winning && (
                      <button
                        className="action-btn bid-again"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/auctions");
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                        </svg>
                        Bid Again
                      </button>
                    )}
                    {won && !auction.isPaid && (
                      <button
                        className="action-btn pay-now"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/payment/${auction._id}`);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                        Pay Now
                      </button>
                    )}
                    {won && auction.isPaid && (
                      <div className="paid-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Paid
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

export default MyBids;
